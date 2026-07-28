import Phaser from 'phaser';
import { SaveService } from './SaveService';

const MUSIC_REGISTRY_KEY = 'ccc-music';
const ENGINE_REGISTRY_KEY = 'ccc-engine';

function getSound(scene: Phaser.Scene, key: string): Phaser.Sound.BaseSound | undefined {
  return scene.registry.get(key) as Phaser.Sound.BaseSound | undefined;
}

export function ensureMusic(scene: Phaser.Scene): Phaser.Sound.BaseSound {
  let music = getSound(scene, MUSIC_REGISTRY_KEY);
  if (!music) {
    music = scene.sound.add('music', { loop: true, volume: 0.34 });
    scene.registry.set(MUSIC_REGISTRY_KEY, music);
  }
  const save = SaveService.get();
  if (save.musicEnabled && !music.isPlaying) music.play();
  if (!save.musicEnabled && music.isPlaying) music.pause();
  return music;
}

export function setMusicEnabled(scene: Phaser.Scene, enabled: boolean): void {
  SaveService.update({ musicEnabled: enabled });
  const music = ensureMusic(scene);
  if (enabled && !music.isPlaying) music.play();
  if (!enabled && music.isPlaying) music.pause();
}

export function playSfx(scene: Phaser.Scene, key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
  if (!SaveService.get().soundEnabled) return;
  scene.sound.play(key, config);
}

export function startEngine(scene: Phaser.Scene): Phaser.Sound.BaseSound {
  let engine = getSound(scene, ENGINE_REGISTRY_KEY);
  if (!engine) {
    engine = scene.sound.add('engine', { loop: true, volume: 0.12 });
    scene.registry.set(ENGINE_REGISTRY_KEY, engine);
  }
  if (SaveService.get().soundEnabled && !engine.isPlaying) engine.play();
  return engine;
}

export function stopEngine(scene: Phaser.Scene): void {
  const engine = getSound(scene, ENGINE_REGISTRY_KEY);
  if (engine?.isPlaying) engine.stop();
}

export function setEngineIntensity(scene: Phaser.Scene, value: number): void {
  const engine = startEngine(scene);
  const intensity = Phaser.Math.Clamp(value, 0, 1);
  const rate = 0.72 + intensity * 0.7;
  const volume = 0.08 + intensity * 0.18;
  (engine as Phaser.Sound.WebAudioSound).setRate?.(rate);
  (engine as Phaser.Sound.WebAudioSound).setVolume?.(volume);
}
