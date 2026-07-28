import Phaser from 'phaser';
import { generateGameTextures } from '../ui/TextureFactory';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateGameTextures(this);
    this.add.image(540, 960, 'sky-gradient').setDisplaySize(1080, 1920);
    this.add.circle(540, 780, 230, COLORS.yellow, 0.22);
    this.add.circle(540, 780, 150, COLORS.cream, 0.72);
    this.add.text(540, 670, 'CLIFF', titleStyle(116)).setOrigin(0.5);
    this.add.text(540, 790, 'CRASH', titleStyle(142)).setOrigin(0.5).setColor('#ff4d86');
    this.add.text(540, 915, 'CREW', titleStyle(116)).setOrigin(0.5);
    this.add.text(540, 1085, 'STARTING ENGINES…', labelStyle(34)).setOrigin(0.5);
    this.time.delayedCall(120, () => this.scene.start('Preload'));
  }
}
