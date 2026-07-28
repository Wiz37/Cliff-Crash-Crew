import Phaser from 'phaser';
import { COLORS, labelStyle } from './theme';

export interface ButtonOptions {
  width?: number;
  height?: number;
  color?: number;
  fontSize?: number;
  strokeColor?: number;
  disabled?: boolean;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const width = options.width ?? 560;
  const height = options.height ?? 124;
  const color = options.color ?? COLORS.pink;
  const strokeColor = options.strokeColor ?? COLORS.ink;
  const fontSize = options.fontSize ?? 48;

  const shadow = scene.add.graphics();
  shadow.fillStyle(0x050611, 0.28);
  shadow.fillRoundedRect(-width / 2 + 8, -height / 2 + 14, width, height, 34);

  const panel = scene.add.graphics();
  panel.fillStyle(color, options.disabled ? 0.5 : 1);
  panel.lineStyle(7, strokeColor, 1);
  panel.fillRoundedRect(-width / 2, -height / 2, width, height, 34);
  panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 34);
  panel.fillStyle(0xffffff, 0.16);
  panel.fillRoundedRect(-width / 2 + 18, -height / 2 + 14, width - 36, 18, 9);

  const text = scene.add.text(0, 1, label, labelStyle(fontSize)).setOrigin(0.5);
  const container = scene.add.container(x, y, [shadow, panel, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.setData('label', text);
  container.setData('panel', panel);

  if (!options.disabled) {
    container.on('pointerdown', () => {
      container.setScale(0.96);
      container.y += 5;
    });
    container.on('pointerup', () => {
      container.setScale(1);
      container.y -= 5;
      onClick();
    });
    container.on('pointerout', () => {
      container.setScale(1);
    });
    container.on('pointerover', () => {
      scene.tweens.add({ targets: container, scaleX: 1.025, scaleY: 1.025, duration: 90 });
    });
  }

  return container;
}

export function setButtonLabel(button: Phaser.GameObjects.Container, label: string): void {
  const text = button.getData('label') as Phaser.GameObjects.Text | undefined;
  text?.setText(label);
}
