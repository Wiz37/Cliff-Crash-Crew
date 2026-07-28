import Phaser from 'phaser';
import { getLevel, getNextLevel } from '../data/levels';
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

    const saveBefore = SaveService.get();
    const level = getLevel(saveBefore.selectedLevel);
    const nextLevel = getNextLevel(level.id);
    const passed = this.result.score >= level.passScore;
    const pointsNeeded = Math.max(0, level.passScore - this.result.score);
    const newlyUnlocked = passed && Boolean(nextLevel) && saveBefore.highestUnlockedLevel < (nextLevel?.id ?? 0);
    const save = SaveService.completeLevel(level.id, this.result.score, level.passScore);
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
      frequency: passed ? 45 : 150,
      quantity: 1,
    }).setDepth(80);
    this.time.delayedCall(passed ? 4300 : 1800, () => confetti.stop());

    const card = this.add.graphics();
    card.fillStyle(COLORS.ink, 0.93);
    card.fillRoundedRect(70, 70, 940, 1575, 68);
    card.lineStyle(10, passed ? COLORS.yellow : vehicle.accentColor, 1);
    card.strokeRoundedRect(70, 70, 940, 1575, 68);
    card.fillStyle(vehicle.bodyColor, 0.2);
    card.fillRoundedRect(102, 102, 876, 350, 50);

    const heading = passed
      ? newlyUnlocked
        ? 'NEXT MAP UNLOCKED!'
        : level.id === 6
          ? 'ALL MAPS CLEARED!'
          : 'MAP CLEARED!'
      : 'SO CLOSE!';
    this.add
      .text(540, 158, heading, titleStyle(60))
      .setOrigin(0.5)
      .setColor(passed ? '#ffd43b' : '#fff6d5');
    this.add
      .text(540, 232, `MAP ${level.id} • ${level.name}`, labelStyle(29, '#58ddff'))
      .setOrigin(0.5);

    const preview = createVehicleDisplay(this, vehicle, 540, 370, 1.18);
    this.tweens.add({ targets: preview, y: 350, angle: -2, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(540, 565, this.result.score.toLocaleString(), titleStyle(116)).setOrigin(0.5).setColor('#ff4d86');
    this.add.text(540, 655, `TARGET  ${level.passScore.toLocaleString()}`, labelStyle(31, '#ffd43b')).setOrigin(0.5);
    this.add
      .text(
        540,
        705,
        passed ? 'TARGET BEAT!' : `${pointsNeeded.toLocaleString()} MORE POINTS TO UNLOCK THE NEXT MAP`,
        labelStyle(24, passed ? '#69db7c' : '#fff6d5'),
      )
      .setOrigin(0.5);

    const progressWidth = 720;
    const progress = Phaser.Math.Clamp(this.result.score / level.passScore, 0, 1);
    const progressBar = this.add.graphics();
    progressBar.fillStyle(0x050611, 0.78);
    progressBar.fillRoundedRect(180, 754, progressWidth, 48, 24);
    progressBar.fillStyle(passed ? COLORS.yellow : COLORS.cyan, 1);
    progressBar.fillRoundedRect(190, 764, (progressWidth - 20) * progress, 28, 14);

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
      const y = 930 + row * 205;
      const panel = this.add.graphics();
      panel.fillStyle(0x050611, 0.62);
      panel.fillRoundedRect(x - 190, y - 78, 380, 156, 38);
      panel.lineStyle(5, color, 1);
      panel.strokeRoundedRect(x - 190, y - 78, 380, 156, 38);
      this.add.text(x, y - 28, label, labelStyle(27)).setOrigin(0.5);
      this.add.text(x, y + 31, value, titleStyle(48)).setOrigin(0.5).setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
    });

    const challengePanel = this.add.graphics();
    challengePanel.fillStyle(this.result.challengeComplete ? COLORS.yellow : COLORS.purple, 0.92);
    challengePanel.fillRoundedRect(138, 1290, 804, 145, 42);
    challengePanel.lineStyle(7, COLORS.ink, 1);
    challengePanel.strokeRoundedRect(138, 1290, 804, 145, 42);
    this.add
      .text(540, 1332, this.result.challengeComplete ? '✓ BONUS COMPLETE' : 'BONUS CHALLENGE', labelStyle(27, '#151629'))
      .setOrigin(0.5)
      .setStroke('#fff6d5', 0);
    this.add
      .text(540, 1385, this.result.challenge, labelStyle(31, '#151629'))
      .setOrigin(0.5)
      .setStroke('#fff6d5', 0);

    this.add
      .text(540, 1510, `MAP BEST  ${(save.levelBestScores[String(level.id)] ?? 0).toLocaleString()}   •   ★ ${save.stars.toLocaleString()}`, labelStyle(29, '#ffd43b'))
      .setOrigin(0.5);

    const primaryLabel = passed && nextLevel ? 'NEXT MAP' : passed ? 'PLAY AGAIN' : 'TRY AGAIN';
    createButton(this, 540, 1710, primaryLabel, () => {
      playSfx(this, 'click', { volume: 0.7 });
      HapticsService.selection();
      if (passed && nextLevel) SaveService.selectLevel(nextLevel.id);
      this.scene.start('Game');
    }, { width: 690, height: 122, color: passed ? COLORS.yellow : COLORS.pink, fontSize: 48 });

    createButton(this, 540, 1848, 'MAP SELECT', () => {
      playSfx(this, 'click', { volume: 0.7 });
      HapticsService.selection();
      this.scene.start('LevelSelect');
    }, { width: 470, height: 82, color: COLORS.cyan, fontSize: 31 });

    if (passed || this.result.newBest || this.result.challengeComplete) {
      playSfx(this, 'star', { volume: 0.95, rate: passed ? 1.2 : 1.08 });
      HapticsService.success();
    }
  }
}
