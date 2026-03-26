import { registry } from './PowerupRegistry';
import type { PowerupDef } from './types';

const def: PowerupDef = {
  type: 'diagonal_master',
  name: 'Diagonal Master',
  description: 'Non-horizontal payline wins get 1.5x',
  color: 0x88aaff,
  consumable: false,
  category: 'passive',
  tier: 'bronze',

  create: () => ({
    id: `diagonal_master_${Date.now()}`,
    type: 'diagonal_master',
    name: 'Diagonal Master',
    description: '1.5x on diagonal/zigzag wins',
    color: 0x88aaff,
    value: 150, // 150 = 1.5x (stored as percentage to avoid float)
    consumable: false,
    level: 1,
  }),

  merge: (existing, _incoming) => {
    existing.level += 1;
    existing.value += 50; // +0.5x per level
    existing.description = `${existing.value / 100}x on diagonal/zigzag wins`;
  },

  hooks: {
    onWinEvaluated: (_state, powerup, wins, _bet) => {
      for (const win of wins) {
        // Check if payline is non-horizontal (not all same row)
        const rows = win.winPositions.map(([r]) => r);
        const isHorizontal = rows.every(r => r === rows[0]);
        if (!isHorizontal) {
          const multiplier = powerup.value / 100;
          win.winAmount = Math.round(win.winAmount * multiplier);
        }
      }
    },
  },
};

registry.register(def);
export default def;
