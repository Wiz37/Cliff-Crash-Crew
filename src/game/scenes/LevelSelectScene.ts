import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import { SaveService } from '../services/SaveService';
import { ensureMusic, playSfx } from '../services/AudioService';
import { HapticsService } from '../services/HapticsService';
import { createBackdrop } from '../ui/Backdrop';
import { createButton } from '../ui/Button';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    ensureMusic(this);
    createBackdrop(this);

    const save = SaveService.get();

    this.add.text(540, 105, 'CHOOSE A MAP', titleStyle(76)).setOrigin(0.5);
    this.add
      .text(540, 190, 'BEAT THE SCORE • UNLOCK THE NEXT MAP', labelStyle(27, '#58ddff'))
      .setOrigin(0.5);

    LEVELS.forEach((level, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 285 : 795;
      const y = 430 + row * 420;
      const unlocked = level.id <= save.highestUnlockedLevel;
      const selected = level.id === save.selectedLevel;
      const best = save.levelBestScores[String(level.id)] ?? 0;
      const cleared = best >= level.passScore;

      const background = this.add.graphics();
      background.fillStyle(unlocked ? COLORS.ink : 0x1c1d2e, unlocked ? 0.94 : 0.84);
      background.fillRoundedRect(-214, -158, 428, 316, 42);
      background.lineStyle(7, selected ? COLORS.cream : unlocked ? level.accent : 0x5c5f74, 1);
      background.strokeRoundedRect(-214, -158, 428, 316, 42);
      background.fillStyle(level.accent, unlocked ? 0.22 : 0.08);
      background.fillRoundedRect(-190, -132, 380, 72, 26);

      const levelNumber = this.add
        .text(-166, -97, `MAP ${level.id}`, labelStyle(24, unlocked ? '#fff6d5' : '#85889b'))
        .setOrigin(0, 0.5);
      const status = this.add
        .text(166, -97, unlocked ? (cleared ? '✓ CLEAR' : 'OPEN') : '🔒 LOCKED', labelStyle(21, unlocked ? '#ffd43b' : '#85889b'))
        .setOrigin(1, 0.5);
      const name = this.add
        .text(0, -22, level.name, labelStyle(32, unlocked ? '#fff6d5' : '#85889b'))
        .setOrigin(0.5);
      const subtitle = this.add
        .text(0, 28, level.subtitle, labelStyle(18, unlocked ? '#bfeeff' : '#777a8d'))
        .setOrigin(0.5)
        .setWordWrapWidth(350)
        .setAlign('center');
      const target = this.add
        .text(0, 91, `TARGET  ${level.passScore.toLocaleString()}`, labelStyle(24, unlocked ? '#ffcf4a' : '#777a8d'))
        .setOrigin(0.5);
      const bestLabel = this.add
        .text(0, 132, `BEST  ${best.toLocaleString()}`, labelStyle(20, unlocked ? '#58ddff' : '#777a8d'))
        .setOrigin(0.5);

      const card = this.add
        .container(x, y, [background, levelNumber, status, name, subtitle, target, bestLabel])
        .setSize(428, 316)
        .setDepth(20);

      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setScale(1.025));
        card.on('pointerout', () => card.setScale(1));
        card.on('pointerdown', () => card.setScale(0.98));
        card.on('pointerup', () => {
          card.setScale(1.025);
          SaveService.selectLevel(level.id);
          playSfx(this, 'click', { volume: 0.72 });
          HapticsService.selection();
          this.scene.start('Game');
        });
      } else {
        card.setAlpha(0.72);
      }
    });

    createButton(this, 540, 1780, 'BACK', () => {
      playSfx(this, 'click', { volume: 0.65 });
      HapticsService.selection();
      this.scene.start('Menu');
    }, { width: 420, height: 90, color: COLORS.cyan, fontSize: 34 });
  }
}
