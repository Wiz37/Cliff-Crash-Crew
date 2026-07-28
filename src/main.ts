import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './styles.css';
import { gameConfig } from './game/config';
import { SaveService } from './game/services/SaveService';

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
