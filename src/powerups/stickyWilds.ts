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
    onGridGenerated: (state, powerup, grid) => {
      // Track sticky positions with remaining turns each
      if (!state.runtime.stickyWildEntries) {
        state.runtime.stickyWildEntries = [];
      }

      // Place existing sticky wilds onto the grid
      const stillActive: { r: number; c: number; turns: number }[] = [];
      for (const entry of state.runtime.stickyWildEntries) {
        if (entry.turns > 0 && entry.r < state.gridRows && entry.c < state.gridCols) {
          grid[entry.r][entry.c] = wildSymbol;
          stillActive.push({ ...entry, turns: entry.turns - 1 });
        }
      }

      // Find NEW wilds from this spin (not already sticky)
      const stickySet = new Set(stillActive.map(e => `${e.r},${e.c}`));
      for (let r = 0; r < state.gridRows; r++) {
        for (let c = 0; c < state.gridCols; c++) {
          if (grid[r][c].isWild && !stickySet.has(`${r},${c}`)) {
            stillActive.push({ r, c, turns: powerup.value });
          }
        }
      }

      // Remove expired entries (turns <= 0)
      state.runtime.stickyWildEntries = stillActive.filter(e => e.turns > 0);
    },
  },
};

registry.register(def);
export default def;
