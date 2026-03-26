import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'extra_column',
  name: 'Extra Column',
  description: '+1 column (longer matches)',
  color: 0x44aaff,
  consumable: false,
  category: 'passive',
  tier: 'rainbow',

  create: () => ({
    id: `extra_column_${Date.now()}`,
    type: 'extra_column',
    name: 'Extra Column',
    description: '+1 column (longer matches)',
    color: 0x44aaff,
    value: 1,
    consumable: false,
    level: 1,
  }),

  isAvailable: (state) => state.gridCols < 6,

  hooks: {},
};

registry.register(def);
export default def;
