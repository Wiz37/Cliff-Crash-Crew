import Phaser from 'phaser';

export const COLORS = {
  ink: 0x151629,
  cream: 0xfff6d5,
  sky: 0x51cfff,
  grass: 0x58b957,
  grassDark: 0x267b40,
  pink: 0xff4d86,
  cyan: 0x58ddff,
  orange: 0xff8a34,
  yellow: 0xffd43b,
  purple: 0x7b61ff,
  white: 0xffffff,
};

export const FONT = 'Arial Rounded MT Bold, Arial, sans-serif';

export function titleStyle(size: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: '900',
    color: '#fff6d5',
    stroke: '#151629',
    strokeThickness: Math.max(4, Math.round(size * 0.08)),
    shadow: { offsetX: 0, offsetY: Math.round(size * 0.07), color: '#090a15', blur: 0, stroke: true, fill: true },
    align: 'center',
  };
}

export function labelStyle(size: number, color = '#fff6d5'): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: '#151629',
    strokeThickness: Math.max(2, Math.round(size * 0.055)),
    align: 'center',
  };
}
