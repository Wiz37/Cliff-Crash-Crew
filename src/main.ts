import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './styles.css';
import { gameConfig } from './game/config';
import { GameScene } from './game/scenes/GameScene';
import { SaveService } from './game/services/SaveService';
import { installNaturalRampTuning } from './game/systems/NaturalRampTuning';
import { installLevelProgression } from './game/systems/LevelProgression';
import { installPremiumGameplay } from './game/systems/PremiumGameplay';
import { installCrashMomentumTuning } from './game/systems/CrashMomentumTuning';

installNaturalRampTuning(GameScene);
installLevelProgression(GameScene);
installPremiumGameplay(GameScene);
installCrashMomentumTuning(GameScene);

const game = new Phaser.Game(gameConfig);

void SaveService.hydrateNative();

if (Capacitor.isNativePlatform()) {
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      game.loop.wake();
      game.sound.resumeAll();
    } else {
      game.sound.pauseAll();
      game.loop.sleep();
    }
  });
}

if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js');
  });
}
