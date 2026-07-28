export interface LevelTower {
  x: number;
  rows: number;
  columns: number;
}

export interface LevelTerrainPoint {
  x: number;
  y: number;
}

export type LevelTheme = 'meadow' | 'construction' | 'canyon' | 'quarry' | 'skyway' | 'industrial';

export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  passScore: number;
  accent: number;
  skyTint: number;
  theme: LevelTheme;
  rampEndX: number;
  rampEndY: number;
  lipLength: number;
  roadFill: number;
  roadEdge: number;
  catchFloorY: number;
  terrain: LevelTerrainPoint[];
  towers: LevelTower[];
}

/**
 * Every map introduces a different driving rhythm, visual identity, and terrain
 * shape. Score targets remain conservative so the player can progress with the
 * starter vehicle and ordinary crash runs rather than perfect flips.
 */
export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'MEADOW RUN',
    subtitle: 'Fast grass, soft rollers, and room to learn.',
    passScore: 1400,
    accent: 0x69db7c,
    skyTint: 0x9be7ff,
    theme: 'meadow',
    rampEndX: 1210,
    rampEndY: 1328,
    lipLength: 190,
    roadFill: 0x397a48,
    roadEdge: 0x8ef0a0,
    catchFloorY: 2130,
    terrain: [
      { x: 1450, y: 1695 },
      { x: 2350, y: 1695 },
      { x: 3050, y: 1640 },
      { x: 3750, y: 1695 },
      { x: 4700, y: 1660 },
      { x: 6200, y: 1695 },
    ],
    towers: [
      { x: 1780, rows: 4, columns: 4 },
      { x: 2780, rows: 4, columns: 3 },
    ],
  },
  {
    id: 2,
    name: 'BUILDER BAY',
    subtitle: 'Stepped platforms and a busy construction yard.',
    passScore: 2500,
    accent: 0xffd43b,
    skyTint: 0xb9dcff,
    theme: 'construction',
    rampEndX: 1240,
    rampEndY: 1305,
    lipLength: 185,
    roadFill: 0x5f5b4a,
    roadEdge: 0xffd43b,
    catchFloorY: 2140,
    terrain: [
      { x: 1450, y: 1710 },
      { x: 2200, y: 1710 },
      { x: 2450, y: 1600 },
      { x: 3300, y: 1600 },
      { x: 3550, y: 1715 },
      { x: 4450, y: 1715 },
      { x: 4700, y: 1585 },
      { x: 6200, y: 1585 },
    ],
    towers: [
      { x: 1740, rows: 5, columns: 4 },
      { x: 2860, rows: 5, columns: 4 },
      { x: 5000, rows: 4, columns: 3 },
    ],
  },
  {
    id: 3,
    name: 'CANYON WORKS',
    subtitle: 'Drop into the basin, then charge the canyon wall.',
    passScore: 3700,
    accent: 0xff922b,
    skyTint: 0xffd8a8,
    theme: 'canyon',
    rampEndX: 1270,
    rampEndY: 1280,
    lipLength: 175,
    roadFill: 0x8f4e2f,
    roadEdge: 0xffb36b,
    catchFloorY: 2160,
    terrain: [
      { x: 1450, y: 1730 },
      { x: 2200, y: 1840 },
      { x: 3050, y: 1880 },
      { x: 3850, y: 1580 },
      { x: 4700, y: 1710 },
      { x: 5450, y: 1630 },
      { x: 6200, y: 1700 },
    ],
    towers: [
      { x: 1760, rows: 6, columns: 5 },
      { x: 3060, rows: 5, columns: 4 },
      { x: 4630, rows: 5, columns: 4 },
    ],
  },
  {
    id: 4,
    name: 'QUARRY RUSH',
    subtitle: 'Heavy rollers, sharp crests, and rock-yard momentum.',
    passScore: 5000,
    accent: 0x58ddff,
    skyTint: 0xa5d8ff,
    theme: 'quarry',
    rampEndX: 1300,
    rampEndY: 1255,
    lipLength: 170,
    roadFill: 0x46525c,
    roadEdge: 0x7be7ff,
    catchFloorY: 2170,
    terrain: [
      { x: 1450, y: 1740 },
      { x: 2150, y: 1570 },
      { x: 2850, y: 1790 },
      { x: 3550, y: 1530 },
      { x: 4250, y: 1810 },
      { x: 5000, y: 1600 },
      { x: 5600, y: 1760 },
      { x: 6200, y: 1660 },
    ],
    towers: [
      { x: 1760, rows: 6, columns: 5 },
      { x: 2940, rows: 6, columns: 5 },
      { x: 4180, rows: 5, columns: 4 },
      { x: 5260, rows: 5, columns: 4 },
    ],
  },
  {
    id: 5,
    name: 'SKY HAUL',
    subtitle: 'An elevated freight road above a forgiving cloud deck.',
    passScore: 6500,
    accent: 0x7b61ff,
    skyTint: 0xd0bfff,
    theme: 'skyway',
    rampEndX: 1325,
    rampEndY: 1235,
    lipLength: 165,
    roadFill: 0x50506e,
    roadEdge: 0xb7a8ff,
    catchFloorY: 2050,
    terrain: [
      { x: 1450, y: 1630 },
      { x: 2300, y: 1560 },
      { x: 3050, y: 1680 },
      { x: 3850, y: 1495 },
      { x: 4650, y: 1610 },
      { x: 5450, y: 1470 },
      { x: 6200, y: 1550 },
    ],
    towers: [
      { x: 1800, rows: 7, columns: 5 },
      { x: 3020, rows: 6, columns: 5 },
      { x: 4230, rows: 6, columns: 5 },
      { x: 5480, rows: 5, columns: 4 },
    ],
  },
  {
    id: 6,
    name: 'TITAN RUN',
    subtitle: 'Neon industry, huge crests, and the final demolition line.',
    passScore: 8200,
    accent: 0xff4d86,
    skyTint: 0xffc9de,
    theme: 'industrial',
    rampEndX: 1340,
    rampEndY: 1220,
    lipLength: 160,
    roadFill: 0x302b43,
    roadEdge: 0xff5ca8,
    catchFloorY: 2110,
    terrain: [
      { x: 1450, y: 1710 },
      { x: 2050, y: 1530 },
      { x: 2750, y: 1780 },
      { x: 3500, y: 1460 },
      { x: 4300, y: 1800 },
      { x: 5050, y: 1510 },
      { x: 5700, y: 1710 },
      { x: 6200, y: 1540 },
    ],
    towers: [
      { x: 1820, rows: 7, columns: 5 },
      { x: 2920, rows: 7, columns: 5 },
      { x: 4020, rows: 6, columns: 5 },
      { x: 5100, rows: 6, columns: 5 },
      { x: 5800, rows: 5, columns: 4 },
    ],
  },
];

export function getLevel(id: number): LevelDefinition {
  const safeId = Number.isFinite(id) ? Math.floor(id) : 1;
  return LEVELS.find((level) => level.id === safeId) ?? LEVELS[0];
}

export function getNextLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id + 1);
}
