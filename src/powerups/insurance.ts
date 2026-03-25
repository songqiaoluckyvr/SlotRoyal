import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const BASE_CHARGES = 5;
const MERGE_CHARGES = 5;

const def: PowerupDef = {
  type: 'insurance',
  name: 'Insurance',
  description: `Refund 50% of bet on losses (${BASE_CHARGES} charges)`,
  color: 0x44cc88,
  consumable: false,
  category: 'passive',

  create: () => ({
    id: `insurance_${Date.now()}`,
    type: 'insurance',
    name: 'Insurance',
    description: `Refund 50% of bet on losses (${BASE_CHARGES} charges)`,
    color: 0x44cc88,
    value: BASE_CHARGES, // charges remaining
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += MERGE_CHARGES;
    existing.description = `Refund 50% of bet on losses (${existing.value} charges)`;
  },

  hooks: {
    onAfterSpin: (state, powerup, totalWin, bet) => {
      if (totalWin === 0 && bet > 0 && powerup.value > 0) {
        powerup.value -= 1;
        powerup.level = powerup.value;
        const refund = Math.ceil(bet * 50 / 100);
        state.bankroll += refund;
        state.levelEarnings += refund;
        powerup.description = `Refund 50% of bet on losses (${powerup.value} charges)`;
        return refund;
      }
      return totalWin;
    },
  },
};

registry.register(def);
export default def;
