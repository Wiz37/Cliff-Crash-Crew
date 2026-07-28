import Phaser from 'phaser';
import { COLORS } from './theme';

export interface BackdropLayers {
  sun: Phaser.GameObjects.Arc;
  mountainsFar: Phaser.GameObjects.Graphics;
  mountainsNear: Phaser.GameObjects.Graphics;
  clouds: Phaser.GameObjects.Container;
}

export function createBackdrop(scene: Phaser.Scene): BackdropLayers {
  const sky = scene.add.image(540, 960, 'sky-gradient').setScrollFactor(0).setDepth(-100);
  sky.setDisplaySize(1080, 1920);

  const sun = scene.add.circle(820, 290, 126, 0xfff2a8, 0.9).setScrollFactor(0.02).setDepth(-92);
  scene.add.circle(820, 290, 172, 0xfff2a8, 0.14).setScrollFactor(0.02).setDepth(-93);

  const far = scene.add.graphics().setDepth(-90).setScrollFactor(0.12);
  far.fillStyle(0x92d6ca, 1);
  far.beginPath();
  far.moveTo(-400, 1250);
  far.lineTo(180, 700);
  far.lineTo(490, 1010);
  far.lineTo(840, 610);
  far.lineTo(1350, 1080);
  far.lineTo(1700, 730);
  far.lineTo(2200, 1250);
  far.lineTo(-400, 1250);
  far.closePath();
  far.fillPath();

  const near = scene.add.graphics().setDepth(-80).setScrollFactor(0.24);
  near.fillStyle(0x61b878, 1);
  near.beginPath();
  near.moveTo(-500, 1420);
  near.lineTo(90, 1030);
  near.lineTo(480, 1270);
  near.lineTo(930, 860);
  near.lineTo(1450, 1310);
  near.lineTo(2050, 980);
  near.lineTo(2600, 1420);
  near.closePath();
  near.fillPath();

  const clouds = scene.add.container(0, 0).setDepth(-88).setScrollFactor(0.08);
  const positions = [
    [140, 260, 1.05], [560, 420, 0.78], [980, 210, 0.9], [1420, 350, 1.2], [1960, 180, 0.7],
  ];
  positions.forEach(([x, y, scale]) => {
    const cloud = scene.add.image(x, y, 'cloud').setScale(scale).setAlpha(0.84);
    clouds.add(cloud);
    scene.tweens.add({ targets: cloud, x: x + 90, duration: 8500 + x * 2, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });

  const haze = scene.add.rectangle(540, 1360, 1080, 450, COLORS.cream, 0.13).setScrollFactor(0).setDepth(-70);
  haze.setBlendMode(Phaser.BlendModes.ADD);

  return { sun, mountainsFar: far, mountainsNear: near, clouds };
}
