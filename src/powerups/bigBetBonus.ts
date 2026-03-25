import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'big_bet_bonus',
  name: 'Big Bet Bonus',
  description: 'Extra payout when betting max',
  color: 0xeeaa00,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `big_bet_bonus_${Date.now()}`,
    type: 'big_bet_bonus',
    name: 'Big Bet Bonus',
    description: '+2x payout at max bet',
    color: 0xeeaa00,
    value: 2,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 1;
    existing.description = `+${existing.value}x payout at max bet`;
  },

  hooks: {
    getPayoutModifier: (state, powerup, _symbolId) => {
      if (state.currentBet >= state.runtime.effectiveMaxBet) {
        return powerup.value;
      }
      return 0;
    },
  },
};

registry.register(def);
export default def;
