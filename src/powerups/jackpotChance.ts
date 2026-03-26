import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'jackpot_chance',
  name: 'Jackpot Chance',
  description: '5% chance to multiply win by 5x',
  color: 0xff44ff,
  consumable: false,
  category: 'passive',
  tier: 'gold',

  create: () => ({
    id: `jackpot_chance_${Date.now()}`,
    type: 'jackpot_chance',
    name: 'Jackpot Chance',
    description: '5% chance for 5x win',
    color: 0xff44ff,
    value: 5, // chance percentage
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value = Math.min(25, existing.value + 2); // cap at 25%
    existing.description = `${existing.value}% chance for ${3 + existing.level * 2}x win`;
  },

  hooks: {
    onAfterSpin: (_state, powerup, totalWin, _bet) => {
      if (totalWin > 0 && Math.random() * 100 < powerup.value) {
        const multiplier = 3 + powerup.level * 2; // 5x at lv1, 7x at lv2, etc.
        return Math.round(totalWin * multiplier);
      }
      return totalWin;
    },
  },
};

registry.register(def);
export default def;
