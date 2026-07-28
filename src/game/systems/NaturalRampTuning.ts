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

  const originalBuildHud = proto.buildHud;
  proto.buildHud = function (...args: unknown[]): void {
    originalBuildHud.apply(this, args);
    const prompt = this.children.list.find(
      (child: any) => typeof child?.text === 'string' && child.text.includes('HOLD TO CHARGE'),
    ) as any;
    prompt?.setText('HOLD TO REV • RELEASE TO DRIVE');
  };

  proto.launchVehicle = function (): void {
    if (!this.rig || this.launched) return;
    this.launched = true;
    this.charging = false;

    const targetSpeed = (13.5 + this.charge * 12.5) * this.rig.spec.power;
    this.rig.beginDrive(targetSpeed);

    this.chargePanel?.setVisible(false);
    this.rotateControls.forEach((control: any) => control.setVisible(true));
    playSfx(this, 'launch', { volume: 0.38, rate: 0.76 + this.charge * 0.16 });
    HapticsService.selection();
    this.explodeParticles(this.rig.x - 88, this.rig.y + 42, 'dust', 12, 0xfff6d5, 1.1);
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
        if (otherBody.label !== 'ground' && otherBody.label !== 'breakable-block') return;

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
