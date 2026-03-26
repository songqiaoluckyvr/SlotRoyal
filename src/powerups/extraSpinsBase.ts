import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'extra_spins_base',
  name: 'Extra Spins',
  description: '+5 spins per level',
  color: 0x88cc44,
  consumable: false,
  category: 'passive',
  tier: 'bronze',

  create: () => ({
    id: `extra_spins_base_${Date.now()}`,
    type: 'extra_spins_base',
    name: 'Extra Spins',
    description: '+5 spins per level',
    color: 0x88cc44,
    value: 5,
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 3;
    existing.description = `+${existing.value} spins per level`;
  },

  hooks: {
    onLevelStart: (state, powerup) => {
      state.spinsRemaining += powerup.value;
      state.spinsTotal += powerup.value;
    },
  },
};

registry.register(def);
export default def;
