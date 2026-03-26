import type { SymbolDef } from '../core/SymbolTable';
import type { WinResult } from '../core/PaylineEvaluator';
import type { SymbolWeightOverride } from '../core/SlotEngine';
import type { Rarity } from '../state/PowerupDefs';

/** Shared runtime state for powerups that need cross-spin tracking */
export interface PowerupRuntimeState {
  consecutiveWins: number;
  stickyWildPositions: [number, number][];
  stickyWildTurnsLeft: number;
  stickyWildEntries: { r: number; c: number; turns: number }[];
  safetyNetUsed: boolean;
  secondChanceUsedThisLevel: number;
  cascadesRemaining: number;
  /** Set to true by Second Chance hook when a free re-spin should trigger */
  secondChanceTriggered: boolean;
  /** Current effective max bet (updated by GameScene before each spin) */
  effectiveMaxBet: number;
}

export function createRuntimeState(): PowerupRuntimeState {
  return {
    consecutiveWins: 0,
    stickyWildPositions: [],
    stickyWildTurnsLeft: 0,
    stickyWildEntries: [],
    safetyNetUsed: false,
    secondChanceUsedThisLevel: 0,
    cascadesRemaining: 0,
    secondChanceTriggered: false,
    effectiveMaxBet: 25,
  };
}

/** Hook functions a powerup can implement. All are optional. */
export interface PowerupHooks {
  /** Before spin: modify state (e.g., tracking) */
  onBeforeSpin?: (state: RunStateRef, powerup: PowerupInstance, bet: number) => void;

  /** After grid generated: mutate grid (e.g., symbol transform, sticky wilds) */
  onGridGenerated?: (state: RunStateRef, powerup: PowerupInstance, grid: SymbolDef[][]) => void;

  /** After wins evaluated: modify win results (e.g., diagonal bonus) */
  onWinEvaluated?: (state: RunStateRef, powerup: PowerupInstance, wins: WinResult[], bet: number) => void;

  /** After spin completes: modify total win (e.g., insurance, compound interest). Return adjusted totalWin. */
  onAfterSpin?: (state: RunStateRef, powerup: PowerupInstance, totalWin: number, bet: number) => number;

  /** On level start: setup (e.g., extra spins, reset counters) */
  onLevelStart?: (state: RunStateRef, powerup: PowerupInstance) => void;

  /** Return additional symbol weight overrides */
  getWeightModifiers?: (state: RunStateRef, powerup: PowerupInstance) => SymbolWeightOverride[];

  /** Return payout bonus for a symbol */
  getPayoutModifier?: (state: RunStateRef, powerup: PowerupInstance, symbolId: string) => number;

  /** Return max bet override (highest value wins) */
  getMaxBet?: (state: RunStateRef, powerup: PowerupInstance) => number | null;
}

/** Minimal state reference passed to hooks (avoids circular imports) */
export interface RunStateRef {
  bankroll: number;
  currentBet: number;
  level: number;
  target: number;
  levelEarnings: number;
  spinsRemaining: number;
  spinsTotal: number;
  gridRows: number;
  gridCols: number;
  freeSpinsRemaining: number;
  maxPowerupSlots: number;
  runtime: PowerupRuntimeState;
}

/** A powerup instance held by the player */
export interface PowerupInstance {
  id: string;
  type: string;
  name: string;
  description: string;
  color: number;
  targetRarity?: Rarity;
  value: number;
  consumable: boolean;
  level: number;
}

/** Definition of a powerup type — registered once in the registry */
export interface PowerupDef {
  type: string;
  name: string;
  description: string;
  color: number;
  consumable: boolean;
  category: 'instant' | 'passive';

  /** Create a powerup instance */
  create: (level: number, gameLevel: number, targetRarity?: Rarity) => PowerupInstance;

  /** Merge incoming into existing (mutate existing) */
  merge?: (existing: PowerupInstance, incoming: PowerupInstance) => void;

  /** Should this powerup appear in the offer pool? */
  isAvailable?: (state: RunStateRef) => boolean;

  /** Hook implementations */
  hooks: Partial<PowerupHooks>;
}
