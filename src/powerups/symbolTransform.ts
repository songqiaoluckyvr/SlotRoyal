import { registry } from './PowerupRegistry';
import { SYMBOLS } from '../core/SymbolTable';
import type { PowerupDef } from './types';

const wildSymbol = SYMBOLS.find(s => s.isWild)!;

const def: PowerupDef = {
  type: 'symbol_transform',
  name: 'Symbol Transform',
  description: 'Random symbols become wild after spin',
  color: 0xaa88ff,
  consumable: false,
  category: 'passive',
  tier: 'rainbow',

  create: () => ({
    id: `symbol_transform_${Date.now()}`,
    type: 'symbol_transform',
    name: 'Symbol Transform',
    description: '1 random symbol → wild per spin',
    color: 0xaa88ff,
    value: 1, // number of transforms
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 1;
    existing.description = `${existing.value} symbols → wild per spin`;
  },

  hooks: {
    onGridGenerated: (state, powerup, grid) => {
      // Collect all non-wild positions
      const nonWildPositions: [number, number][] = [];
      for (let r = 0; r < state.gridRows; r++) {
        for (let c = 0; c < state.gridCols; c++) {
          if (!grid[r][c].isWild) {
            nonWildPositions.push([r, c]);
          }
        }
      }

      // Transform random positions to wild
      const count = Math.min(powerup.value, nonWildPositions.length);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * nonWildPositions.length);
        const [r, c] = nonWildPositions.splice(idx, 1)[0];
        grid[r][c] = wildSymbol;
      }
    },
  },
};

registry.register(def);
export default def;
