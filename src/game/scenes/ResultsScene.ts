import Phaser from 'phaser';
import { getVehicle } from '../data/vehicles';
import { SaveService } from '../services/SaveService';
import { ensureMusic, playSfx } from '../services/AudioService';
import { HapticsService } from '../services/HapticsService';
import { createBackdrop } from '../ui/Backdrop';
import { createButton } from '../ui/Button';
import { createVehicleDisplay } from '../ui/VehicleDisplay';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

interface ResultPayload {
  score: number;
  distance: number;
  flips: number;
  blocks: number;
  stars: number;
  challenge: string;
  challengeComplete: boolean;
  vehicleId: string;
  newBest: boolean;
}

export class ResultsScene extends Phaser.Scene {
  private result!: ResultPayload;

  constructor() {
    super('Results');
  }

  init(data: ResultPayload): void {
    this.result = data;
  }

  create(): void {
    ensureMusic(this);
    createBackdrop(this);
    const vehicle = getVehicle(this.result.vehicleId);

    const confetti = this.add.particles(540, 0, 'spark', {
      x: { min: -480, max: 480 },
      y: { min: -120, max: 0 },
      lifespan: { min: 2600, max: 4600 },
      speedY: { min: 140, max: 320 },
      speedX: { min: -90, max: 90 },
      rotate: { min: 0, max: 360 },
      gravityY: 100,
      scale: { start: 0.55, end: 0.15 },
      tint: [COLORS.pink, COLORS.cyan, COLORS.yellow, COLORS.purple, COLORS.orange],
      frequency: this.result.challengeComplete ? 55 : 120,
      quantity: 1,
    }).setDepth(80);
    this.time.delayedCall(4300, () => confetti.stop());

    const card = this.add.graphics();
    card.fillStyle(COLORS.ink, 0.93);
    card.fillRoundedRect(70, 86, 940, 1570, 68);
    card.lineStyle(10, this.result.challengeComplete ? COLORS.yellow : vehicle.accentColor, 1);
    card.strokeRoundedRect(70, 86, 940, 1570, 68);
    card.fillStyle(vehicle.bodyColor, 0.2);
    card.fillRoundedRect(102, 118, 876, 384, 50);

    const heading = this.result.newBest
      ? 'NEW BEST!'
      : this.result.challengeComplete
        ? 'CHALLENGE CRUSHED!'
        : 'CRASH COMPLETE!';
    this.add.text(540, 174, heading, titleStyle(66)).setOrigin(0.5).setColor(this.result.newBest ? '#ffd43b' : '#fff6d5');

    const preview = createVehicleDisplay(this, vehicle, 540, 360, 1.32);
    this.tweens.add({ targets: preview, y: 338, angle: -2, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(540, 604, this.result.score.toLocaleString(), titleStyle(132)).setOrigin(0.5).setColor('#ff4d86');
    this.add.text(540, 714, 'TOTAL SCORE', labelStyle(32, '#58ddff')).setOrigin(0.5);

    const stats = [
      ['DISTANCE', `${this.result.distance}m`, COLORS.cyan],
      ['FLIPS', `${this.result.flips}`, COLORS.pink],
      ['BLOCKS', `${this.result.blocks}`, COLORS.orange],
      ['STARS', `+${this.result.stars}`, COLORS.yellow],
    ] as const;

    stats.forEach(([label, value, color], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 310 : 770;
      const y = 870 + row * 230;
      const panel = this.add.graphics();
      panel.fillStyle(0x050611, 0.62);
      panel.fillRoundedRect(x - 190, y - 90, 380, 180, 38);
      panel.lineStyle(5, color, 1);
      panel.strokeRoundedRect(x - 190, y - 90, 380, 180, 38);
      this.add.text(x, y - 34, label, labelStyle(29)).setOrigin(0.5);
      this.add.text(x, y + 40, value, titleStyle(54)).setOrigin(0.5).setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
    });

    const challengePanel = this.add.graphics();
    challengePanel.fillStyle(this.result.challengeComplete ? COLORS.yellow : COLORS.purple, 0.92);
    challengePanel.fillRoundedRect(138, 1300, 804, 154, 42);
    challengePanel.lineStyle(7, COLORS.ink, 1);
    challengePanel.strokeRoundedRect(138, 1300, 804, 154, 42);
    this.add.text(540, 1346, this.result.challengeComplete ? '✓ BONUS COMPLETE' : 'NEXT TRY', labelStyle(28, '#151629')).setOrigin(0.5).setStroke('#fff6d5', 0);
    this.add.text(540, 1405, this.result.challenge, labelStyle(33, '#151629')).setOrigin(0.5).setStroke('#fff6d5', 0);

    const save = SaveService.get();
    this.add.text(540, 1540, `TOTAL STARS  ★ ${save.stars.toLocaleString()}`, labelStyle(34, '#ffd43b')).setOrigin(0.5);

    createButton(this, 540, 1740, 'CRASH AGAIN', () => {
      playSfx(this, 'click', { volume: 0.7 });
      HapticsService.selection();
      this.scene.start('Game');
    }, { width: 690, height: 126, color: COLORS.pink, fontSize: 48 });

    createButton(this, 540, 1880, 'HOME', () => {
      playSfx(this, 'click', { volume: 0.7 });
      this.scene.start('Menu');
    }, { width: 430, height: 86, color: COLORS.cyan, fontSize: 32 });

    if (this.result.newBest || this.result.challengeComplete) {
      playSfx(this, 'star', { volume: 0.95, rate: this.result.newBest ? 1.2 : 1.08 });
      HapticsService.success();
    }
  }
}
