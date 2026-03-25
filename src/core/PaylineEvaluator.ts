import { type SymbolDef, SYMBOLS, getHighestPayoutSymbol } from './SymbolTable';

export interface Payline {
  /** Array of [row, col] positions defining the payline path */
  positions: [number, number][];
}

export interface WinResult {
  payline: Payline;
  matchCount: number;
  symbol: SymbolDef;   // the matched symbol (or highest for all-wild)
  multiplier: number;  // payout multiplier
  winAmount: number;   // multiplier × bet
  /** Indices into payline.positions that contributed to the win */
  winPositions: [number, number][];
}

/**
 * Hardcoded payline patterns per column count.
 * Each pattern is an array of row indices (using 0=top, R=bottom, M=middle).
 * Patterns use placeholder values that get mapped to actual rows at runtime.
 * 'T'=0 (top), 'B'=rows-1 (bottom), 'M'=floor(rows/2)
 */
/**
 * Row position keys:
 * T=top(0), TM=upper-mid, M=middle, MB=lower-mid, B=bottom
 * TM/MB only resolve differently from T/M/B when rows >= 4
 */
type RowKey = 'T' | 'TM' | 'M' | 'MB' | 'B';

/** Base patterns that work with 3 rows (T/M/B only) */
const BASE_PATTERNS: Record<number, RowKey[][]> = {
  3: [
    ['T', 'M', 'B'],           // diagonal down
    ['B', 'M', 'T'],           // diagonal up
    ['T', 'B', 'T'],           // V-shape
    ['B', 'T', 'B'],           // inverted V
  ],
  4: [
    ['T', 'M', 'M', 'B'],     // gradual diagonal down
    ['B', 'M', 'M', 'T'],     // gradual diagonal up
    ['T', 'B', 'B', 'T'],     // V-shape (flat bottom)
    ['B', 'T', 'T', 'B'],     // inverted V (flat top)
    ['T', 'B', 'T', 'B'],     // zigzag
    ['B', 'T', 'B', 'T'],     // zigzag inverted
  ],
  5: [
    ['T', 'M', 'B', 'M', 'T'],  // V-shape
    ['B', 'M', 'T', 'M', 'B'],  // inverted V
    ['M', 'T', 'T', 'T', 'M'],  // inverted U
    ['M', 'B', 'B', 'B', 'M'],  // U-shape
    ['T', 'T', 'M', 'B', 'B'],  // diagonal down
    ['B', 'B', 'M', 'T', 'T'],  // diagonal up
    ['T', 'B', 'T', 'B', 'T'],  // zigzag
    ['B', 'T', 'B', 'T', 'B'],  // zigzag inverted
    ['M', 'T', 'M', 'B', 'M'],  // W from middle
    ['M', 'B', 'M', 'T', 'M'],  // M from middle
  ],
  6: [
    ['T', 'M', 'B', 'B', 'M', 'T'],  // V-shape
    ['B', 'M', 'T', 'T', 'M', 'B'],  // inverted V
    ['T', 'T', 'M', 'B', 'B', 'B'],  // gradual diagonal down
    ['B', 'B', 'M', 'T', 'T', 'T'],  // gradual diagonal up
    ['T', 'B', 'T', 'B', 'T', 'B'],  // zigzag
    ['B', 'T', 'B', 'T', 'B', 'T'],  // zigzag inverted
    ['M', 'T', 'T', 'T', 'T', 'M'],  // wide inverted U
    ['M', 'B', 'B', 'B', 'B', 'M'],  // wide U
  ],
};

/** Extra patterns unlocked when rows >= 4 (uses TM/MB positions) */
const EXTRA_ROW_PATTERNS: Record<number, RowKey[][]> = {
  3: [
    ['T', 'TM', 'M'],             // shallow diagonal down
    ['B', 'MB', 'M'],             // shallow diagonal up
    ['TM', 'B', 'TM'],            // shallow V
    ['MB', 'T', 'MB'],            // shallow inverted V
  ],
  4: [
    ['TM', 'B', 'B', 'TM'],       // shallow V
    ['MB', 'T', 'T', 'MB'],       // shallow inverted V
    ['T', 'TM', 'MB', 'B'],       // smooth diagonal down
    ['B', 'MB', 'TM', 'T'],       // smooth diagonal up
  ],
  5: [
    ['TM', 'M', 'B', 'M', 'TM'],  // shallow V
    ['MB', 'M', 'T', 'M', 'MB'],  // shallow inverted V
    ['T', 'TM', 'M', 'MB', 'B'],  // smooth diagonal down
    ['B', 'MB', 'M', 'TM', 'T'],  // smooth diagonal up
    ['TM', 'T', 'TM', 'B', 'MB'], // W from upper-mid
    ['MB', 'B', 'MB', 'T', 'TM'], // M from lower-mid
  ],
  6: [
    ['TM', 'M', 'B', 'B', 'M', 'TM'],  // shallow V
    ['MB', 'M', 'T', 'T', 'M', 'MB'],  // shallow inverted V
    ['T', 'TM', 'M', 'M', 'MB', 'B'],  // smooth diagonal down
    ['B', 'MB', 'M', 'M', 'TM', 'T'],  // smooth diagonal up
  ],
};

function resolveRow(key: RowKey, rows: number): number {
  const B = rows - 1;
  const M = Math.floor(rows / 2);
  switch (key) {
    case 'T': return 0;
    case 'TM': return Math.max(1, Math.floor(M / 2));
    case 'M': return M;
    case 'MB': return Math.min(B - 1, M + Math.floor((B - M) / 2));
    case 'B': return B;
  }
}

/** Generate paylines for a given grid size */
export function generatePaylines(rows: number, cols: number): Payline[] {
  const paylines: Payline[] = [];

  // Horizontal paylines: one per row (always active)
  for (let r = 0; r < rows; r++) {
    const positions: [number, number][] = [];
    for (let c = 0; c < cols; c++) {
      positions.push([r, c]);
    }
    paylines.push({ positions });
  }

  // Pattern-based paylines (require at least 3 rows and 3 cols)
  if (rows >= 3 && cols >= 3) {
    const base = BASE_PATTERNS[cols] ?? [];
    for (const pattern of base) {
      const positions: [number, number][] = pattern.map(
        (key, c) => [resolveRow(key, rows), c]
      );
      paylines.push({ positions });
    }

    // Extra patterns when 4+ rows (TM/MB become distinct positions)
    if (rows >= 4) {
      const extra = EXTRA_ROW_PATTERNS[cols] ?? [];
      for (const pattern of extra) {
        const positions: [number, number][] = pattern.map(
          (key, c) => [resolveRow(key, rows), c]
        );
        paylines.push({ positions });
      }
    }
  }

  return paylines;
}

/** Evaluate all paylines against a grid and return wins */
export function evaluatePaylines(
  grid: SymbolDef[][],
  paylines: Payline[],
  bet: number,
): WinResult[] {
  const wins: WinResult[] = [];

  for (const payline of paylines) {
    const result = evaluateSinglePayline(grid, payline, bet);
    if (result) wins.push(result);
  }

  return wins;
}

function evaluateSinglePayline(
  grid: SymbolDef[][],
  payline: Payline,
  bet: number,
): WinResult | null {
  const positions = payline.positions;
  if (positions.length < 3) return null;

  // Find the base symbol (first non-wild from the left)
  let baseSymbol: SymbolDef | null = null;
  for (const [r, c] of positions) {
    const sym = grid[r][c];
    if (!sym.isWild) {
      baseSymbol = sym;
      break;
    }
  }

  // Count consecutive matches from the left
  let matchCount = 0;
  const winPositions: [number, number][] = [];

  for (const [r, c] of positions) {
    const sym = grid[r][c];
    if (sym.isWild || (baseSymbol && sym.id === baseSymbol.id)) {
      matchCount++;
      winPositions.push([r, c]);
    } else {
      break;
    }
  }

  if (matchCount < 3) return null;

  // All-wild: pay as highest value symbol
  const paySymbol = baseSymbol ?? getHighestPayoutSymbol(matchCount);
  const multiplier = paySymbol.payouts[matchCount] ?? paySymbol.payouts[5] ?? 0;
  if (multiplier === 0) return null;

  // If all wilds, use the Blubo payout instead (it's higher)
  const finalSymbol = baseSymbol ? paySymbol : SYMBOLS.find(s => s.isWild)!;
  const finalMultiplier = baseSymbol ? multiplier : (finalSymbol.payouts[matchCount] ?? 0);

  return {
    payline,
    matchCount,
    symbol: baseSymbol ? paySymbol : finalSymbol,
    multiplier: finalMultiplier,
    winAmount: finalMultiplier * bet,
    winPositions,
  };
}
