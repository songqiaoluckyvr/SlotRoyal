// Import all powerups to register them with the registry.
// Each file self-registers via registry.register() on import.

// Existing
import './freeSpins';
import './redPocket';
import './extraRow';
import './extraColumn';
import './rarityValueUp';
import './rarityChanceUp';

// New — Win Multipliers
import './luckyStreak';
import './bigBetBonus';
import './jackpotChance';

// New — Symbol Manipulation
import './wildMagnet';
import './symbolTransform';
import './goldenReel';

// New — Grid & Payline
import './diagonalMaster';
import './stickyWilds';
import './cascade';

// New — Economy
import './insurance';
import './betMultiplier';
import './compoundInterest';

// New — Survival
import './extraSpinsBase';
import './safetyNet';
import './secondChance';

// New — Meta
import './extraSlot';

export { registry } from './PowerupRegistry';
export type { PowerupDef, PowerupInstance, PowerupHooks, RunStateRef, PowerupRuntimeState } from './types';
export { createRuntimeState } from './types';
