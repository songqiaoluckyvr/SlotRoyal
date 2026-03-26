import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'safety_net',
  name: 'Safety Net',
  description: 'One-time bailout when bankroll is low',
  color: 0x44ff88,
  consumable: false,
  category: 'passive',
  tier: 'bronze',

  create: () => ({
    id: `safety_net_${Date.now()}`,
    type: 'safety_net',
    name: 'Safety Net',
    description: '$50 bailout when bankroll < $10',
    color: 0x44ff88,
    value: 50,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 25;
    existing.description = `$${existing.value} bailout when bankroll < $10`;
  },

  hooks: {
    onAfterSpin: (state, powerup, totalWin, _bet) => {
      if (!state.runtime.safetyNetUsed && state.bankroll < 10) {
        state.runtime.safetyNetUsed = true;
        state.bankroll += powerup.value;
        state.levelEarnings += powerup.value;
        return totalWin + powerup.value;
      }
      return totalWin;
    },

    onLevelStart: (state, _powerup) => {
      // Reset safety net each level
      state.runtime.safetyNetUsed = false;
    },
  },
};

registry.register(def);
export default def;
