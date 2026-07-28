import Phaser from 'phaser';
import { setEngineIntensity } from '../services/AudioService';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

let installed = false;

export function installPremiumGameplay(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const proto = GameSceneClass.prototype as any;
  const baseCreate = proto.create;
  const baseUpdate = proto.update;
  const baseHandleImpact = proto.handleImpact;

  proto.create = function (...args: unknown[]): void {
    baseCreate.apply(this, args);

    this.cameras.main.startFollow(this.rig.chassis, true, 0.13, 0.13, -210, 105);

    this.premiumSpeedLines = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(196)
      .setBlendMode(Phaser.BlendModes.ADD);

    const speedPanel = this.add.graphics().setScrollFactor(0).setDepth(204);
    speedPanel.fillStyle(COLORS.ink, 0.88);
    speedPanel.fillRoundedRect(814, 452, 226, 132, 34);
    speedPanel.lineStyle(5, this.activeLevel?.accent ?? COLORS.cyan, 0.95);
    speedPanel.strokeRoundedRect(814, 452, 226, 132, 34);
    speedPanel.fillStyle(0xffffff, 0.08);
    speedPanel.fillRoundedRect(828, 466, 198, 24, 12);

    this.premiumSpeedText = this.add
      .text(927, 523, '0', titleStyle(54))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(205)
      .setColor('#fff6d5');
    this.add
      .text(927, 562, 'SPEED', labelStyle(20, '#58ddff'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(205);

    this.premiumDust = this.add
      .particles(0, 0, 'dust', {
        speedX: { min: -220, max: -70 },
        speedY: { min: -75, max: 15 },
        lifespan: { min: 320, max: 760 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.5, end: 0 },
        quantity: 2,
        frequency: 54,
        emitting: false,
      })
      .setDepth(24);
  };

  proto.handleImpact = function (speed: number, point: { x: number; y: number }): void {
    baseHandleImpact.call(this, speed, point);
    if (speed > 10) {
      const strength = Phaser.Math.Clamp((speed - 8) / 24, 0, 1);
      this.cameras.main.flash(55 + strength * 70, 255, 244, 214, false);
      this.cameras.main.shake(75 + strength * 90, 0.0025 + strength * 0.0045);
    }
  };

  proto.update = function (time: number, delta: number): void {
    baseUpdate.call(this, time, delta);
    if (!this.rig || this.ending) return;

    const speed = this.rig.horizontalSpeed;
    const speedRatio = Phaser.Math.Clamp(speed / 58, 0, 1);
    const targetZoom = speed > 48 ? 0.72 : speed > 36 ? 0.77 : speed > 24 ? 0.84 : speed > 12 ? 0.92 : 1;
    const zoomResponse = Math.min(1, (delta / 1000) * 3.8);
    this.cameras.main.zoom += (targetZoom - this.cameras.main.zoom) * zoomResponse;

    setEngineIntensity(this, Phaser.Math.Clamp(0.16 + speedRatio * 0.94, 0, 1));
    this.premiumSpeedText?.setText(String(Math.round(speed * 3.25)));

    const lines = this.premiumSpeedLines as Phaser.GameObjects.Graphics | undefined;
    lines?.clear();
    const lineIntensity = Phaser.Math.Clamp((speed - 20) / 34, 0, 1);
    if (lines && lineIntensity > 0) {
      for (let index = 0; index < 14; index += 1) {
        const lane = (index * 139 + time * (0.18 + (index % 3) * 0.035)) % 1920;
        const x = 130 + ((index * 227 + time * 0.27) % 900);
        const length = 55 + lineIntensity * (95 + (index % 4) * 22);
        lines.lineStyle(2 + lineIntensity * 4, 0xffffff, 0.045 + lineIntensity * 0.16);
        lines.lineBetween(x, lane, x - length, lane + 5 + (index % 2) * 3);
      }
    }

    const dust = this.premiumDust as Phaser.GameObjects.Particles.ParticleEmitter | undefined;
    if (dust) {
      dust.setPosition(this.rig.x - 115, this.rig.y + 42);
      if (this.rig.isGrounded && speed > 15) dust.start();
      else dust.stop();
    }
  };
}
