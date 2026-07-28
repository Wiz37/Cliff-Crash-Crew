import Phaser from 'phaser';
import { getVehicle } from '../data/vehicles';
import { SaveService } from '../services/SaveService';
import { ensureMusic, playSfx, setMusicEnabled } from '../services/AudioService';
import { HapticsService } from '../services/HapticsService';
import { createBackdrop } from '../ui/Backdrop';
import { createButton } from '../ui/Button';
import { createVehicleDisplay } from '../ui/VehicleDisplay';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    createBackdrop(this);
    this.sound.pauseOnBlur = true;
    this.input.once('pointerdown', () => ensureMusic(this));

    const sparkles = this.add.particles(540, 650, 'spark', {
      x: { min: -440, max: 440 },
      y: { min: -260, max: 420 },
      lifespan: { min: 1200, max: 2600 },
      speed: { min: 8, max: 30 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.65, end: 0 },
      quantity: 1,
      frequency: 170,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(-20);
    sparkles.setScrollFactor(0);

    const logoPlate = this.add.graphics();
    logoPlate.fillStyle(COLORS.ink, 0.88);
    logoPlate.fillRoundedRect(105, 112, 870, 476, 64);
    logoPlate.lineStyle(10, COLORS.cream, 0.96);
    logoPlate.strokeRoundedRect(105, 112, 870, 476, 64);
    logoPlate.fillStyle(COLORS.pink, 1);
    logoPlate.fillRoundedRect(135, 142, 810, 64, 30);

    this.add.text(540, 278, 'CLIFF', titleStyle(112)).setOrigin(0.5);
    this.add.text(540, 402, 'CRASH', titleStyle(142)).setOrigin(0.5).setColor('#ff4d86');
    this.add.text(540, 522, 'CREW', titleStyle(104)).setOrigin(0.5);
    this.add.text(540, 178, 'LAUNCH • FLIP • SMASH', labelStyle(32, '#151629')).setOrigin(0.5).setStroke('#fff6d5', 0);

    const save = SaveService.get();
    const spec = getVehicle(save.selectedVehicle);
    const spotlight = this.add.ellipse(540, 980, 720, 260, COLORS.cream, 0.35);
    spotlight.setBlendMode(Phaser.BlendModes.ADD);
    const preview = createVehicleDisplay(this, spec, 540, 900, 1.45);
    this.tweens.add({ targets: preview, y: 875, angle: -2.5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: spotlight, scaleX: 1.07, alpha: 0.24, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const namePlate = this.add.graphics();
    namePlate.fillStyle(COLORS.ink, 0.88);
    namePlate.fillRoundedRect(188, 1110, 704, 102, 34);
    namePlate.lineStyle(5, spec.accentColor, 1);
    namePlate.strokeRoundedRect(188, 1110, 704, 102, 34);
    this.add.text(540, 1161, spec.name, labelStyle(42)).setOrigin(0.5);

    createButton(this, 540, 1368, 'PLAY', () => {
      playSfx(this, 'click', { volume: 0.7 });
      HapticsService.selection();
      this.scene.start('Game');
    }, { width: 690, height: 138, color: COLORS.pink, fontSize: 62 });

    createButton(this, 540, 1545, 'GARAGE', () => {
      playSfx(this, 'click', { volume: 0.7 });
      HapticsService.selection();
      this.scene.start('Garage');
    }, { width: 690, height: 124, color: COLORS.cyan, fontSize: 50 });

    const starsPill = this.add.graphics();
    starsPill.fillStyle(COLORS.ink, 0.84);
    starsPill.fillRoundedRect(334, 1660, 412, 92, 46);
    starsPill.lineStyle(5, COLORS.yellow, 1);
    starsPill.strokeRoundedRect(334, 1660, 412, 92, 46);
    this.add.text(540, 1707, `★ ${save.stars.toLocaleString()}`, labelStyle(40, '#ffd43b')).setOrigin(0.5);

    const musicButton = createButton(this, 540, 1818, save.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF', () => {
      const next = !SaveService.get().musicEnabled;
      setMusicEnabled(this, next);
      playSfx(this, 'click', { volume: 0.55 });
      this.scene.restart();
    }, { width: 390, height: 84, color: COLORS.purple, fontSize: 30 });
    musicButton.setAlpha(0.94);

    this.add.text(540, 1890, 'NO CHAT • NO GORE • JUST TOY CRASHES', labelStyle(21, '#151629')).setOrigin(0.5).setStroke('#fff6d5', 4);
  }
}
