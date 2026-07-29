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
  courseLength: number;
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
 * Courses are designed around a 50–100 MPH drivetrain. Long terrain segments,
 * broad landings, and spaced crash targets keep the speed exciting without
 * requiring perfect inputs. Clear scores rise with course length and target
 * density while remaining reachable with the starter vehicle.
 */
export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'MEADOW RUN',
    subtitle: 'Wide-open speed, soft rollers, and forgiving landings.',
    passScore: 2600,
    accent: 0x69db7c,
    skyTint: 0x9be7ff,
    theme: 'meadow',
    courseLength: 8000,
    rampEndX: 1450,
    rampEndY: 1338,
    lipLength: 300,
    roadFill: 0x397a48,
    roadEdge: 0x8ef0a0,
    catchFloorY: 2130,
    terrain: [
      { x: 1750, y: 1690 },
      { x: 2800, y: 1660 },
      { x: 3900, y: 1700 },
      { x: 5000, y: 1645 },
      { x: 6200, y: 1690 },
      { x: 7200, y: 1655 },
      { x: 8000, y: 1685 },
    ],
    towers: [
      { x: 2200, rows: 4, columns: 4 },
      { x: 4300, rows: 4, columns: 4 },
      { x: 6750, rows: 4, columns: 3 },
    ],
  },
  {
    id: 2,
    name: 'BUILDER BAY',
    subtitle: 'Fast construction lanes with broad stepped platforms.',
    passScore: 4300,
    accent: 0xffd43b,
    skyTint: 0xb9dcff,
    theme: 'construction',
    courseLength: 8300,
    rampEndX: 1480,
    rampEndY: 1322,
    lipLength: 300,
    roadFill: 0x5f5b4a,
    roadEdge: 0xffd43b,
    catchFloorY: 2140,
    terrain: [
      { x: 1780, y: 1700 },
      { x: 2600, y: 1700 },
      { x: 3000, y: 1600 },
      { x: 4100, y: 1600 },
      { x: 4550, y: 1710 },
      { x: 5750, y: 1710 },
      { x: 6200, y: 1590 },
      { x: 7300, y: 1590 },
      { x: 7800, y: 1680 },
      { x: 8300, y: 1680 },
    ],
    towers: [
      { x: 2150, rows: 5, columns: 4 },
      { x: 3550, rows: 5, columns: 4 },
      { x: 5200, rows: 5, columns: 4 },
      { x: 6900, rows: 4, columns: 3 },
    ],
  },
  {
    id: 3,
    name: 'CANYON WORKS',
    subtitle: 'A long basin run followed by a high-speed canyon climb.',
    passScore: 6500,
    accent: 0xff922b,
    skyTint: 0xffd8a8,
    theme: 'canyon',
    courseLength: 8600,
    rampEndX: 1500,
    rampEndY: 1308,
    lipLength: 275,
    roadFill: 0x8f4e2f,
    roadEdge: 0xffb36b,
    catchFloorY: 2160,
    terrain: [
      { x: 1775, y: 1720 },
      { x: 2900, y: 1820 },
      { x: 4200, y: 1850 },
      { x: 5400, y: 1600 },
      { x: 6600, y: 1700 },
      { x: 7600, y: 1610 },
      { x: 8600, y: 1690 },
    ],
    towers: [
      { x: 2150, rows: 6, columns: 5 },
      { x: 3700, rows: 5, columns: 4 },
      { x: 5850, rows: 5, columns: 4 },
      { x: 7850, rows: 5, columns: 4 },
    ],
  },
  {
    id: 4,
    name: 'QUARRY RUSH',
    subtitle: 'Long quarry rollers built for speed and heavy momentum.',
    passScore: 8800,
    accent: 0x58ddff,
    skyTint: 0xa5d8ff,
    theme: 'quarry',
    courseLength: 8900,
    rampEndX: 1530,
    rampEndY: 1292,
    lipLength: 270,
    roadFill: 0x46525c,
    roadEdge: 0x7be7ff,
    catchFloorY: 2170,
    terrain: [
      { x: 1800, y: 1720 },
      { x: 2900, y: 1580 },
      { x: 4000, y: 1770 },
      { x: 5100, y: 1550 },
      { x: 6200, y: 1790 },
      { x: 7300, y: 1600 },
      { x: 8200, y: 1740 },
      { x: 8900, y: 1660 },
    ],
    towers: [
      { x: 2200, rows: 6, columns: 5 },
      { x: 3550, rows: 6, columns: 5 },
      { x: 4750, rows: 5, columns: 4 },
      { x: 6750, rows: 5, columns: 4 },
      { x: 8350, rows: 5, columns: 4 },
    ],
  },
  {
    id: 5,
    name: 'SKY HAUL',
    subtitle: 'A fast elevated freight route above a forgiving cloud deck.',
    passScore: 11600,
    accent: 0x7b61ff,
    skyTint: 0xd0bfff,
    theme: 'skyway',
    courseLength: 9200,
    rampEndX: 1560,
    rampEndY: 1278,
    lipLength: 265,
    roadFill: 0x50506e,
    roadEdge: 0xb7a8ff,
    catchFloorY: 2070,
    terrain: [
      { x: 1825, y: 1620 },
      { x: 3000, y: 1560 },
      { x: 4200, y: 1660 },
      { x: 5400, y: 1505 },
      { x: 6600, y: 1610 },
      { x: 7850, y: 1485 },
      { x: 9200, y: 1560 },
    ],
    towers: [
      { x: 2250, rows: 7, columns: 5 },
      { x: 3800, rows: 6, columns: 5 },
      { x: 5900, rows: 6, columns: 5 },
      { x: 7450, rows: 6, columns: 5 },
      { x: 8650, rows: 5, columns: 4 },
    ],
  },
  {
    id: 6,
    name: 'TITAN RUN',
    subtitle: 'The 100 MPH neon-industrial demolition finale.',
    passScore: 15000,
    accent: 0xff4d86,
    skyTint: 0xffc9de,
    theme: 'industrial',
    courseLength: 9500,
    rampEndX: 1580,
    rampEndY: 1265,
    lipLength: 260,
    roadFill: 0x302b43,
    roadEdge: 0xff5ca8,
    catchFloorY: 2120,
    terrain: [
      { x: 1840, y: 1700 },
      { x: 2950, y: 1550 },
      { x: 4100, y: 1770 },
      { x: 5300, y: 1490 },
      { x: 6500, y: 1790 },
      { x: 7700, y: 1530 },
      { x: 8650, y: 1710 },
      { x: 9500, y: 1550 },
    ],
    towers: [
      { x: 2200, rows: 7, columns: 5 },
      { x: 3500, rows: 7, columns: 5 },
      { x: 4850, rows: 6, columns: 5 },
      { x: 6100, rows: 6, columns: 5 },
      { x: 7350, rows: 6, columns: 5 },
      { x: 8750, rows: 5, columns: 4 },
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
