import { registry } from './PowerupRegistry';
import { getSymbolById, getSymbolRarity } from '../core/SymbolTable';
import { RARITY_LABELS } from '../state/PowerupDefs';
import type { PowerupDef } from './types';
import type { Rarity } from '../state/PowerupDefs';

function createDef(): PowerupDef {
  return {
    type: 'symbol_value_up',
    name: 'Rarity Value Up',
    description: 'Boosts payout for a rarity tier',
    color: 0xffcc00,
    consumable: false,
    category: 'passive',

    create: (_level, _gameLevel, targetRarity?: Rarity) => {
      const label = targetRarity ? RARITY_LABELS[targetRarity] : '?';
      return {
        id: `symbol_value_up_${targetRarity}_${Date.now()}`,
        type: 'symbol_value_up',
        name: `${label} Value Up`,
        description: `+2x payout for ${label} symbols`,
        color: 0xffcc00,
        targetRarity,
        value: 2,
        consumable: false,
        level: 1,
      };
    },

    merge: (existing, incoming) => {
      existing.level += 1;
      existing.value += incoming.value;
      existing.description = `${existing.name} Lv.${existing.level}`;
    },

    hooks: {
      getPayoutModifier: (_state, powerup, symbolId) => {
        const sym = getSymbolById(symbolId);
        const rarity = getSymbolRarity(sym);
        if (rarity === powerup.targetRarity) {
          return powerup.value;
        }
        return 0;
      },
    },
  };
}

const def = createDef();
registry.register(def);
export default def;
