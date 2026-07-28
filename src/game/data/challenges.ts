export interface Challenge {
  type: 'blocks' | 'flips' | 'distance' | 'score';
  target: number;
  label: string;
  bonus: number;
}

export const CHALLENGES: Challenge[] = [
  { type: 'blocks', target: 10, label: 'BREAK 10 BLOCKS', bonus: 18 },
  { type: 'flips', target: 2, label: 'LAND 2 FLIPS', bonus: 22 },
  { type: 'distance', target: 180, label: 'FLY 180 METERS', bonus: 18 },
  { type: 'score', target: 5200, label: 'SCORE 5,200', bonus: 25 },
];
