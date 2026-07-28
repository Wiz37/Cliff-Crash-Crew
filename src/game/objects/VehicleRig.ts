import Phaser from 'phaser';
import type { VehicleSpec } from '../data/vehicles';

export type WheelSide = 'left' | 'right';

export class VehicleRig {
  readonly chassis: Phaser.Physics.Matter.Image;
  readonly leftWheel: Phaser.Physics.Matter.Image;
  readonly rightWheel: Phaser.Physics.Matter.Image;
  readonly spec: VehicleSpec;

  private readonly scene: Phaser.Scene;
  private readonly leftConstraint: MatterJS.ConstraintType;
  private readonly rightConstraint: MatterJS.ConstraintType;
  private readonly wheelRadius: number;
  private readonly groundContacts = new Set<string>();
  private leftAttached = true;
  private rightAttached = true;
  private launched = false;
  private driveTargetSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: VehicleSpec) {
    this.scene = scene;
    this.spec = spec;

    const bodyWidth = Math.min(390, 270 * spec.length);
    const bodyHeight = 74 * spec.height;
    const wheelRadius = 29 * spec.wheelScale;
    this.wheelRadius = wheelRadius;
    const wheelOffsetX = bodyWidth * 0.32;
    const wheelOffsetY = bodyHeight * 0.58;
    const noSelfCollision = scene.matter.world.nextGroup(true);

    this.chassis = scene.matter.add.image(x, y, `vehicle-${spec.id}`, undefined, {
      friction: 0.5,
      frictionAir: 0.008,
      restitution: 0.24,
      density: 0.0032 * spec.mass,
      sleepThreshold: 50,
    });
    this.chassis.setScale(0.78);
    this.chassis.setRectangle(bodyWidth, bodyHeight, { chamfer: { radius: Math.min(18, bodyHeight * 0.22) } });
    this.chassis.setCollisionGroup(noSelfCollision);
    this.chassis.setDepth(30);
    this.chassis.setData('rig', this);
    this.chassis.setData('part', 'chassis');
    (this.chassis.body as MatterJS.BodyType).label = 'vehicle-chassis';

    this.leftWheel = this.createWheel(x - wheelOffsetX, y + wheelOffsetY, wheelRadius, noSelfCollision, 'left');
    this.rightWheel = this.createWheel(x + wheelOffsetX, y + wheelOffsetY, wheelRadius, noSelfCollision, 'right');

    this.leftConstraint = scene.matter.add.constraint(
      this.chassis.body as MatterJS.BodyType,
      this.leftWheel.body as MatterJS.BodyType,
      0,
      0.82,
      {
        pointA: { x: -wheelOffsetX, y: wheelOffsetY },
        damping: 0.16,
        stiffness: 0.82,
      },
    );
    this.rightConstraint = scene.matter.add.constraint(
      this.chassis.body as MatterJS.BodyType,
      this.rightWheel.body as MatterJS.BodyType,
      0,
      0.82,
      {
        pointA: { x: wheelOffsetX, y: wheelOffsetY },
        damping: 0.16,
        stiffness: 0.82,
      },
    );

    this.setStatic(true);
  }

  private createWheel(
    x: number,
    y: number,
    radius: number,
    group: number,
    side: WheelSide,
  ): Phaser.Physics.Matter.Image {
    const wheel = this.scene.matter.add.image(x, y, 'wheel', undefined, {
      friction: 1.1,
      frictionStatic: 1.5,
      frictionAir: 0.008,
      restitution: 0.34,
      density: 0.0022 * this.spec.mass,
      sleepThreshold: 50,
    });
    wheel.setDisplaySize(radius * 2.1, radius * 2.1);
    wheel.setCircle(radius);
    wheel.setCollisionGroup(group);
    wheel.setDepth(31);
    wheel.setData('rig', this);
    wheel.setData('part', `${side}-wheel`);
    (wheel.body as MatterJS.BodyType).label = 'vehicle-wheel';
    return wheel;
  }

  setStatic(value: boolean): void {
    this.chassis.setStatic(value);
    this.leftWheel.setStatic(value);
    this.rightWheel.setStatic(value);
  }

  beginDrive(targetSpeed: number): void {
    if (this.launched) return;
    this.launched = true;
    this.driveTargetSpeed = Phaser.Math.Clamp(targetSpeed, 12, 34);
    this.setStatic(false);

    [this.chassis, this.leftWheel, this.rightWheel].forEach((part) => {
      part.setVelocity(0, 0);
      part.setAngularVelocity(0);
      part.setAwake();
    });
  }

  launch(velocityX: number, _velocityY = 0): void {
    this.beginDrive(velocityX);
  }

  applyDrive(deltaSeconds: number): void {
    if (!this.launched) return;

    const dt = Phaser.Math.Clamp(deltaSeconds, 0, 0.034);
    const targetAngularVelocity = Phaser.Math.Clamp(
      this.driveTargetSpeed / Math.max(26, this.wheelRadius * 1.15),
      0.2,
      0.72,
    );
    const response = 1 - Math.exp(-dt * (4.2 + this.spec.power));

    const spinWheel = (wheel: Phaser.Physics.Matter.Image): void => {
      const body = wheel.body as MatterJS.BodyType;
      const nextAngularVelocity = body.angularVelocity
        + (targetAngularVelocity - body.angularVelocity) * response;
      wheel.setAngularVelocity(nextAngularVelocity);
      wheel.setAwake();
    };

    if (this.leftAttached) spinWheel(this.leftWheel);
    if (this.rightAttached) spinWheel(this.rightWheel);

    const chassisBody = this.chassis.body as MatterJS.BodyType;
    const speedDeficit = Phaser.Math.Clamp(
      (this.driveTargetSpeed - chassisBody.velocity.x) / this.driveTargetSpeed,
      0,
      1,
    );

    if (this.chassis.x < 1435 && speedDeficit > 0) {
      const driveForce = 0.00048
        * this.spec.mass
        * (0.75 + this.spec.power * 0.25)
        * speedDeficit;
      this.chassis.applyForce(new Phaser.Math.Vector2(driveForce, 0));
    }

    if (this.isGrounded) {
      const damping = Math.pow(0.18, dt);
      this.chassis.setAngularVelocity(chassisBody.angularVelocity * damping);
    }
  }

  setGroundContact(contactId: string, active: boolean): void {
    if (active) this.groundContacts.add(contactId);
    else this.groundContacts.delete(contactId);
  }

  applyAirControl(direction: number, deltaSeconds: number): void {
    if (!this.launched || direction === 0) return;

    const body = this.chassis.body as MatterJS.BodyType;
    const controlStrength = this.isGrounded ? 0.012 : 0.17;
    const maximumRotationSpeed = this.isGrounded ? 0.05 : 0.24;
    const next = Phaser.Math.Clamp(
      body.angularVelocity + direction * this.spec.spin * deltaSeconds * controlStrength,
      -maximumRotationSpeed,
      maximumRotationSpeed,
    );
    this.chassis.setAngularVelocity(next);
  }

  detachWheel(side: WheelSide): boolean {
    if (side === 'left' && this.leftAttached) {
      this.leftAttached = false;
      this.scene.matter.world.removeConstraint(this.leftConstraint);
      this.leftWheel.setCollisionGroup(0);
      const chassisBody = this.chassis.body as MatterJS.BodyType;
      this.leftWheel.setVelocity(chassisBody.velocity.x - 2, chassisBody.velocity.y - 4);
      this.leftWheel.setAngularVelocity(-0.2);
      return true;
    }
    if (side === 'right' && this.rightAttached) {
      this.rightAttached = false;
      this.scene.matter.world.removeConstraint(this.rightConstraint);
      this.rightWheel.setCollisionGroup(0);
      const chassisBody = this.chassis.body as MatterJS.BodyType;
      this.rightWheel.setVelocity(chassisBody.velocity.x + 2, chassisBody.velocity.y - 4);
      this.rightWheel.setAngularVelocity(0.2);
      return true;
    }
    return false;
  }

  get isGrounded(): boolean {
    return this.groundContacts.size > 0;
  }

  get speed(): number {
    return (this.chassis.body as MatterJS.BodyType).speed;
  }

  get rotation(): number {
    return this.chassis.rotation;
  }

  get x(): number {
    return this.chassis.x;
  }

  get y(): number {
    return this.chassis.y;
  }

  destroy(): void {
    this.scene.matter.world.removeConstraint(this.leftConstraint);
    this.scene.matter.world.removeConstraint(this.rightConstraint);
    this.chassis.destroy();
    this.leftWheel.destroy();
    this.rightWheel.destroy();
  }
}
