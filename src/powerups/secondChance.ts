import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'second_chance',
  name: 'Second Chance',
  description: 'Auto re-spin on a losing spin',
  color: 0xffcc44,
  consumable: false,
  category: 'passive',

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
    onBeforeSpin: (state, _powerup, _bet) => {
      // Clear trigger flag before each spin
      state.runtime.secondChanceTriggered = false;
    },

    onAfterSpin: (state, powerup, totalWin, bet) => {
      // Only trigger once per spin on a loss, if charges remain
      if (totalWin === 0 && !state.runtime.secondChanceTriggered && powerup.value > 0) {
        powerup.value--;
        state.runtime.secondChanceTriggered = true;
        // Refund both the spin count and the bet
        state.spinsRemaining++;
        state.bankroll += bet;
        // Update description
        powerup.description = `${powerup.value} re-spins remaining`;
      }
      return totalWin;
    },

    onLevelStart: (state, _powerup) => {
      state.runtime.secondChanceUsedThisLevel = 0;
    },
  },
};

registry.register(def);
export default def;
