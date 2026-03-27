import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'second_chance',
  name: 'Second Chance',
  description: 'Auto re-spin on a losing spin',
  color: 0xffcc44,
  consumable: false,
  category: 'passive',
  tier: 'silver',

  create: () => ({
    id: `second_chance_${Date.now()}`,
    type: 'second_chance',
    name: 'Second Chance',
    description: '3 free re-spins on loss',
    color: 0xffcc44,
    value: 3, // uses per level
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 3;
    existing.description = `${existing.value} free re-spins on loss`;
  },

  hooks: {
    onAfterSpin: (state, powerup, totalWin, bet) => {
      // Only trigger on a loss, if charges remain and not already triggered
      if (totalWin === 0 && !state.runtime.secondChanceTriggered && powerup.value > 0) {
        powerup.value--;
        state.runtime.secondChanceTriggered = true;
        state.spinsRemaining++;
        state.bankroll += bet;
        powerup.description = `${powerup.value} re-spins remaining`;
      }
      return totalWin;
    },

    onLevelStart: (state, _powerup) => {
      state.runtime.secondChanceUsedThisLevel = 0;
      state.runtime.secondChanceTriggered = false;
    },
  },
};

registry.register(def);
export default def;
