import Phaser from 'phaser';
import type { VehicleSpec } from '../data/vehicles';

export type WheelSide = 'left' | 'right';

const MPH_TO_MATTER_SPEED = 0.62;
const MIN_TARGET_MPH = 20;
const MAX_TARGET_MPH = 80;

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
  private driveTargetMph = MIN_TARGET_MPH;

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
      friction: 0.72,
      frictionAir: 0.0035,
      restitution: 0.12,
      density: 0.0032 * spec.mass,
      sleepThreshold: 60,
    });
    this.chassis.setScale(0.78);
    this.chassis.setRectangle(bodyWidth, bodyHeight, {
      chamfer: { radius: Math.min(18, bodyHeight * 0.22) },
    });
    this.chassis.setCollisionGroup(noSelfCollision);
    this.chassis.setDepth(30);
    this.chassis.setData('rig', this);
    this.chassis.setData('part', 'chassis');
    (this.chassis.body as MatterJS.BodyType).label = 'vehicle-chassis';

    this.leftWheel = this.createWheel(
      x - wheelOffsetX,
      y + wheelOffsetY,
      wheelRadius,
      noSelfCollision,
      'left',
    );
    this.rightWheel = this.createWheel(
      x + wheelOffsetX,
      y + wheelOffsetY,
      wheelRadius,
      noSelfCollision,
      'right',
    );

    this.leftConstraint = scene.matter.add.constraint(
      this.chassis.body as MatterJS.BodyType,
      this.leftWheel.body as MatterJS.BodyType,
      0,
      0.92,
      {
        pointA: { x: -wheelOffsetX, y: wheelOffsetY },
        damping: 0.25,
        stiffness: 0.92,
      },
    );
    this.rightConstraint = scene.matter.add.constraint(
      this.chassis.body as MatterJS.BodyType,
      this.rightWheel.body as MatterJS.BodyType,
      0,
      0.92,
      {
        pointA: { x: wheelOffsetX, y: wheelOffsetY },
        damping: 0.25,
        stiffness: 0.92,
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
      friction: 1.7,
      frictionStatic: 2.4,
      frictionAir: 0.006,
      restitution: 0.12,
      density: 0.0025 * this.spec.mass,
      sleepThreshold: 60,
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

  beginDrive(targetMph: number): void {
    if (this.launched) return;
    this.launched = true;
    this.driveTargetMph = Phaser.Math.Clamp(targetMph, MIN_TARGET_MPH, MAX_TARGET_MPH);
    this.driveTargetSpeed = this.driveTargetMph * MPH_TO_MATTER_SPEED;
    this.setStatic(false);

    [this.chassis, this.leftWheel, this.rightWheel].forEach((part) => {
      part.setVelocity(0, 0);
      part.setAngularVelocity(0);
      part.setAwake();
    });
  }

  launch(targetMph: number, _velocityY = 0): void {
    this.beginDrive(targetMph);
  }

  applyDrive(deltaSeconds: number): void {
    if (!this.launched) return;

    const dt = Phaser.Math.Clamp(deltaSeconds, 0, 0.034);
    const chassisBody = this.chassis.body as MatterJS.BodyType;
    const forwardSpeed = Math.max(0, chassisBody.velocity.x);
    const speedDeficit = Phaser.Math.Clamp(
      (this.driveTargetSpeed - forwardSpeed) / Math.max(1, this.driveTargetSpeed),
      0,
      1,
    );

    // The chassis receives the drive force. Wheel rotation is synchronized to
    // road speed so the tires do not sit there free-spinning at low speed.
    if (this.isGrounded && speedDeficit > 0) {
      const lowSpeedBoost = Phaser.Math.Linear(1.5, 0.82, forwardSpeed / Math.max(1, this.driveTargetSpeed));
      const driveForce = 0.00145
        * this.spec.mass
        * (0.88 + this.spec.power * 0.34)
        * speedDeficit
        * Phaser.Math.Clamp(lowSpeedBoost, 0.82, 1.5);
      this.chassis.applyForce(new Phaser.Math.Vector2(driveForce, 0));
    }

    if (chassisBody.velocity.x > this.driveTargetSpeed) {
      this.chassis.setVelocity(this.driveTargetSpeed, chassisBody.velocity.y);
    }

    const rollingAngularVelocity = forwardSpeed / Math.max(18, this.wheelRadius);
    const maximumSlip = this.isGrounded ? 0.12 : 0.32;
    const throttleSlip = speedDeficit * maximumSlip;
    const desiredWheelAngularVelocity = Phaser.Math.Clamp(
      rollingAngularVelocity + throttleSlip,
      0,
      1.45,
    );
    const wheelResponse = 1 - Math.exp(-dt * (this.isGrounded ? 13 : 4.5));

    const syncWheel = (wheel: Phaser.Physics.Matter.Image): void => {
      const body = wheel.body as MatterJS.BodyType;
      const nextAngularVelocity = body.angularVelocity
        + (desiredWheelAngularVelocity - body.angularVelocity) * wheelResponse;
      wheel.setAngularVelocity(nextAngularVelocity);
      wheel.setAwake();
    };

    if (this.leftAttached) syncWheel(this.leftWheel);
    if (this.rightAttached) syncWheel(this.rightWheel);

    if (this.isGrounded) {
      const rotationDamping = Math.pow(0.045, dt);
      this.chassis.setAngularVelocity(chassisBody.angularVelocity * rotationDamping);

      if (forwardSpeed > 20) {
        const downforce = 0.00013
          * this.spec.mass
          * Phaser.Math.Clamp(forwardSpeed / this.driveTargetSpeed, 0, 1);
        this.chassis.applyForce(new Phaser.Math.Vector2(0, downforce));
      }
    }
  }

  setGroundContact(contactId: string, active: boolean): void {
    if (active) this.groundContacts.add(contactId);
    else this.groundContacts.delete(contactId);
  }

  applyAirControl(direction: number, deltaSeconds: number): void {
    if (!this.launched || direction === 0) return;

    const body = this.chassis.body as MatterJS.BodyType;
    const controlStrength = this.isGrounded ? 0.008 : 0.17;
    const maximumRotationSpeed = this.isGrounded ? 0.035 : 0.24;
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

  get targetSpeed(): number {
    return this.driveTargetSpeed;
  }

  get targetMph(): number {
    return this.driveTargetMph;
  }

  get speed(): number {
    return (this.chassis.body as MatterJS.BodyType).speed;
  }

  get horizontalSpeed(): number {
    return Math.abs((this.chassis.body as MatterJS.BodyType).velocity.x);
  }

  get speedMph(): number {
    return Phaser.Math.Clamp(this.horizontalSpeed / MPH_TO_MATTER_SPEED, 0, MAX_TARGET_MPH);
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
