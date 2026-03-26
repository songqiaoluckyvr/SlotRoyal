import { registry } from './PowerupRegistry';
import { SYMBOLS } from '../core/SymbolTable';
import type { PowerupDef } from './types';

const wildSymbol = SYMBOLS.find(s => s.isWild)!;

const def: PowerupDef = {
  type: 'sticky_wilds',
  name: 'Sticky Wilds',
  description: 'Wilds stay for extra spins',
  color: 0xffaaff,
  consumable: false,
  category: 'passive',
  tier: 'gold',

  create: () => ({
    id: `sticky_wilds_${Date.now()}`,
    type: 'sticky_wilds',
    name: 'Sticky Wilds',
    description: 'Wilds persist for 1 spin',
    color: 0xffaaff,
    value: 1, // turns to persist
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 1;
    existing.description = `Wilds persist for ${existing.value} spins`;
  },

  hooks: {
    onGridGenerated: (state, _powerup, grid) => {
      if (!state.runtime.stickyWildEntries) {
        state.runtime.stickyWildEntries = [];
      }

      // Place existing sticky wilds onto the grid, decrement turns
      const stillActive: { r: number; c: number; turns: number }[] = [];
      const placedPositions: string[] = [];
      for (const entry of state.runtime.stickyWildEntries) {
        if (entry.turns > 0 && entry.r < state.gridRows && entry.c < state.gridCols) {
          grid[entry.r][entry.c] = wildSymbol;
          placedPositions.push(`${entry.r},${entry.c}`);
          stillActive.push({ ...entry, turns: entry.turns - 1 });
        }
      }

      // Keep entries with remaining turns
      state.runtime.stickyWildEntries = stillActive.filter(e => e.turns > 0);
      // Store placed positions so GameScene scan can exclude them
      state.runtime.stickyWildPlacedThisSpin = placedPositions;
    },
  },
};

registry.register(def);
export default def;
