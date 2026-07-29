import type Phaser from 'phaser';
import type { VehicleRig } from '../objects/VehicleRig';

let installed = false;

/**
 * Converts block impacts into lasting momentum loss. The first block disables
 * drivetrain acceleration for the remainder of the run, and each additional
 * block increases the braking force until the vehicle naturally reaches zero.
 */
export function installCrashMomentumTuning(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const proto = GameSceneClass.prototype as any;
  const baseBreakBlock = proto.breakBlock;

  proto.breakBlock = function (
    block: Phaser.Physics.Matter.Image,
    speed: number,
    rig: VehicleRig,
  ): void {
    const alreadyBroken = Boolean(block?.getData?.('broken'));

    if (!alreadyBroken) {
      rig.registerBlockImpact(speed);
    }

    baseBreakBlock.call(this, block, speed, rig);
  };
}
