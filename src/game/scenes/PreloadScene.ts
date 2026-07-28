import Phaser from 'phaser';
import { COLORS, labelStyle } from '../ui/theme';
import { AUDIO_URLS } from '../data/assets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.add.image(540, 960, 'sky-gradient').setDisplaySize(1080, 1920);
    this.add.image(540, 730, 'vehicle-rocket').setScale(1.2).setRotation(-0.08);

    const track = this.add.graphics();
    track.fillStyle(COLORS.ink, 0.88);
    track.fillRoundedRect(170, 1100, 740, 72, 36);
    track.lineStyle(6, COLORS.cream, 0.8);
    track.strokeRoundedRect(170, 1100, 740, 72, 36);

    const fill = this.add.graphics();
    const status = this.add.text(540, 1235, 'LOADING CRASHES', labelStyle(32)).setOrigin(0.5);

    this.load.on('progress', (progress: number) => {
      fill.clear();
      fill.fillStyle(COLORS.pink, 1);
      fill.fillRoundedRect(182, 1112, 716 * progress, 48, 24);
      status.setText(`LOADING CRASHES ${Math.round(progress * 100)}%`);
    });

    this.load.audio('music', AUDIO_URLS.music);
    this.load.audio('engine', AUDIO_URLS.engine);
    this.load.audio('launch', AUDIO_URLS.launch);
    this.load.audio('impact1', AUDIO_URLS.impact1);
    this.load.audio('impact2', AUDIO_URLS.impact2);
    this.load.audio('impact3', AUDIO_URLS.impact3);
    this.load.audio('break', AUDIO_URLS.break);
    this.load.audio('star', AUDIO_URLS.star);
    this.load.audio('click', AUDIO_URLS.click);
  }

  create(): void {
    this.scene.start('Menu');
  }
}
