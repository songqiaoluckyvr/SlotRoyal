import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'compound_interest',
  name: 'Compound Interest',
  description: 'Earn 1% of bankroll each spin',
  color: 0x44dd88,
  consumable: false,
  category: 'passive',
  tier: 'gold',

  create: () => ({
    id: `compound_interest_${Date.now()}`,
    type: 'compound_interest',
    name: 'Compound Interest',
    description: '1% bankroll bonus per spin',
    color: 0x44dd88,
    value: 1, // percentage
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value = Math.min(5, existing.value + 0.5); // cap at 5%
    existing.description = `${existing.value}% bankroll bonus per spin`;
  },

  hooks: {
    onAfterSpin: (state, powerup, totalWin, _bet) => {
      const bonus = Math.max(1, Math.floor(state.bankroll * powerup.value / 100));
      state.bankroll += bonus;
      state.levelEarnings += bonus;
      return totalWin + bonus;
    },
  },
};

registry.register(def);
export default def;
