import { SYMBOLS, type SymbolDef } from './SymbolTable';
import { rng } from '../utils/Rng';

export interface SymbolWeightOverride {
  symbolId: string;
  additionalWeight: number;
}

/** Generate a random grid of symbols */
export function spin(
  rows: number,
  cols: number,
  weightOverrides: SymbolWeightOverride[] = [],
): SymbolDef[][] {
  // Build effective weights
  const symbols = SYMBOLS;
  const weights = symbols.map(s => {
    let w = s.weight;
    for (const ov of weightOverrides) {
      if (ov.symbolId === s.id) w += ov.additionalWeight;
    }
    return Math.max(0, w);
  });

  const grid: SymbolDef[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: SymbolDef[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(rng.weightedPick(symbols, weights));
    }
    grid.push(row);
  }

  return grid;
}

/** Re-roll a single cell with optional weight overrides */
export function spinSingleCell(
  weightOverrides: SymbolWeightOverride[] = [],
): SymbolDef {
  const symbols = SYMBOLS;
  const weights = symbols.map(s => {
    let w = s.weight;
    for (const ov of weightOverrides) {
      if (ov.symbolId === s.id) w += ov.additionalWeight;
    }
    return Math.max(0, w);
  });
  return rng.weightedPick(symbols, weights);
}
