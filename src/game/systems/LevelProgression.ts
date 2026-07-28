import Phaser from 'phaser';
import { getLevel, type LevelDefinition } from '../data/levels';
import { SaveService } from '../services/SaveService';
import { COLORS, labelStyle } from '../ui/theme';

let installed = false;

function addSlopeBody(
  scene: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 64,
): MatterJS.BodyType {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.hypot(x2 - x1, y2 - y1);
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  const centerX = (x1 + x2) * 0.5 + normalX * thickness * 0.5;
  const centerY = (y1 + y2) * 0.5 + normalY * thickness * 0.5;

  return scene.matter.add.rectangle(centerX, centerY, length, thickness, {
    isStatic: true,
    angle,
    label: 'ground',
  });
}

export function installLevelProgression(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const proto = GameSceneClass.prototype as any;
  const baseCreate = proto.create;
  const baseCreateTower = proto.createTower;

  proto.createTerrain = function (): void {
    const level = (this.activeLevel ?? getLevel(SaveService.get().selectedLevel)) as LevelDefinition;
    const upperSurfaceY = 1490;
    const rampStartX = 500;
    const rampStartY = upperSurfaceY;
    const rampEndX = level.rampEndX;
    const rampEndY = level.rampEndY;
    const lipEndX = rampEndX + level.lipLength;
    const lowerTopY = level.lowerGroundY - 125;

    const terrain = this.add.graphics().setDepth(4);

    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.fillRect(-200, upperSurfaceY, 920, 520);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(-200, upperSurfaceY - 10, 920, 30);

    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.beginPath();
    terrain.moveTo(rampStartX, rampStartY);
    terrain.lineTo(rampEndX, rampEndY);
    terrain.lineTo(lipEndX, rampEndY);
    terrain.lineTo(720, rampStartY);
    terrain.closePath();
    terrain.fillPath();
    terrain.lineStyle(18, level.accent, 1);
    terrain.lineBetween(rampStartX, rampStartY - 2, rampEndX, rampEndY);
    terrain.lineBetween(rampEndX, rampEndY, lipEndX, rampEndY);

    terrain.fillStyle(0x356f43, 1);
    terrain.fillRect(1450, lowerTopY, 4750, 650);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(1450, lowerTopY - 12, 4750, 32);

    level.bumps.forEach((bump, index) => {
      const half = bump.width * 0.5;
      const apexY = lowerTopY - bump.height;
      const tint = index % 2 === 0 ? 0x2e6d3d : 0x285f38;
      terrain.fillStyle(tint, 1);
      terrain.fillTriangle(bump.x - half, lowerTopY, bump.x, apexY, bump.x + half, lowerTopY);
      terrain.lineStyle(13, level.accent, 0.9);
      terrain.lineBetween(bump.x - half, lowerTopY, bump.x, apexY);
      terrain.lineBetween(bump.x, apexY, bump.x + half, lowerTopY);
    });

    terrain.fillStyle(0x203d31, 1);
    for (let x = 1540; x < 6100; x += 310) {
      terrain.fillCircle(x, lowerTopY + 40, 22);
      terrain.fillCircle(x + 42, lowerTopY + 46, 15);
    }

    const upperGround = this.matter.add.rectangle(250, upperSurfaceY + 130, 1040, 280, {
      isStatic: true,
      label: 'ground',
    });
    const ramp = addSlopeBody(this, rampStartX, rampStartY, rampEndX, rampEndY, 74);
    const lip = this.matter.add.rectangle(
      rampEndX + level.lipLength * 0.5,
      rampEndY + 31,
      level.lipLength,
      62,
      { isStatic: true, label: 'ground' },
    );
    const lowerGround = this.matter.add.rectangle(3825, level.lowerGroundY, 4750, 250, {
      isStatic: true,
      label: 'ground',
    });

    const groundBodies: MatterJS.BodyType[] = [upperGround, ramp, lip, lowerGround];

    level.bumps.forEach((bump) => {
      const half = bump.width * 0.5;
      const apexY = lowerTopY - bump.height;
      groundBodies.push(addSlopeBody(this, bump.x - half, lowerTopY, bump.x, apexY, 52));
      groundBodies.push(addSlopeBody(this, bump.x, apexY, bump.x + half, lowerTopY, 52));
    });

    groundBodies.forEach((body) => {
      body.friction = 0.94;
      body.restitution = 0.1;
    });
    ramp.friction = 1;
    ramp.restitution = 0.02;
    lip.friction = 1;
    lip.restitution = 0.02;

    const sign = this.add
      .text(lipEndX - 20, rampEndY - 105, level.name, labelStyle(34, '#fff6d5'))
      .setOrigin(1, 0.5)
      .setRotation(-0.02)
      .setDepth(5)
      .setStroke('#151629', 8);
    sign.setAlpha(0.96);
  };

  proto.createTower = function (_x: number, _floorY: number, _rows: number, _columns: number): void {
    const level = (this.activeLevel ?? getLevel(SaveService.get().selectedLevel)) as LevelDefinition;
    const index = this.levelTowerCursor ?? 0;
    this.levelTowerCursor = index + 1;
    const tower = level.towers[index];
    if (!tower) return;
    const floorY = level.lowerGroundY - 145;
    baseCreateTower.call(this, tower.x, floorY, tower.rows, tower.columns);
  };

  proto.create = function (...args: unknown[]): void {
    this.activeLevel = getLevel(SaveService.get().selectedLevel);
    this.levelTowerCursor = 0;
    baseCreate.apply(this, args);

    const level = this.activeLevel as LevelDefinition;
    while (this.levelTowerCursor < level.towers.length) {
      const tower = level.towers[this.levelTowerCursor];
      this.levelTowerCursor += 1;
      baseCreateTower.call(this, tower.x, level.lowerGroundY - 145, tower.rows, tower.columns);
    }

    const panel = this.add.graphics().setScrollFactor(0).setDepth(202);
    panel.fillStyle(COLORS.ink, 0.86);
    panel.fillRoundedRect(245, 320, 590, 92, 32);
    panel.lineStyle(5, level.accent, 1);
    panel.strokeRoundedRect(245, 320, 590, 92, 32);

    this.add
      .text(540, 348, `MAP ${level.id}  •  ${level.name}`, labelStyle(24, '#fff6d5'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(203);
    this.add
      .text(540, 387, `CLEAR SCORE  ${level.passScore.toLocaleString()}`, labelStyle(25, '#ffd43b'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(203);
  };
}
