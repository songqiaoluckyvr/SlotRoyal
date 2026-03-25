import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'red_pocket',
  name: 'Red Pocket',
  description: 'Instant cash reward',
  color: 0xff2222,
  consumable: true,
  category: 'instant',

  create: (_level, gameLevel) => ({
    id: `red_pocket_${Date.now()}`,
    type: 'red_pocket',
    name: 'Red Pocket',
    description: `$${10 * gameLevel}–$${50 * gameLevel} cash`,
    color: 0xff2222,
    value: 0,
    consumable: true,
    level: 1,
  }),

  hooks: {},
};

registry.register(def);
export default def;
