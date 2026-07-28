import Phaser from 'phaser';
import { VEHICLES, type VehicleSpec } from '../data/vehicles';
import { COLORS } from './theme';

function withOutline(graphics: Phaser.GameObjects.Graphics, width = 8): void {
  graphics.lineStyle(width, COLORS.ink, 1);
}

function generateSky(scene: Phaser.Scene): void {
  if (scene.textures.exists('sky-gradient')) return;
  const texture = scene.textures.createCanvas('sky-gradient', 1080, 1920);
  if (!texture) return;
  const context = texture.context;
  const gradient = context.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#31c8ff');
  gradient.addColorStop(0.56, '#a9ecff');
  gradient.addColorStop(1, '#fff1b9');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1920);
  texture.refresh();
}

function generateCloud(scene: Phaser.Scene): void {
  if (scene.textures.exists('cloud')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(70, 72, 46);
  g.fillCircle(123, 54, 60);
  g.fillCircle(184, 74, 43);
  g.fillRoundedRect(40, 68, 185, 68, 30);
  g.generateTexture('cloud', 260, 145);
  g.destroy();
}

function generateWheel(scene: Phaser.Scene): void {
  if (scene.textures.exists('wheel')) return;
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(54, 54, 50);
  g.lineStyle(6, 0x05060d, 1);
  g.strokeCircle(54, 54, 49);
  g.fillStyle(0x5d6270, 1);
  g.fillCircle(54, 54, 28);
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(54, 54, 14);
  g.lineStyle(4, COLORS.ink, 1);
  g.strokeCircle(54, 54, 14);
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = 54 + Math.cos(angle) * 25;
    const y = 54 + Math.sin(angle) * 25;
    g.lineBetween(54, 54, x, y);
  }
  g.generateTexture('wheel', 108, 108);
  g.destroy();
}

function generateBlock(scene: Phaser.Scene): void {
  if (scene.textures.exists('block')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(5, 5, 90, 62, 10);
  g.lineStyle(6, COLORS.ink, 1);
  g.strokeRoundedRect(5, 5, 90, 62, 10);
  g.fillStyle(0xffffff, 0.38);
  g.fillRoundedRect(14, 13, 72, 10, 5);
  g.generateTexture('block', 100, 72);
  g.destroy();
}

function generateParticles(scene: Phaser.Scene): void {
  if (!scene.textures.exists('spark')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(18, 0, 23, 15, 36, 18);
    g.fillTriangle(36, 18, 23, 22, 18, 36);
    g.fillTriangle(18, 36, 13, 22, 0, 18);
    g.fillTriangle(0, 18, 13, 15, 18, 0);
    g.generateTexture('spark', 36, 36);
    g.destroy();
  }
  if (!scene.textures.exists('dust')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 24, 22);
    g.generateTexture('dust', 48, 48);
    g.destroy();
  }
  if (!scene.textures.exists('smoke')) {
    const canvas = scene.textures.createCanvas('smoke', 96, 96);
    if (canvas) {
      const context = canvas.context;
      const gradient = context.createRadialGradient(48, 48, 3, 48, 48, 46);
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(0.45, 'rgba(255,255,255,0.46)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 96, 96);
      canvas.refresh();
    }
  }
}

function drawEye(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1): void {
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(x, y, 13 * scale);
  g.lineStyle(5 * scale, COLORS.ink, 1);
  g.strokeCircle(x, y, 13 * scale);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(x + 4 * scale, y, 5 * scale);
}

function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, color: number): void {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, width, height, 10);
  g.lineStyle(6, COLORS.ink, 1);
  g.strokeRoundedRect(x, y, width, height, 10);
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(x + 8, y + 7, width * 0.55, 8, 4);
}

function drawGeneric(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  const width = 270 * spec.length;
  const height = 78 * spec.height;
  const x = 220 - width / 2;
  const y = 110 - height / 2;
  g.fillStyle(spec.bodyColor, 1);
  withOutline(g);
  g.fillRoundedRect(x, y, width, height, 20);
  g.strokeRoundedRect(x, y, width, height, 20);
  drawWindow(g, x + width * 0.32, y - height * 0.27, width * 0.34, height * 0.48, spec.accentColor);
  g.fillStyle(spec.accentColor, 1);
  g.fillRoundedRect(x + width * 0.05, y + height * 0.47, width * 0.72, height * 0.16, 8);
  drawEye(g, x + width * 0.8, y + height * 0.35, 0.9);
  if (spec.id === 'rocket') {
    g.fillStyle(0xff8a34, 1);
    g.lineStyle(6, COLORS.ink, 1);
    g.fillTriangle(x + 4, y + height * 0.18, x - 58, y + height * 0.5, x + 4, y + height * 0.82);
    g.strokeTriangle(x + 4, y + height * 0.18, x - 58, y + height * 0.5, x + 4, y + height * 0.82);
  }
}

function drawBus(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  const x = 38;
  const y = 58;
  const width = 365;
  const height = 104;
  g.fillStyle(spec.bodyColor, 1);
  withOutline(g);
  g.fillRoundedRect(x, y, width, height, 18);
  g.strokeRoundedRect(x, y, width, height, 18);
  for (let i = 0; i < 5; i += 1) drawWindow(g, x + 24 + i * 58, y + 15, 47, 42, spec.accentColor);
  g.fillStyle(0xff6b6b, 1);
  g.fillRoundedRect(x + 18, y + height - 28, width - 36, 13, 6);
  drawEye(g, x + width - 42, y + 70, 0.9);
}

function drawBanana(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  const points = [
    new Phaser.Geom.Point(38, 103), new Phaser.Geom.Point(92, 145), new Phaser.Geom.Point(180, 165),
    new Phaser.Geom.Point(280, 150), new Phaser.Geom.Point(388, 82), new Phaser.Geom.Point(354, 126),
    new Phaser.Geom.Point(258, 183), new Phaser.Geom.Point(154, 190), new Phaser.Geom.Point(70, 158),
  ];
  g.fillStyle(spec.bodyColor, 1);
  g.lineStyle(8, COLORS.ink, 1);
  g.fillPoints(points, true);
  g.strokePoints(points, true);
  g.fillStyle(0xffffff, 0.25);
  g.fillEllipse(210, 133, 160, 22);
  drawEye(g, 330, 114, 0.95);
}

function drawDozer(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  g.fillStyle(0x343a40, 1);
  g.fillRoundedRect(70, 126, 245, 48, 22);
  g.lineStyle(7, COLORS.ink, 1);
  g.strokeRoundedRect(70, 126, 245, 48, 22);
  g.fillStyle(spec.bodyColor, 1);
  g.fillRoundedRect(104, 82, 190, 68, 16);
  g.strokeRoundedRect(104, 82, 190, 68, 16);
  drawWindow(g, 185, 44, 78, 55, spec.accentColor);
  g.fillStyle(0xcfd4da, 1);
  g.beginPath();
  g.moveTo(294, 84);
  g.lineTo(424, 58);
  g.lineTo(424, 174);
  g.lineTo(294, 145);
  g.closePath();
  g.fillPath();
  g.strokePath();
  drawEye(g, 244, 74, 0.85);
}

function drawExcavator(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  g.fillStyle(0x343a40, 1);
  g.fillRoundedRect(64, 137, 255, 43, 20);
  g.lineStyle(7, COLORS.ink, 1);
  g.strokeRoundedRect(64, 137, 255, 43, 20);
  g.fillStyle(spec.bodyColor, 1);
  g.fillRoundedRect(105, 91, 164, 64, 16);
  g.strokeRoundedRect(105, 91, 164, 64, 16);
  drawWindow(g, 178, 45, 76, 58, spec.accentColor);
  g.lineStyle(18, 0x555b66, 1);
  g.lineBetween(248, 95, 326, 42);
  g.lineBetween(326, 42, 403, 82);
  g.lineStyle(7, COLORS.ink, 1);
  g.strokeLineShape(new Phaser.Geom.Line(248, 95, 326, 42));
  g.strokeLineShape(new Phaser.Geom.Line(326, 42, 403, 82));
  g.fillStyle(0x8a919d, 1);
  g.fillTriangle(390, 75, 434, 96, 402, 142);
  g.strokeTriangle(390, 75, 434, 96, 402, 142);
  drawEye(g, 227, 72, 0.82);
}

function drawDump(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  g.fillStyle(spec.bodyColor, 1);
  g.lineStyle(7, COLORS.ink, 1);
  g.fillRoundedRect(50, 100, 125, 70, 15);
  g.strokeRoundedRect(50, 100, 125, 70, 15);
  drawWindow(g, 72, 62, 78, 54, spec.accentColor);
  g.beginPath();
  g.moveTo(165, 85);
  g.lineTo(392, 58);
  g.lineTo(410, 154);
  g.lineTo(175, 162);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.fillStyle(0xffffff, 0.14);
  g.fillRoundedRect(196, 89, 160, 14, 7);
  drawEye(g, 128, 92, 0.82);
}

function drawSupercar(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  const points = [
    new Phaser.Geom.Point(28, 139), new Phaser.Geom.Point(104, 92), new Phaser.Geom.Point(203, 70),
    new Phaser.Geom.Point(314, 78), new Phaser.Geom.Point(412, 120), new Phaser.Geom.Point(405, 158),
    new Phaser.Geom.Point(328, 172), new Phaser.Geom.Point(92, 174),
  ];
  g.fillStyle(spec.bodyColor, 1);
  g.lineStyle(8, COLORS.ink, 1);
  g.fillPoints(points, true);
  g.strokePoints(points, true);
  const glass = [
    new Phaser.Geom.Point(132, 94), new Phaser.Geom.Point(208, 78), new Phaser.Geom.Point(282, 84),
    new Phaser.Geom.Point(319, 111), new Phaser.Geom.Point(156, 112),
  ];
  g.fillStyle(spec.accentColor, 1);
  g.fillPoints(glass, true);
  g.strokePoints(glass, true);
  g.fillStyle(spec.id === 'hypercar' ? 0x68f5ff : 0x20232c, 1);
  g.fillRoundedRect(316, 69, 72, 14, 6);
  g.strokeRoundedRect(316, 69, 72, 14, 6);
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(88, 132, 230, 11, 5);
  drawEye(g, 350, 124, 0.78);
}

function drawSemi(g: Phaser.GameObjects.Graphics, spec: VehicleSpec): void {
  const trailerLength = spec.id === 'hauler' ? 250 : 205;
  g.fillStyle(spec.bodyColor, 1);
  g.lineStyle(7, COLORS.ink, 1);
  g.fillRoundedRect(28, 83, 118, 88, 16);
  g.strokeRoundedRect(28, 83, 118, 88, 16);
  drawWindow(g, 48, 48, 76, 55, spec.accentColor);
  g.fillRoundedRect(143, 100, trailerLength, 70, 15);
  g.strokeRoundedRect(143, 100, trailerLength, 70, 15);
  g.fillStyle(0xffffff, 0.16);
  g.fillRoundedRect(174, 117, trailerLength - 56, 15, 7);
  g.fillStyle(0x555b66, 1);
  g.fillRoundedRect(142, 42, 12, 61, 5);
  g.fillRoundedRect(165, 42, 12, 61, 5);
  drawEye(g, 103, 111, 0.82);
}

function generateVehicle(scene: Phaser.Scene, spec: VehicleSpec): void {
  const key = `vehicle-${spec.id}`;
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  switch (spec.id) {
    case 'bus': drawBus(g, spec); break;
    case 'banana': drawBanana(g, spec); break;
    case 'dozer': drawDozer(g, spec); break;
    case 'excavator': drawExcavator(g, spec); break;
    case 'dump': drawDump(g, spec); break;
    case 'supercar':
    case 'hypercar': drawSupercar(g, spec); break;
    case 'semi':
    case 'hauler': drawSemi(g, spec); break;
    default: drawGeneric(g, spec); break;
  }
  g.generateTexture(key, 460, 220);
  g.destroy();
}

export function generateGameTextures(scene: Phaser.Scene): void {
  generateSky(scene);
  generateCloud(scene);
  generateWheel(scene);
  generateBlock(scene);
  generateParticles(scene);
  VEHICLES.forEach((spec) => generateVehicle(scene, spec));
}
