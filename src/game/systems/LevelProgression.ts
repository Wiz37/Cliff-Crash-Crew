import Phaser from 'phaser';
import { getLevel, type LevelDefinition, type LevelTerrainPoint } from '../data/levels';
import { SaveService } from '../services/SaveService';
import { COLORS, labelStyle } from '../ui/theme';

let installed = false;

function addSlopeBody(
  scene: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 72,
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

function surfaceYAt(level: LevelDefinition, x: number): number {
  const points = level.terrain;
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (x < start.x || x > end.x) continue;
    const progress = (x - start.x) / Math.max(1, end.x - start.x);
    return Phaser.Math.Linear(start.y, end.y, progress);
  }

  return points[points.length - 1].y;
}

function drawRoadLine(
  graphics: Phaser.GameObjects.Graphics,
  points: LevelTerrainPoint[],
  width: number,
  color: number,
  alpha = 1,
): void {
  graphics.lineStyle(width, color, alpha);
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    graphics.lineBetween(start.x, start.y, end.x, end.y);
  }
}

function drawEnvironment(scene: any, level: LevelDefinition): void {
  scene.add
    .rectangle(540, 960, 1080, 1920, level.skyTint, 0.09)
    .setScrollFactor(0)
    .setDepth(-69)
    .setBlendMode(Phaser.BlendModes.ADD);

  const environment = scene.add.graphics().setDepth(-58).setScrollFactor(0.58);
  const courseEnd = level.courseLength + 300;

  if (level.theme === 'meadow') {
    environment.fillStyle(0x3f8f52, 0.55);
    for (let x = 1300; x < courseEnd; x += 430) {
      environment.fillCircle(x, 1540 + (x % 3) * 12, 58);
      environment.fillCircle(x + 70, 1560, 42);
    }
    environment.lineStyle(10, 0xf4e7b2, 0.75);
    for (let x = 1500; x < courseEnd; x += 310) {
      environment.lineBetween(x, 1580, x, 1680);
      environment.lineBetween(x, 1610, x + 250, 1610);
    }
  } else if (level.theme === 'construction') {
    environment.fillStyle(0x4f5964, 0.7);
    for (let x = 1650; x < courseEnd; x += 980) {
      environment.fillRect(x, 1050, 40, 560);
      environment.fillRect(x - 130, 1050, 430, 34);
      environment.fillTriangle(x + 250, 1050, x + 330, 1050, x + 290, 1280);
    }
    environment.lineStyle(18, 0xffd43b, 0.75);
    for (let x = 1500; x < courseEnd; x += 480) {
      environment.lineBetween(x, 1500, x + 180, 1620);
      environment.lineBetween(x + 180, 1500, x, 1620);
    }
  } else if (level.theme === 'canyon') {
    environment.fillStyle(0xb9653d, 0.72);
    for (let x = 1600, index = 0; x < courseEnd; x += 1050, index += 1) {
      const top = 730 + (index % 2) * 110;
      environment.fillTriangle(x - 430, 1600, x - 180, top, x + 60, 1600);
      environment.fillTriangle(x - 50, 1600, x + 170, top + 80, x + 440, 1600);
      environment.fillRect(x - 180, top, 350, 80);
    }
  } else if (level.theme === 'quarry') {
    environment.fillStyle(0x65727d, 0.78);
    for (let x = 1450; x < courseEnd; x += 520) {
      const base = 1650;
      environment.fillTriangle(x - 220, base, x, base - 270 - (x % 180), x + 230, base);
      environment.fillCircle(x - 80, base - 55, 86);
      environment.fillCircle(x + 65, base - 40, 110);
    }
  } else if (level.theme === 'skyway') {
    for (let x = 1350; x < courseEnd; x += 470) {
      scene.add
        .image(x, 1860 + (x % 4) * 35, 'cloud')
        .setScale(1.35 + (x % 3) * 0.12)
        .setAlpha(0.58)
        .setDepth(-54)
        .setScrollFactor(0.7);
    }
    environment.lineStyle(24, 0x8476c5, 0.6);
    level.terrain.forEach((point, index) => {
      if (index % 2 === 0) environment.lineBetween(point.x, point.y + 35, point.x, level.catchFloorY);
    });
  } else {
    environment.fillStyle(0x202033, 0.9);
    for (let x = 1350; x < courseEnd; x += 270) {
      const height = 260 + (x % 5) * 62;
      environment.fillRect(x, 1680 - height, 170, height);
      environment.fillStyle(level.accent, 0.72);
      for (let y = 1460 - height * 0.35; y < 1630; y += 70) {
        environment.fillRect(x + 35, y, 24, 12);
        environment.fillRect(x + 105, y + 22, 24, 12);
      }
      environment.fillStyle(0x202033, 0.9);
    }
    environment.lineStyle(10, level.accent, 0.7);
    for (let x = 1550; x < courseEnd; x += 520) environment.lineBetween(x, 1030, x, 1670);
  }
}

export function installLevelProgression(GameSceneClass: { prototype: object }): void {
  if (installed) return;
  installed = true;

  const proto = GameSceneClass.prototype as any;
  const baseCreate = proto.create;
  const baseCreateTower = proto.createTower;
  const baseFinishRun = proto.finishRun;

  proto.createTerrain = function (): void {
    const level = (this.activeLevel ?? getLevel(SaveService.get().selectedLevel)) as LevelDefinition;
    const upperSurfaceY = 1490;
    const rampStartX = 500;
    const rampStartY = upperSurfaceY;
    const rampEndX = level.rampEndX;
    const rampEndY = level.rampEndY;
    const lipEndX = rampEndX + level.lipLength;
    const elevated = level.theme === 'skyway' || level.theme === 'industrial';

    drawEnvironment(this, level);

    const terrain = this.add.graphics().setDepth(4);
    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.fillRect(-200, upperSurfaceY, 920, 520);
    terrain.fillStyle(level.roadEdge, 1);
    terrain.fillRect(-200, upperSurfaceY - 10, 920, 30);

    terrain.fillStyle(level.roadFill, 1);
    terrain.beginPath();
    terrain.moveTo(rampStartX, rampStartY);
    terrain.lineTo(rampEndX, rampEndY);
    terrain.lineTo(lipEndX, rampEndY);
    terrain.lineTo(720, rampStartY);
    terrain.closePath();
    terrain.fillPath();
    terrain.lineStyle(18, level.roadEdge, 1);
    terrain.lineBetween(rampStartX, rampStartY - 2, rampEndX, rampEndY);
    terrain.lineBetween(rampEndX, rampEndY, lipEndX, rampEndY);

    if (elevated) {
      drawRoadLine(terrain, level.terrain, 108, level.roadFill, 1);
      drawRoadLine(terrain, level.terrain, 18, level.roadEdge, 1);
    } else {
      terrain.fillStyle(level.roadFill, 1);
      terrain.beginPath();
      terrain.moveTo(level.terrain[0].x, level.terrain[0].y);
      level.terrain.slice(1).forEach((point) => terrain.lineTo(point.x, point.y));
      terrain.lineTo(level.courseLength, level.catchFloorY + 260);
      terrain.lineTo(level.terrain[0].x, level.catchFloorY + 260);
      terrain.closePath();
      terrain.fillPath();
      drawRoadLine(terrain, level.terrain, 18, level.roadEdge, 1);
    }

    const safetyWidth = level.courseLength - 1400;
    const safety = this.add.graphics().setDepth(2);
    safety.fillStyle(elevated ? 0x34344d : level.roadFill, elevated ? 0.52 : 1);
    safety.fillRect(1400, level.catchFloorY, safetyWidth, 300);
    safety.lineStyle(10, elevated ? level.accent : level.roadEdge, elevated ? 0.55 : 0.85);
    safety.lineBetween(1400, level.catchFloorY, level.courseLength, level.catchFloorY);

    const upperGround = this.matter.add.rectangle(250, upperSurfaceY + 130, 1040, 280, {
      isStatic: true,
      label: 'ground',
    });
    const ramp = addSlopeBody(this, rampStartX, rampStartY, rampEndX, rampEndY, 78);
    const lip = this.matter.add.rectangle(
      rampEndX + level.lipLength * 0.5,
      rampEndY + 31,
      level.lipLength,
      62,
      { isStatic: true, label: 'ground' },
    );
    const safetyFloor = this.matter.add.rectangle(
      1400 + safetyWidth * 0.5,
      level.catchFloorY + 110,
      safetyWidth,
      220,
      { isStatic: true, label: 'ground' },
    );

    const groundBodies: MatterJS.BodyType[] = [upperGround, ramp, lip, safetyFloor];
    for (let index = 0; index < level.terrain.length - 1; index += 1) {
      const start = level.terrain[index];
      const end = level.terrain[index + 1];
      groundBodies.push(addSlopeBody(this, start.x, start.y, end.x, end.y, elevated ? 86 : 78));
    }

    groundBodies.forEach((body) => {
      body.friction = 1.12;
      body.restitution = 0.045;
    });
    ramp.friction = 1.25;
    ramp.restitution = 0.012;
    lip.friction = 1.2;
    lip.restitution = 0.012;

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
    baseCreateTower.call(this, tower.x, surfaceYAt(level, tower.x) - 6, tower.rows, tower.columns);
  };

  proto.finishRun = function (): void {
    const level = (this.activeLevel ?? getLevel(SaveService.get().selectedLevel)) as LevelDefinition;
    const reachedEnd = Boolean(this.rig) && this.rig.x >= level.courseLength - 420;
    const fallenOut = Boolean(this.rig) && this.rig.y > 2200;
    const settled = this.runTime > 4 && this.settleTime > 1.45;
    const timedOut = this.runTime > 30;

    // The original scene asks to finish at x > 5850 or after 20 seconds. Ignore
    // those legacy limits until the longer 50–100 MPH course is actually done.
    if (!reachedEnd && !fallenOut && !settled && !timedOut) return;
    baseFinishRun.call(this);
  };

  proto.create = function (...args: unknown[]): void {
    this.activeLevel = getLevel(SaveService.get().selectedLevel);
    this.levelTowerCursor = 0;
    baseCreate.apply(this, args);

    const level = this.activeLevel as LevelDefinition;
    this.matter.world.setBounds(0, 0, level.courseLength, 2280, 220, true, true, false, true);
    this.cameras.main.setBounds(0, 0, level.courseLength, 1920);

    while (this.levelTowerCursor < level.towers.length) {
      const tower = level.towers[this.levelTowerCursor];
      this.levelTowerCursor += 1;
      baseCreateTower.call(this, tower.x, surfaceYAt(level, tower.x) - 6, tower.rows, tower.columns);
    }

    const panel = this.add.graphics().setScrollFactor(0).setDepth(202);
    panel.fillStyle(COLORS.ink, 0.9);
    panel.fillRoundedRect(215, 316, 650, 112, 34);
    panel.lineStyle(5, level.accent, 1);
    panel.strokeRoundedRect(215, 316, 650, 112, 34);

    this.add
      .text(540, 348, `MAP ${level.id}  •  ${level.name}`, labelStyle(24, '#fff6d5'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(203);
    this.add
      .text(540, 394, `50–100 MPH  •  CLEAR ${level.passScore.toLocaleString()}`, labelStyle(24, '#ffd43b'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(203);
  };
}
