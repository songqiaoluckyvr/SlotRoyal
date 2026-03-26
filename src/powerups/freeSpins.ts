import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'free_spins',
  name: 'Free Spins',
  description: 'Grants extra free spins',
  color: 0x44ff44,
  consumable: true,
  category: 'instant',
  tier: 'bronze',

  create: (_level, gameLevel) => ({
    id: `free_spins_${Date.now()}`,
    type: 'free_spins',
    name: 'Free Spins',
    description: `+${3 + gameLevel} free spins`,
    color: 0x44ff44,
    value: 3 + gameLevel,
    consumable: true,
    level: 1,
  }),

  hooks: {},
};

registry.register(def);
export default def;
