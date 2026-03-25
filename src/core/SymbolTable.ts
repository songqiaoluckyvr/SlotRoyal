export interface SymbolDef {
  id: string;
  name: string;
  label: string;   // short text for MVP rendering
  color: number;    // hex color for rectangle
  weight: number;   // rarity weight (higher = more common)
  isWild: boolean;
  payouts: Record<number, number>; // matchCount → multiplier
}

export const SYMBOLS: readonly SymbolDef[] = [
  // Low-pay Blubos (common, color variants)
  {
    id: 'blue', name: 'Blue Blubo', label: 'BLU', color: 0x4488ff,
    weight: 25, isWild: false,
    payouts: { 3: 2, 4: 5, 5: 10, 6: 20 },
  },
  {
    id: 'teal', name: 'Teal Blubo', label: 'TEL', color: 0x44ccaa,
    weight: 25, isWild: false,
    payouts: { 3: 2, 4: 5, 5: 10, 6: 20 },
  },
  {
    id: 'pink', name: 'Pink Blubo', label: 'PNK', color: 0xff66aa,
    weight: 22, isWild: false,
    payouts: { 3: 3, 4: 8, 5: 15, 6: 30 },
  },
  {
    id: 'purple', name: 'Purple Blubo', label: 'PRP', color: 0xaa44ff,
    weight: 22, isWild: false,
    payouts: { 3: 3, 4: 8, 5: 15, 6: 30 },
  },
  {
    id: 'red', name: 'Red Blubo', label: 'RED', color: 0xff4444,
    weight: 20, isWild: false,
    payouts: { 3: 5, 4: 12, 5: 25, 6: 50 },
  },
  // High-pay Blubos (rare, face cards)
  {
    id: 'jack', name: 'Jack Blubo', label: 'J', color: 0xcd7f32,
    weight: 10, isWild: false,
    payouts: { 3: 10, 4: 25, 5: 50, 6: 100 },
  },
  {
    id: 'queen', name: 'Queen Blubo', label: 'Q', color: 0xccccdd,
    weight: 7, isWild: false,
    payouts: { 3: 15, 4: 40, 5: 80, 6: 160 },
  },
  {
    id: 'king', name: 'King Blubo', label: 'K', color: 0xffd700,
    weight: 4, isWild: false,
    payouts: { 3: 25, 4: 75, 5: 150, 6: 300 },
  },
  // Wild
  {
    id: 'wild', name: 'Wild Blubo', label: 'W', color: 0xffffff,
    weight: 2, isWild: true,
    payouts: { 3: 50, 4: 150, 5: 500, 6: 1000 },
  },
];

export function getSymbolById(id: string): SymbolDef {
  const sym = SYMBOLS.find(s => s.id === id);
  if (!sym) throw new Error(`Unknown symbol: ${id}`);
  return sym;
}

/** Get the highest-value symbol (for all-wild paylines) */
export function getHighestPayoutSymbol(matchCount: number): SymbolDef {
  let best: SymbolDef = SYMBOLS[0];
  let bestPay = 0;
  for (const s of SYMBOLS) {
    if (!s.isWild && (s.payouts[matchCount] ?? 0) > bestPay) {
      bestPay = s.payouts[matchCount] ?? 0;
      best = s;
    }
  }
  return best;
}
