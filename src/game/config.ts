import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GarageScene } from './scenes/GarageScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1080,
  height: 1920,
  backgroundColor: '#151629',
  transparent: false,
  antialias: true,
  roundPixels: false,
  pixelArt: false,
  powerPreference: 'high-performance',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1.35 },
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 8,
      constraintIterations: 4,
      debug: false,
    },
  },
  input: {
    activePointers: 4,
    touch: { capture: true },
  },
  render: {
    antialias: true,
    antialiasGL: true,
    batchSize: 4096,
  },
  scene: [BootScene, PreloadScene, MenuScene, GarageScene, GameScene, ResultsScene],
};
