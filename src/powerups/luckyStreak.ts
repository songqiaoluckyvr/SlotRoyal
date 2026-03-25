import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'lucky_streak',
  name: 'Lucky Streak',
  description: 'Consecutive wins multiply payouts',
  color: 0xff6600,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `lucky_streak_${Date.now()}`,
    type: 'lucky_streak',
    name: 'Lucky Streak',
    description: 'Consecutive wins multiply payouts',
    color: 0xff6600,
    value: 1, // base multiplier increment per streak
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 1;
    existing.description = `Streak multiplier +${existing.value}x per win`;
  },

  hooks: {
    onAfterSpin: (state, powerup, totalWin, _bet) => {
      if (totalWin > 0) {
        const streak = state.runtime.consecutiveWins; // already incremented by registry caller
        if (streak >= 2) {
          const multiplier = 1 + (streak - 1) * powerup.value;
          return Math.round(totalWin * multiplier);
        }
      }
      return totalWin;
    },
  },
};

registry.register(def);
export default def;
