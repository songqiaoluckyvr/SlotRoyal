export interface LevelDef {
  level: number;
  target: number;
  spins: number;
}

export function getLevelConfig(level: number): LevelDef {
  return {
    level,
    target: 100 * Math.pow(2, level),  // $200, $400, $800, $1600, $3200...
    spins: 25,
  };
}
