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

    this.cameras.main.startFollow(this.rig.chassis, true, 0.15, 0.15, -235, 105);

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
      .text(927, 562, 'MPH', labelStyle(20, '#58ddff'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(205);

    this.premiumDust = this.add
      .particles(0, 0, 'dust', {
        speedX: { min: -300, max: -100 },
        speedY: { min: -90, max: 20 },
        lifespan: { min: 260, max: 700 },
        scale: { start: 0.82, end: 0 },
        alpha: { start: 0.55, end: 0 },
        quantity: 2,
        frequency: 45,
        emitting: false,
      })
      .setDepth(24);
  };

  proto.handleImpact = function (speed: number, point: { x: number; y: number }): void {
    baseHandleImpact.call(this, speed, point);
    if (speed > 10) {
      const strength = Phaser.Math.Clamp((speed - 8) / 30, 0, 1);
      this.cameras.main.flash(55 + strength * 85, 255, 244, 214, false);
      this.cameras.main.shake(75 + strength * 110, 0.0025 + strength * 0.0055);
    }
  };

  proto.update = function (time: number, delta: number): void {
    baseUpdate.call(this, time, delta);
    if (!this.rig || this.ending) return;

    const mph = this.rig.speedMph;
    const speedRatio = Phaser.Math.Clamp(mph / 100, 0, 1);
    const targetZoom = mph > 95 ? 0.66 : mph > 85 ? 0.7 : mph > 72 ? 0.76 : mph > 58 ? 0.84 : mph > 45 ? 0.91 : 1;
    const zoomResponse = Math.min(1, (delta / 1000) * 4.2);
    this.cameras.main.zoom += (targetZoom - this.cameras.main.zoom) * zoomResponse;

    setEngineIntensity(this, Phaser.Math.Clamp(0.18 + speedRatio * 0.92, 0, 1));
    this.premiumSpeedText?.setText(String(Math.round(mph)));

    const lines = this.premiumSpeedLines as Phaser.GameObjects.Graphics | undefined;
    lines?.clear();
    const lineIntensity = Phaser.Math.Clamp((mph - 52) / 48, 0, 1);
    if (lines && lineIntensity > 0) {
      for (let index = 0; index < 18; index += 1) {
        const lane = (index * 113 + time * (0.24 + (index % 3) * 0.045)) % 1920;
        const x = 120 + ((index * 211 + time * 0.34) % 930);
        const length = 70 + lineIntensity * (120 + (index % 4) * 28);
        lines.lineStyle(2 + lineIntensity * 5, 0xffffff, 0.05 + lineIntensity * 0.19);
        lines.lineBetween(x, lane, x - length, lane + 5 + (index % 2) * 4);
      }
    }

    const dust = this.premiumDust as Phaser.GameObjects.Particles.ParticleEmitter | undefined;
    if (dust) {
      dust.setPosition(this.rig.x - 120, this.rig.y + 42);
      if (this.rig.isGrounded && mph > 42) dust.start();
      else dust.stop();
    }
  };
}
