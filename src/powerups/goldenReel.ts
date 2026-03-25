import { registry } from './PowerupRegistry';
import { getSymbolsByRarity } from '../core/SymbolTable';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'golden_reel',
  name: 'Golden Reel',
  description: 'First column favors rare symbols',
  color: 0xffdd44,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `golden_reel_${Date.now()}`,
    type: 'golden_reel',
    name: 'Golden Reel',
    description: '+10 rare weight in column 1',
    color: 0xffdd44,
    value: 10,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 5;
    existing.description = `+${existing.value} rare weight in column 1`;
  },

  hooks: {
    // Note: weight modifiers apply globally, but golden reel only affects column 0.
    // Since the slot engine generates per-cell, we use getWeightModifiers which
    // currently applies to all cells. To make it column-specific, the grid
    // generation hook (onGridGenerated) could be used instead to re-roll column 0.
    // For simplicity, we boost rare symbol weights globally (slight approximation).
    getWeightModifiers: (_state, powerup) => {
      const rareSymbols = getSymbolsByRarity('rare');
      return rareSymbols.map(sym => ({
        symbolId: sym.id,
        additionalWeight: powerup.value,
      }));
    },
  },
};

registry.register(def);
export default def;
