import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import { VehicleRig } from '../objects/VehicleRig';

const WORLD_SPEED_PER_MPH = 0.42;
const MAX_DISPLAY_MPH = 100;
const BALANCED_CLEAR_SCORES = [1800, 3200, 4700, 6300, 8000, 9800];

let installed = false;

/**
 * Keeps the 50–100 MPH player-facing range while calibrating world movement to
 * the actual course scale. The base drivetrain still follows the road angle,
 * but acceleration and airborne carry are limited so vehicles land inside the
 * intended demolition zones instead of skipping large sections of the map.
 */
export function installSpeedMapBalance(): void {
  if (installed) return;
  installed = true;

  LEVELS.forEach((level, index) => {
    level.passScore = BALANCED_CLEAR_SCORES[index] ?? level.passScore;
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

    // Build speed progressively rather than snapping close to the selected MPH.
    if (!this.impactBraking) {
      const accelerationPerSecond = 25 + this.spec.power * 12;
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

    // Reduce excessive long-distance airborne carry without flattening the jump.
    if (!this.isGrounded && this.driveElapsed > 0.65 && !this.impactBraking) {
      const horizontalDrag = Math.exp(-0.38 * dt);
      const verticalDrag = Math.exp(-0.08 * dt);
      this.chassis.setVelocity(
        body.velocity.x * horizontalDrag,
        body.velocity.y * verticalDrag,
      );
      body = this.chassis.body as MatterJS.BodyType;
    }

    // Never let terrain or collision resolution accelerate past the selected MPH.
    const maximumWorldSpeed = this.driveTargetSpeed * 1.04;
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
