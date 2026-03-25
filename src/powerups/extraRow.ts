import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'extra_row',
  name: 'Extra Row',
  description: '+1 row (more paylines)',
  color: 0xff8844,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `extra_row_${Date.now()}`,
    type: 'extra_row',
    name: 'Extra Row',
    description: '+1 row (more paylines)',
    color: 0xff8844,
    value: 1,
    consumable: false,
    level: 1,
  }),

  isAvailable: (state) => state.gridRows < 6,

  hooks: {},
};

registry.register(def);
export default def;
