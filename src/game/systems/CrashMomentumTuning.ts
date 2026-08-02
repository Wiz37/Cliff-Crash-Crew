import Phaser from 'phaser';
import { VehicleRig } from '../objects/VehicleRig';

let installed = false;

function launchBrokenBlock(
  scene: any,
  block: Phaser.Physics.Matter.Image,
  velocityX: number,
  velocityY: number,
  angularVelocity: number,
  sensorDuration = 125,
): void {
  if (!block.active) return;

  const body = block.body as MatterJS.BodyType;
  block.setMass(Math.max(0.24, body.mass * 0.42));
  block.setSensor(true);
  block.setVelocity(velocityX, velocityY);
  block.setAngularVelocity(angularVelocity);
  block.setAwake();

  scene.time.delayedCall(sensorDuration, () => {
    if (!block.active) return;
    block.setSensor(false);
    block.setAwake();
  });
}

/**
 * Turns tower collisions into arcade demolition. Blocks briefly stop behaving
 * like a solid wall, nearby pieces join the blast, and the vehicle loses a
 * controlled amount of speed instead of being multiplied toward zero by every
 * simultaneous collision. Terrain still limits rotation, while true airtime
 * receives responsive front- and back-flip control.
 */
export function installCrashMomentumTuning(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const rigProto = VehicleRig.prototype as any;

  rigProto.registerBlockImpact = function (_impactSpeed: number): void {
    const body = this.chassis.body as MatterJS.BodyType;
    const now = this.scene?.time?.now ?? 0;
    const previousImpactAt = this.lastDemolitionImpactAt ?? -Infinity;

    if (now - previousImpactAt > 260) this.demolitionImpactChain = 0;
    else this.demolitionImpactChain = Math.min(5, (this.demolitionImpactChain ?? 0) + 1);
    this.lastDemolitionImpactAt = now;

    this.impactBraking = false;
    this.impactBrakeLevel = 0;

    const chain = this.demolitionImpactChain ?? 0;
    const minimumFraction = Math.max(0.5, 0.82 - chain * 0.075);
    const targetSpeed = Math.max(1, this.driveTargetSpeed ?? body.speed);
    const minimumForwardSpeed = targetSpeed * minimumFraction;
    const retainedForwardSpeed = Math.max(body.velocity.x * 0.96, minimumForwardSpeed);

    this.chassis.setVelocity(retainedForwardSpeed, body.velocity.y * 0.94);
    this.chassis.setAngularVelocity(body.angularVelocity * 0.96);

    const roadAngularVelocity = retainedForwardSpeed / Math.max(18, this.wheelRadius ?? 29);
    this.leftWheel.setAngularVelocity(roadAngularVelocity);
    this.rightWheel.setAngularVelocity(roadAngularVelocity);
  };

  rigProto.applyAirControl = function (direction: number, deltaSeconds: number): void {
    if (!this.launched || direction === 0) return;

    const dt = Phaser.Math.Clamp(deltaSeconds, 0, 0.034);
    const body = this.chassis.body as MatterJS.BodyType;

    if (this.isGrounded) {
      const groundedLimit = 0.018;
      const groundedTarget = direction * groundedLimit;
      const groundedResponse = 1 - Math.exp(-dt * 5);
      this.chassis.setAngularVelocity(
        Phaser.Math.Clamp(
          body.angularVelocity + (groundedTarget - body.angularVelocity) * groundedResponse,
          -groundedLimit,
          groundedLimit,
        ),
      );
      return;
    }

    const airborneLimit = Phaser.Math.Clamp(0.46 + this.spec.spin * 0.045, 0.48, 0.58);
    const desiredAngularVelocity = direction * airborneLimit;
    const airborneResponse = 1 - Math.exp(-dt * (11 + this.spec.spin * 2.2));

    this.chassis.setAngularVelocity(
      body.angularVelocity
        + (desiredAngularVelocity - body.angularVelocity) * airborneResponse,
    );
  };

  const sceneProto = GameSceneClass.prototype as any;
  const baseCreate = sceneProto.create;
  const baseBreakBlock = sceneProto.breakBlock;
  const baseHandleImpact = sceneProto.handleImpact;

  sceneProto.create = function (...args: unknown[]): void {
    baseCreate.apply(this, args);

    const blocks = (this.blockBodies ?? []) as Phaser.Physics.Matter.Image[];
    blocks.forEach((block) => {
      const body = block.body as MatterJS.BodyType;
      block.setMass(Math.max(0.42, body.mass * 0.36));
      body.friction = 0.3;
      body.frictionStatic = 0.46;
      body.frictionAir = 0.006;
      body.restitution = 0.42;
      body.sleepThreshold = 36;
    });
  };

  sceneProto.breakBlock = function (
    block: Phaser.Physics.Matter.Image,
    speed: number,
    rig: VehicleRig,
  ): void {
    if (block.getData('broken')) {
      baseBreakBlock.call(this, block, speed, rig);
      return;
    }

    const incomingBody = rig.chassis.body as MatterJS.BodyType;
    const incomingX = incomingBody.velocity.x;
    const incomingY = incomingBody.velocity.y;
    const direction = Math.sign(incomingX) || 1;
    const blastStrength = Phaser.Math.Clamp(speed / 18, 0.8, 1.8);

    this.demolitionImpactUntil = this.time.now + 165;
    rig.registerBlockImpact(speed);
    baseBreakBlock.call(this, block, speed, rig);

    const restoredBody = rig.chassis.body as MatterJS.BodyType;
    const forwardCarry = Math.max(restoredBody.velocity.x, rig.targetSpeed * 0.68);
    rig.chassis.setVelocity(forwardCarry, restoredBody.velocity.y);

    launchBrokenBlock(
      this,
      block,
      Math.max(incomingX * 0.62, direction * 7.5) + direction * 5.5 * blastStrength,
      incomingY * 0.18 - 7.5 * blastStrength,
      Phaser.Math.FloatBetween(-0.82, 0.82),
    );

    const blocks = (this.blockBodies ?? []) as Phaser.Physics.Matter.Image[];
    const chainBlocks = blocks
      .filter((nearby) => {
        if (!nearby.active || nearby === block || nearby.getData('broken')) return false;
        return Phaser.Math.Distance.Between(block.x, block.y, nearby.x, nearby.y) <= 330;
      })
      .sort((a, b) => (
        Phaser.Math.Distance.Between(block.x, block.y, a.x, a.y)
        - Phaser.Math.Distance.Between(block.x, block.y, b.x, b.y)
      ))
      .slice(0, 6);

    chainBlocks.forEach((nearby, index) => {
      const dx = nearby.x - block.x;
      const dy = nearby.y - block.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const falloff = Phaser.Math.Clamp(1 - distance / 380, 0.25, 1);
      const chainSpeed = speed * (0.76 - index * 0.055) * falloff;

      baseBreakBlock.call(this, nearby, Math.max(6, chainSpeed), rig);
      launchBrokenBlock(
        this,
        nearby,
        direction * (6.5 + blastStrength * 6.2) * falloff + (dx / distance) * 5,
        -(5.5 + blastStrength * 7.2) * falloff + (dy / distance) * 1.5,
        Phaser.Math.FloatBetween(-0.72, 0.72),
        115 + index * 12,
      );
    });

    this.explodeParticles(
      block.x,
      block.y,
      'spark',
      34 + Math.round(blastStrength * 14),
      block.getData('baseColor') as number,
      1.45 + blastStrength * 0.3,
    );
    this.cameras.main.shake(100 + blastStrength * 70, 0.004 + blastStrength * 0.003);
  };

  sceneProto.handleImpact = function (
    speed: number,
    point: { x: number; y: number },
  ): void {
    const demolitionImpact = this.time.now <= (this.demolitionImpactUntil ?? -1);

    if (demolitionImpact) {
      // Keep sound, particles, scoring, and camera punch without the global
      // slow-motion freeze used for hard ground impacts.
      baseHandleImpact.call(this, Math.min(speed, 11.8), point);
      this.matter.world.engine.timing.timeScale = 1;
      return;
    }

    baseHandleImpact.call(this, speed, point);
  };
}
