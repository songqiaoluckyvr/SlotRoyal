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

/** Generate paylines for a given grid size */
export function generatePaylines(rows: number, cols: number): Payline[] {
  const paylines: Payline[] = [];

  // Horizontal paylines: one per row
  for (let r = 0; r < rows; r++) {
    const positions: [number, number][] = [];
    for (let c = 0; c < cols; c++) {
      positions.push([r, c]);
    }
    paylines.push({ positions });
  }

  // Diagonals: only when grid is at least 3×3
  if (rows >= 3 && cols >= 3) {
    const diagLen = Math.min(rows, cols);

    // Top-left to bottom-right
    const diag1: [number, number][] = [];
    for (let i = 0; i < diagLen; i++) {
      diag1.push([i, i]);
    }
    paylines.push({ positions: diag1 });

    // Top-right to bottom-left
    const diag2: [number, number][] = [];
    for (let i = 0; i < diagLen; i++) {
      diag2.push([i, cols - 1 - i]);
    }
    paylines.push({ positions: diag2 });
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
