import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const MAX_EXTRA_SLOTS = 3;

const def: PowerupDef = {
  type: 'extra_slot',
  name: 'Extra Slot',
  description: 'Hold one more powerup',
  color: 0xcc66ff,
  consumable: true,
  category: 'instant',

  create: () => ({
    id: `extra_slot_${Date.now()}`,
    type: 'extra_slot',
    name: 'Extra Slot',
    description: '+1 powerup slot (applied instantly)',
    color: 0xcc66ff,
    value: 1,
    consumable: true,
    level: 1,
  }),

  isAvailable: (state) => {
    return state.maxPowerupSlots < 3 + MAX_EXTRA_SLOTS;
  },

  hooks: {},
};

registry.register(def);
export default def;
