import Phaser from 'phaser';
import type { VehicleSpec } from '../data/vehicles';

export type WheelSide = 'left' | 'right';

const MPH_TO_MATTER_SPEED = 0.72;
const MIN_TARGET_MPH = 50;
const MAX_TARGET_MPH = 100;

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
  private driveElapsed = 0;
  private surfaceAngle = 0;

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
      friction: 0.76,
      frictionAir: 0.0028,
      restitution: 0.1,
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
      0.93,
      {
        pointA: { x: -wheelOffsetX, y: wheelOffsetY },
        damping: 0.27,
        stiffness: 0.93,
      },
    );
    this.rightConstraint = scene.matter.add.constraint(
      this.chassis.body as MatterJS.BodyType,
      this.rightWheel.body as MatterJS.BodyType,
      0,
      0.93,
      {
        pointA: { x: wheelOffsetX, y: wheelOffsetY },
        damping: 0.27,
        stiffness: 0.93,
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
      friction: 1.9,
      frictionStatic: 2.7,
      frictionAir: 0.007,
      restitution: 0.1,
      density: 0.0026 * this.spec.mass,
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
    this.driveElapsed = 0;
    this.surfaceAngle = 0;
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
    this.driveElapsed += dt;

    const chassisBody = this.chassis.body as MatterJS.BodyType;
    const startAssist = this.driveElapsed < 0.6;
    const hasRoadGrip = this.isGrounded || startAssist;

    if (this.isGrounded && this.leftAttached && this.rightAttached) {
      const wheelDx = this.rightWheel.x - this.leftWheel.x;
      const wheelDy = this.rightWheel.y - this.leftWheel.y;
      const measuredAngle = Phaser.Math.Clamp(Math.atan2(wheelDy, wheelDx), -0.34, 0.34);
      const angleResponse = 1 - Math.exp(-dt * 18);
      this.surfaceAngle += Phaser.Math.Angle.Wrap(measuredAngle - this.surfaceAngle) * angleResponse;
    } else if (this.isGrounded) {
      const measuredAngle = Phaser.Math.Clamp(this.chassis.rotation, -0.3, 0.3);
      const angleResponse = 1 - Math.exp(-dt * 12);
      this.surfaceAngle += Phaser.Math.Angle.Wrap(measuredAngle - this.surfaceAngle) * angleResponse;
    }

    const tangentX = Math.cos(this.surfaceAngle);
    const tangentY = Math.sin(this.surfaceAngle);
    const normalX = -tangentY;
    const normalY = tangentX;

    const currentTangentSpeed = Math.max(
      0,
      chassisBody.velocity.x * tangentX + chassisBody.velocity.y * tangentY,
    );

    if (hasRoadGrip && currentTangentSpeed < this.driveTargetSpeed) {
      const accelerationPerSecond = 58 + this.spec.power * 28;
      const nextTangentSpeed = Math.min(
        this.driveTargetSpeed,
        currentTangentSpeed + accelerationPerSecond * dt,
      );

      const currentNormalSpeed = chassisBody.velocity.x * normalX + chassisBody.velocity.y * normalY;
      const retainedNormalSpeed = this.isGrounded ? Math.max(0, currentNormalSpeed) * 0.12 : currentNormalSpeed;

      this.chassis.setVelocity(
        nextTangentSpeed * tangentX + retainedNormalSpeed * normalX,
        nextTangentSpeed * tangentY + retainedNormalSpeed * normalY,
      );
    } else if (hasRoadGrip && currentTangentSpeed > this.driveTargetSpeed) {
      const currentNormalSpeed = chassisBody.velocity.x * normalX + chassisBody.velocity.y * normalY;
      this.chassis.setVelocity(
        this.driveTargetSpeed * tangentX + currentNormalSpeed * normalX,
        this.driveTargetSpeed * tangentY + currentNormalSpeed * normalY,
      );
    }

    const updatedBody = this.chassis.body as MatterJS.BodyType;
    const roadSpeed = hasRoadGrip
      ? Math.max(0, updatedBody.velocity.x * tangentX + updatedBody.velocity.y * tangentY)
      : updatedBody.speed;
    const roadAngularVelocity = roadSpeed / Math.max(18, this.wheelRadius);
    const maximumSlip = this.isGrounded ? 0.035 : 0.12;
    const speedDeficit = Phaser.Math.Clamp(
      (this.driveTargetSpeed - roadSpeed) / Math.max(1, this.driveTargetSpeed),
      0,
      1,
    );
    const desiredWheelAngularVelocity = Phaser.Math.Clamp(
      roadAngularVelocity + speedDeficit * maximumSlip,
      0,
      3.2,
    );
    const wheelResponse = 1 - Math.exp(-dt * (this.isGrounded ? 18 : 4.5));

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
      const rotationDamping = Math.pow(0.038, dt);
      this.chassis.setAngularVelocity(updatedBody.angularVelocity * rotationDamping);

      if (roadSpeed > 28) {
        const downforce = 0.00014
          * this.spec.mass
          * Phaser.Math.Clamp(roadSpeed / this.driveTargetSpeed, 0, 1);
        this.chassis.applyForce(new Phaser.Math.Vector2(normalX * downforce, normalY * downforce));
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
    const controlStrength = this.isGrounded ? 0.006 : 0.17;
    const maximumRotationSpeed = this.isGrounded ? 0.03 : 0.24;
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
    return Phaser.Math.Clamp(this.speed / MPH_TO_MATTER_SPEED, 0, MAX_TARGET_MPH);
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
