import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

// Note: Cascade requires special handling in GameScene since it triggers
// a re-spin loop. The hook sets cascadesRemaining, and GameScene checks it.

const def: PowerupDef = {
  type: 'cascade',
  name: 'Cascade',
  description: 'Wins trigger cascading re-rolls',
  color: 0x44ccff,
  consumable: false,
  category: 'passive',
  tier: 'gold',

  create: () => ({
    id: `cascade_${Date.now()}`,
    type: 'cascade',
    name: 'Cascade',
    description: '1 cascade per winning spin',
    color: 0x44ccff,
    value: 1, // max cascades per spin
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 1;
    existing.description = `${existing.value} cascades per winning spin`;
  },

  hooks: {
    onBeforeSpin: (state, powerup, _bet) => {
      // Reset cascade counter at start of each spin
      state.runtime.cascadesRemaining = powerup.value;
    },
  },
};

registry.register(def);
export default def;
