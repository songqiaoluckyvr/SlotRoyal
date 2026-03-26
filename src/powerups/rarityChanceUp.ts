import { registry } from './PowerupRegistry';
import { getSymbolsByRarity } from '../core/SymbolTable';
import { RARITY_LABELS } from '../state/PowerupDefs';
import type { PowerupDef } from './types';
import type { Rarity } from '../state/PowerupDefs';

function createDef(): PowerupDef {
  return {
    type: 'symbol_chance_up',
    name: 'Rarity Chance Up',
    description: 'Increases appearance rate for a rarity tier',
    color: 0xcc44ff,
    consumable: false,
    category: 'passive',
    tier: 'silver',

    create: (_level, _gameLevel, targetRarity?: Rarity) => {
      const label = targetRarity ? RARITY_LABELS[targetRarity] : '?';
      return {
        id: `symbol_chance_up_${targetRarity}_${Date.now()}`,
        type: 'symbol_chance_up',
        name: `${label} Chance Up`,
        description: `+5 weight for ${label} symbols`,
        color: 0xcc44ff,
        targetRarity,
        value: 5,
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
      getWeightModifiers: (_state, powerup) => {
        if (!powerup.targetRarity) return [];
        const symbols = getSymbolsByRarity(powerup.targetRarity);
        return symbols.map(sym => ({
          symbolId: sym.id,
          additionalWeight: powerup.value,
        }));
      },
    },
  };
}

const def = createDef();
registry.register(def);
export default def;
