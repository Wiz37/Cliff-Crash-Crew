import Phaser from 'phaser';
import { VehicleRig } from '../objects/VehicleRig';

let installed = false;

/**
 * Gives block impacts an arcade-demolition feel. Cars transfer momentum into the
 * pile and slow progressively instead of entering a permanent braking state.
 * Ground rotation stays restricted, while airborne controls are strong enough
 * to complete intentional flips during normal jump airtime.
 */
export function installCrashMomentumTuning(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const rigProto = VehicleRig.prototype as any;

  rigProto.registerBlockImpact = function (impactSpeed: number): void {
    const body = this.chassis.body as MatterJS.BodyType;
    const referenceSpeed = Math.max(1, this.driveTargetSpeed ?? body.speed);
    const severity = Phaser.Math.Clamp(impactSpeed / referenceSpeed, 0, 1);
    const retainedMomentum = Phaser.Math.Linear(0.91, 0.76, severity);

    // A block hit consumes momentum, but never disables the drivetrain or forces
    // the vehicle to brake all the way to zero.
    this.impactBraking = false;
    this.impactBrakeLevel = 0;
    this.chassis.setVelocity(
      body.velocity.x * retainedMomentum,
      body.velocity.y * retainedMomentum,
    );
    this.chassis.setAngularVelocity(body.angularVelocity * 0.88);

    const wheelRetention = Phaser.Math.Linear(0.94, 0.8, severity);
    this.leftWheel.setAngularVelocity(
      (this.leftWheel.body as MatterJS.BodyType).angularVelocity * wheelRetention,
    );
    this.rightWheel.setAngularVelocity(
      (this.rightWheel.body as MatterJS.BodyType).angularVelocity * wheelRetention,
    );
  };

  rigProto.applyAirControl = function (direction: number, deltaSeconds: number): void {
    if (!this.launched || direction === 0) return;

    const dt = Phaser.Math.Clamp(deltaSeconds, 0, 0.034);
    const body = this.chassis.body as MatterJS.BodyType;

    if (this.isGrounded) {
      const groundedLimit = 0.026;
      const groundedAcceleration = this.spec.spin * dt * 0.055;
      this.chassis.setAngularVelocity(
        Phaser.Math.Clamp(
          body.angularVelocity + direction * groundedAcceleration,
          -groundedLimit,
          groundedLimit,
        ),
      );
      return;
    }

    const airborneLimit = Phaser.Math.Clamp(0.29 + this.spec.spin * 0.045, 0.3, 0.39);
    const airborneAcceleration = this.spec.spin * dt * 1.35;
    this.chassis.setAngularVelocity(
      Phaser.Math.Clamp(
        body.angularVelocity + direction * airborneAcceleration,
        -airborneLimit,
        airborneLimit,
      ),
    );
  };

  const sceneProto = GameSceneClass.prototype as any;
  const baseCreate = sceneProto.create;
  const baseBreakBlock = sceneProto.breakBlock;
  const baseHandleImpact = sceneProto.handleImpact;

  sceneProto.create = function (...args: unknown[]): void {
    baseCreate.apply(this, args);

    // Lighter, livelier blocks absorb energy by moving through the pile instead
    // of acting like a solid wall that instantly stops the vehicle.
    const blocks = (this.blockBodies ?? []) as Phaser.Physics.Matter.Image[];
    blocks.forEach((block) => {
      const body = block.body as MatterJS.BodyType;
      block.setMass(Math.max(0.55, body.mass * 0.58));
      body.friction = 0.46;
      body.frictionStatic = 0.7;
      body.frictionAir = 0.008;
      body.restitution = 0.3;
    });
  };

  sceneProto.breakBlock = function (
    block: Phaser.Physics.Matter.Image,
    speed: number,
    rig: VehicleRig,
  ): void {
    const alreadyBroken = Boolean(block?.getData?.('broken'));
    if (alreadyBroken) {
      baseBreakBlock.call(this, block, speed, rig);
      return;
    }

    rig.registerBlockImpact(speed);
    baseBreakBlock.call(this, block, speed, rig);

    const vehicleBody = rig.chassis.body as MatterJS.BodyType;
    const direction = Math.sign(vehicleBody.velocity.x) || 1;
    const blastStrength = Phaser.Math.Clamp(speed / 22, 0.65, 1.55);

    block.setVelocity(
      vehicleBody.velocity.x * 0.48 + direction * 4.5 * blastStrength,
      vehicleBody.velocity.y * 0.22 - 6.5 * blastStrength,
    );
    block.setAngularVelocity(Phaser.Math.FloatBetween(-0.58, 0.58));
    block.setAwake();

    const blocks = (this.blockBodies ?? []) as Phaser.Physics.Matter.Image[];
    blocks.forEach((nearby) => {
      if (!nearby.active || nearby === block) return;

      const dx = nearby.x - block.x;
      const dy = nearby.y - block.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > 390) return;

      const falloff = 1 - distance / 390;
      nearby.applyForce(
        new Phaser.Math.Vector2(
          direction * (0.011 + blastStrength * 0.012) * falloff + (dx / distance) * 0.004 * falloff,
          -(0.012 + blastStrength * 0.014) * falloff,
        ),
      );
      const nearbyBody = nearby.body as MatterJS.BodyType;
      nearby.setAngularVelocity(
        nearbyBody.angularVelocity + Phaser.Math.FloatBetween(-0.22, 0.22) * falloff,
      );
      nearby.setAwake();
    });

    this.explodeParticles(
      block.x,
      block.y,
      'spark',
      24 + Math.round(blastStrength * 10),
      block.getData('baseColor') as number,
      1.25 + blastStrength * 0.28,
    );
    this.cameras.main.shake(90 + blastStrength * 65, 0.003 + blastStrength * 0.0025);
  };

  sceneProto.handleImpact = function (
    speed: number,
    point: { x: number; y: number },
  ): void {
    const tweens = this.tweens as any;
    const originalAddCounter = tweens.addCounter.bind(tweens);

    // Keep the impact punch, but avoid the long 42%-speed freeze that makes a
    // moving crash look like the car stopped dead against the first block.
    tweens.addCounter = (config: any) => {
      if (config?.from === 0.42 && config?.to === 1) {
        return originalAddCounter({ ...config, from: 0.76, duration: 210 });
      }
      return originalAddCounter(config);
    };

    try {
      baseHandleImpact.call(this, speed, point);
    } finally {
      tweens.addCounter = originalAddCounter;
    }

    if (this.matter.world.engine.timing.timeScale < 0.76) {
      this.matter.world.engine.timing.timeScale = 0.76;
    }
  };
}
