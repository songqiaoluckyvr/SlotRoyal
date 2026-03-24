export interface LevelDef {
  level: number;
  target: number;
  spins: number;
}

export function getLevelConfig(level: number): LevelDef {
  return {
    level,
    target: Math.round(50 * Math.pow(2, level)),  // Earnings target: $100, $200, $400, $800, $1600...
    spins: 25,
  };
}
