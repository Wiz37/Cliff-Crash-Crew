import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import { VehicleRig } from '../objects/VehicleRig';

const WORLD_SPEED_PER_MPH = 0.32;
const MAX_DISPLAY_MPH = 100;
const BALANCED_CLEAR_SCORES = [1600, 2800, 4000, 5400, 6900, 8400];
const RAMP_LOWERING = [40, 44, 48, 52, 56, 60];

let installed = false;

/**
 * Keeps the 50–100 MPH player-facing range while calibrating world movement to
 * the actual course scale. Acceleration remains responsive, but the vehicle no
 * longer crosses huge portions of a map in one jump. Ramps also sit closer to
 * their landing zones so airtime stays useful without becoming uncontrollable.
 */
export function installSpeedMapBalance(): void {
  if (installed) return;
  installed = true;

  LEVELS.forEach((level, index) => {
    level.passScore = BALANCED_CLEAR_SCORES[index] ?? level.passScore;
    level.rampEndY += RAMP_LOWERING[index] ?? 0;
  });

  const proto = VehicleRig.prototype as any;
  const baseBeginDrive = proto.beginDrive;
  const baseApplyDrive = proto.applyDrive;

  proto.beginDrive = function (targetMph: number): void {
    baseBeginDrive.call(this, targetMph);
    this.driveTargetSpeed = this.driveTargetMph * WORLD_SPEED_PER_MPH;
  };

  proto.applyDrive = function (deltaSeconds: number): void {
    const dt = Phaser.Math.Clamp(deltaSeconds, 0, 0.034);
    const beforeBody = this.chassis.body as MatterJS.BodyType;
    const beforeSpeed = beforeBody.speed;

    baseApplyDrive.call(this, dt);

    let body = this.chassis.body as MatterJS.BodyType;

    // Build speed progressively instead of snapping to the selected MPH.
    if (!this.impactBraking) {
      const accelerationPerSecond = 20 + this.spec.power * 10;
      const maximumSpeedThisFrame = Math.min(
        this.driveTargetSpeed,
        beforeSpeed + accelerationPerSecond * dt,
      );

      if (body.speed > maximumSpeedThisFrame && body.speed > 0.001) {
        const scale = maximumSpeedThisFrame / body.speed;
        this.chassis.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
        body = this.chassis.body as MatterJS.BodyType;
      }
    }

    // Shorten excessive airborne carry while preserving the natural jump arc.
    if (!this.isGrounded && this.driveElapsed > 0.45 && !this.impactBraking) {
      const horizontalDrag = Math.exp(-0.55 * dt);
      const verticalDrag = Math.exp(-0.12 * dt);
      this.chassis.setVelocity(
        body.velocity.x * horizontalDrag,
        body.velocity.y * verticalDrag,
      );
      body = this.chassis.body as MatterJS.BodyType;
    }

    // Terrain and collision resolution cannot push the vehicle above its target.
    const maximumWorldSpeed = this.driveTargetSpeed * 1.02;
    if (!this.impactBraking && body.speed > maximumWorldSpeed && body.speed > 0.001) {
      const scale = maximumWorldSpeed / body.speed;
      this.chassis.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
    }
  };

  Object.defineProperty(proto, 'speedMph', {
    configurable: true,
    get(this: any): number {
      const body = this.chassis.body as MatterJS.BodyType;
      return Phaser.Math.Clamp(body.speed / WORLD_SPEED_PER_MPH, 0, MAX_DISPLAY_MPH);
    },
  });
}
