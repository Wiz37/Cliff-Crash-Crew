import { HapticsService } from '../services/HapticsService';
import { playSfx } from '../services/AudioService';
import { COLORS, labelStyle } from '../ui/theme';

let installed = false;

/**
 * Replaces the original steep launch ramp with a long, shallow run-off ramp.
 * It also removes the artificial upward catapult velocity so the vehicle's
 * wheels follow the ground and the ramp determines the natural takeoff angle.
 */
export function installNaturalRampTuning(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const proto = GameSceneClass.prototype as any;

  proto.createTerrain = function (): void {
    const terrain = this.add.graphics().setDepth(4);
    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.fillRect(-200, 1490, 980, 500);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(-200, 1480, 980, 34);

    // Long 14-degree approach with a short, level run-off lip. The artwork and
    // Matter bodies use matching coordinates so there is no invisible kick.
    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.beginPath();
    terrain.moveTo(500, 1490);
    terrain.lineTo(1200, 1310);
    terrain.lineTo(1380, 1310);
    terrain.lineTo(720, 1490);
    terrain.closePath();
    terrain.fillPath();
    terrain.lineStyle(18, COLORS.grass, 1);
    terrain.lineBetween(500, 1488, 1200, 1310);
    terrain.lineBetween(1200, 1310, 1380, 1310);

    terrain.fillStyle(0x3a8f4e, 1);
    terrain.fillRect(1030, 1730, 4650, 520);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(1030, 1704, 4650, 36);

    terrain.fillStyle(0x2e6d3d, 1);
    terrain.fillTriangle(2260, 1705, 2500, 1460, 2700, 1705);
    terrain.lineStyle(16, COLORS.grass, 1);
    terrain.lineBetween(2260, 1705, 2500, 1460);
    terrain.lineBetween(2500, 1460, 2700, 1705);

    terrain.fillStyle(0x285f38, 1);
    terrain.fillTriangle(3520, 1705, 3710, 1525, 3870, 1705);
    terrain.lineStyle(16, COLORS.grass, 1);
    terrain.lineBetween(3520, 1705, 3710, 1525);
    terrain.lineBetween(3710, 1525, 3870, 1705);

    terrain.fillStyle(0x203d31, 1);
    for (let x = 1180; x < 5600; x += 320) {
      terrain.fillCircle(x, 1748, 24);
      terrain.fillCircle(x + 45, 1753, 16);
    }

    const upperGround = this.matter.add.rectangle(260, 1620, 1050, 280, {
      isStatic: true,
      label: 'ground',
    });
    const ramp = this.matter.add.rectangle(860, 1436, 724, 76, {
      isStatic: true,
      angle: -0.249,
      label: 'ground',
    });
    const lip = this.matter.add.rectangle(1290, 1342, 180, 64, {
      isStatic: true,
      angle: 0,
      label: 'ground',
    });
    const lowerGround = this.matter.add.rectangle(3300, 1840, 4850, 250, {
      isStatic: true,
      label: 'ground',
    });
    const bumpOne = this.matter.add.rectangle(2480, 1596, 350, 60, {
      isStatic: true,
      angle: -0.66,
      label: 'ground',
    });
    const bumpTwo = this.matter.add.rectangle(3700, 1620, 260, 54, {
      isStatic: true,
      angle: -0.62,
      label: 'ground',
    });

    [upperGround, ramp, lip, lowerGround, bumpOne, bumpTwo].forEach((body) => {
      body.friction = 0.92;
      body.restitution = 0.14;
    });

    // Extra grip and almost no bounce prevent the ramp seam from catapulting
    // lightweight vehicles as their front wheels transition onto the incline.
    ramp.friction = 1;
    ramp.restitution = 0.025;
    lip.friction = 1;
    lip.restitution = 0.025;

    const warning = this.add
      .text(1220, 1200, 'RUN IT OFF!', labelStyle(38, '#ff4d86'))
      .setRotation(-0.02)
      .setDepth(5);
    warning.setStroke('#151629', 8);
  };

  proto.launchVehicle = function (): void {
    if (!this.rig || this.launched) return;
    this.launched = true;
    this.charging = false;

    const power = (0.7 + this.charge * 0.62) * this.rig.spec.power;

    // Nearly all launch energy is forward. Gravity, wheel contact, suspension,
    // and the shallow ramp now create the jump instead of an instant Y boost.
    this.rig.launch(21.5 * power, -1.4 * power);
    this.rig.chassis.setAngularVelocity(-0.008);

    this.chargePanel?.setVisible(false);
    this.rotateControls.forEach((control: any) => control.setVisible(true));
    playSfx(this, 'launch', { volume: 0.92, rate: 0.9 + this.charge * 0.28 });
    HapticsService.impact();
    this.explodeParticles(this.rig.x - 100, this.rig.y + 35, 'dust', 28, 0xfff6d5, 2.1);
    this.cameras.main.flash(140, 255, 246, 213, false, undefined, this);
  };
}
