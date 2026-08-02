import { HapticsService } from '../services/HapticsService';
import { playSfx } from '../services/AudioService';
import { COLORS, labelStyle } from '../ui/theme';

let installed = false;

/**
 * Replaces the original steep launch ramp with a long, shallow run-off ramp.
 * Vehicles accelerate with their wheels, climb under momentum, and leave the
 * edge naturally without an artificial horizontal or vertical launch impulse.
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

    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.beginPath();
    terrain.moveTo(500, 1490);
    terrain.lineTo(1450, 1338);
    terrain.lineTo(1750, 1338);
    terrain.lineTo(720, 1490);
    terrain.closePath();
    terrain.fillPath();
    terrain.lineStyle(18, COLORS.grass, 1);
    terrain.lineBetween(500, 1488, 1450, 1338);
    terrain.lineBetween(1450, 1338, 1750, 1338);

    terrain.fillStyle(0x3a8f4e, 1);
    terrain.fillRect(1750, 1730, 6250, 520);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(1750, 1704, 6250, 36);

    const upperGround = this.matter.add.rectangle(260, 1620, 1050, 280, {
      isStatic: true,
      label: 'ground',
    });
    const ramp = this.matter.add.rectangle(980, 1414, 965, 76, {
      isStatic: true,
      angle: -0.159,
      label: 'ground',
    });
    const lip = this.matter.add.rectangle(1600, 1370, 300, 64, {
      isStatic: true,
      angle: 0,
      label: 'ground',
    });
    const lowerGround = this.matter.add.rectangle(4875, 1840, 6250, 250, {
      isStatic: true,
      label: 'ground',
    });

    [upperGround, ramp, lip, lowerGround].forEach((body) => {
      body.friction = 1.08;
      body.restitution = 0.055;
    });

    ramp.friction = 1.2;
    ramp.restitution = 0.015;
    lip.friction = 1.15;
    lip.restitution = 0.015;

    const warning = this.add
      .text(1660, 1215, '100 MPH RUN-OFF', labelStyle(38, '#ff4d86'))
      .setRotation(-0.02)
      .setDepth(5);
    warning.setStroke('#151629', 8);
  };

  const originalBuildHud = proto.buildHud;
  proto.buildHud = function (...args: unknown[]): void {
    originalBuildHud.apply(this, args);
    const prompt = this.children.list.find(
      (child: any) => typeof child?.text === 'string' && child.text.includes('HOLD TO CHARGE'),
    ) as any;
    prompt?.setText('HOLD TO REV • 50–100 MPH');
  };

  proto.launchVehicle = function (): void {
    if (!this.rig || this.launched) return;
    this.launched = true;
    this.charging = false;

    // Charge oscillates from 0.08–1. Normalize that range so the player receives
    // exactly 50 MPH at the bottom and 100 MPH at full charge.
    const normalizedCharge = Math.max(0, Math.min(1, (this.charge - 0.08) / 0.92));
    const targetMph = 50 + normalizedCharge * 50;
    this.rig.beginDrive(targetMph);

    this.chargePanel?.setVisible(false);
    this.rotateControls.forEach((control: any) => control.setVisible(true));
    playSfx(this, 'launch', { volume: 0.68, rate: 0.98 + normalizedCharge * 0.28 });
    HapticsService.impact();
    this.explodeParticles(this.rig.x - 88, this.rig.y + 42, 'dust', 24, 0xfff6d5, 1.5);
    this.cameras.main.shake(125, 0.0042);
  };

  const originalBindCollisions = proto.bindCollisions;
  proto.bindCollisions = function (...args: unknown[]): void {
    originalBindCollisions.apply(this, args);

    const updateGroundContacts = (event: any, active: boolean): void => {
      event.pairs.forEach((pair: any) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const objectA = bodyA.gameObject as any;
        const objectB = bodyB.gameObject as any;
        const rigA = objectA?.getData?.('rig');
        const rigB = objectB?.getData?.('rig');
        const rig = rigA ?? rigB;
        if (!rig) return;

        const otherBody = rigA ? bodyB : bodyA;
        // Demolition blocks are obstacles, not terrain. Counting them as ground
        // disabled airborne rotation whenever the vehicle touched a tower.
        if (otherBody.label !== 'ground') return;

        const contactId = `${Math.min(bodyA.id, bodyB.id)}:${Math.max(bodyA.id, bodyB.id)}`;
        rig.setGroundContact(contactId, active);
      });
    };

    this.matter.world.on('collisionstart', (event: any) => updateGroundContacts(event, true));
    this.matter.world.on('collisionend', (event: any) => updateGroundContacts(event, false));
  };

  const originalUpdate = proto.update;
  proto.update = function (time: number, delta: number): void {
    if (this.launched && this.rig && !this.ending) {
      this.rig.applyDrive(Math.min(0.034, delta / 1000));
    }
    originalUpdate.call(this, time, delta);
  };
}
