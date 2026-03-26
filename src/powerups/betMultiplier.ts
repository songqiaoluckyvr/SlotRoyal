import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'bet_multiplier',
  name: 'Bet Multiplier',
  description: 'Max bet increases to $50',
  color: 0xddaa22,
  consumable: false,
  category: 'passive',
  tier: 'silver',

  create: () => ({
    id: `bet_multiplier_${Date.now()}`,
    type: 'bet_multiplier',
    name: 'Bet Multiplier',
    description: 'Max bet $50',
    color: 0xddaa22,
    value: 50,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 25;
    existing.description = `Max bet $${existing.value}`;
  },

  hooks: {
    getMaxBet: (_state, powerup) => powerup.value,
  },
};

registry.register(def);
export default def;
