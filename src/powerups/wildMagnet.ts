import { registry } from './PowerupRegistry';
import { SYMBOLS } from '../core/SymbolTable';
import type { PowerupDef } from './types';

const wildSymbol = SYMBOLS.find(s => s.isWild)!;

const def: PowerupDef = {
  type: 'wild_magnet',
  name: 'Wild Magnet',
  description: 'Wilds appear more often',
  color: 0xffffff,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `wild_magnet_${Date.now()}`,
    type: 'wild_magnet',
    name: 'Wild Magnet',
    description: 'Wild weight +3',
    color: 0xffffff,
    value: 3,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 2;
    existing.description = `Wild weight +${existing.value}`;
  },

  hooks: {
    getWeightModifiers: (_state, powerup) => [{
      symbolId: wildSymbol.id,
      additionalWeight: powerup.value,
    }],
  },
};

registry.register(def);
export default def;
