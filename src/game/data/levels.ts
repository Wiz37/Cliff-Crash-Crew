export interface LevelTower {
  x: number;
  rows: number;
  columns: number;
}

export interface LevelBump {
  x: number;
  width: number;
  height: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  passScore: number;
  accent: number;
  skyTint: number;
  rampEndX: number;
  rampEndY: number;
  lipLength: number;
  lowerGroundY: number;
  towers: LevelTower[];
  bumps: LevelBump[];
}

/**
 * Difficulty rises one step at a time. The score targets are deliberately
 * conservative so an average run can unlock the next map without requiring a
 * perfect vehicle, paid unlock, or multiple flips.
 */
export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'MEADOW RUN',
    subtitle: 'Learn the roll and clear the toy yard.',
    passScore: 1800,
    accent: 0x69db7c,
    skyTint: 0x9be7ff,
    rampEndX: 1210,
    rampEndY: 1328,
    lipLength: 190,
    lowerGroundY: 1820,
    towers: [
      { x: 1780, rows: 4, columns: 4 },
      { x: 2780, rows: 4, columns: 3 },
    ],
    bumps: [{ x: 3650, width: 250, height: 95 }],
  },
  {
    id: 2,
    name: 'BUILDER BAY',
    subtitle: 'More blocks, one extra tower, gentle terrain.',
    passScore: 3200,
    accent: 0xffd43b,
    skyTint: 0xb9dcff,
    rampEndX: 1240,
    rampEndY: 1305,
    lipLength: 185,
    lowerGroundY: 1840,
    towers: [
      { x: 1740, rows: 5, columns: 4 },
      { x: 2800, rows: 5, columns: 4 },
      { x: 4300, rows: 4, columns: 3 },
    ],
    bumps: [
      { x: 2380, width: 260, height: 120 },
      { x: 3650, width: 240, height: 105 },
    ],
  },
  {
    id: 3,
    name: 'CANYON WORKS',
    subtitle: 'A taller drop and denser crash targets.',
    passScore: 4800,
    accent: 0xff922b,
    skyTint: 0xffd8a8,
    rampEndX: 1270,
    rampEndY: 1280,
    lipLength: 175,
    lowerGroundY: 1870,
    towers: [
      { x: 1760, rows: 6, columns: 5 },
      { x: 2920, rows: 5, columns: 4 },
      { x: 4480, rows: 5, columns: 4 },
    ],
    bumps: [
      { x: 2400, width: 280, height: 145 },
      { x: 3700, width: 270, height: 130 },
    ],
  },
  {
    id: 4,
    name: 'QUARRY RUSH',
    subtitle: 'Four towers and rougher landing lanes.',
    passScore: 6500,
    accent: 0x58ddff,
    skyTint: 0xa5d8ff,
    rampEndX: 1300,
    rampEndY: 1255,
    lipLength: 170,
    lowerGroundY: 1900,
    towers: [
      { x: 1780, rows: 6, columns: 5 },
      { x: 2940, rows: 6, columns: 5 },
      { x: 4140, rows: 5, columns: 4 },
      { x: 5260, rows: 5, columns: 4 },
    ],
    bumps: [
      { x: 2380, width: 300, height: 165 },
      { x: 3600, width: 285, height: 150 },
      { x: 4800, width: 250, height: 120 },
    ],
  },
  {
    id: 5,
    name: 'SKY HAUL',
    subtitle: 'Longer airtime, heavier towers, tighter recovery.',
    passScore: 8500,
    accent: 0x7b61ff,
    skyTint: 0xd0bfff,
    rampEndX: 1325,
    rampEndY: 1235,
    lipLength: 165,
    lowerGroundY: 1930,
    towers: [
      { x: 1800, rows: 7, columns: 5 },
      { x: 3000, rows: 6, columns: 5 },
      { x: 4200, rows: 6, columns: 5 },
      { x: 5350, rows: 5, columns: 4 },
    ],
    bumps: [
      { x: 2440, width: 320, height: 185 },
      { x: 3650, width: 300, height: 170 },
      { x: 4860, width: 280, height: 150 },
    ],
  },
  {
    id: 6,
    name: 'TITAN RUN',
    subtitle: 'The finale: big targets, but still fair.',
    passScore: 10800,
    accent: 0xff4d86,
    skyTint: 0xffc9de,
    rampEndX: 1340,
    rampEndY: 1220,
    lipLength: 160,
    lowerGroundY: 1950,
    towers: [
      { x: 1820, rows: 7, columns: 5 },
      { x: 2920, rows: 7, columns: 5 },
      { x: 4020, rows: 6, columns: 5 },
      { x: 5100, rows: 6, columns: 5 },
      { x: 5800, rows: 5, columns: 4 },
    ],
    bumps: [
      { x: 2360, width: 330, height: 195 },
      { x: 3500, width: 315, height: 185 },
      { x: 4640, width: 300, height: 170 },
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
