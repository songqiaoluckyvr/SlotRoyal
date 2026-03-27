export interface LevelDef {
  level: number;
  target: number;
  spins: number;
  isFinal: boolean;
}

const LEVEL_TARGETS: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 600,
  5: 1200,
  6: 2400,
  7: 5000,
  8: 10000,
  9: 20000,
  10: Infinity, // endless — earn as much as possible
};

export const MAX_LEVEL = 10;

export function getLevelConfig(level: number): LevelDef {
  const clamped = Math.min(level, MAX_LEVEL);
  return {
    level: clamped,
    target: LEVEL_TARGETS[clamped] ?? Infinity,
    spins: 25,
    isFinal: clamped >= MAX_LEVEL,
  };
}
