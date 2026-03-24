import { getLevelConfig } from '../core/LevelConfig';
import type { Powerup } from './PowerupDefs';
import type { SymbolWeightOverride } from '../core/SlotEngine';

export interface RunState {
  bankroll: number;
  currentBet: number;
  level: number;
  target: number;
  spinsRemaining: number;
  spinsTotal: number;
  gridRows: number;
  gridCols: number;
  activePowerups: Powerup[];
  freeSpinsRemaining: number;
  /** Tracks which % thresholds have triggered powerup offers (25, 50) */
  powerupThresholdsHit: number[];
  runActive: boolean;
}

export function createInitialState(): RunState {
  const config = getLevelConfig(1);
  return {
    bankroll: 100,
    currentBet: 1,
    level: 1,
    target: config.target,
    spinsRemaining: config.spins,
    spinsTotal: config.spins,
    gridRows: 3,
    gridCols: 3,
    activePowerups: [],
    freeSpinsRemaining: 0,
    powerupThresholdsHit: [],
    runActive: true,
  };
}

export function placeBet(state: RunState): number {
  if (state.freeSpinsRemaining > 0) {
    state.freeSpinsRemaining--;
    // Free spin doesn't cost money or use a regular spin
    return 0;
  }
  const bet = state.currentBet;
  state.bankroll -= bet;
  state.spinsRemaining--;
  return bet;
}

export function addWinnings(state: RunState, amount: number): void {
  state.bankroll += amount;
}

export function setBet(state: RunState, bet: number): void {
  state.currentBet = Math.max(1, Math.min(25, bet, state.bankroll));
}

export function advanceLevel(state: RunState): void {
  state.level++;
  const config = getLevelConfig(state.level);
  state.target = config.target;
  state.spinsRemaining = config.spins;
  state.spinsTotal = config.spins;
  state.powerupThresholdsHit = [];

  // Apply extra spins from free_spins powerups carried over
  // (free spins are consumed during use, not on level advance)
}

export function canSpin(state: RunState): boolean {
  if (!state.runActive) return false;
  if (state.freeSpinsRemaining > 0) return true;
  return state.spinsRemaining > 0 && state.bankroll >= state.currentBet;
}

export function isLevelCleared(state: RunState): boolean {
  return state.bankroll >= state.target;
}

export function isRunOver(state: RunState): boolean {
  if (state.bankroll <= 0) return true;
  if (state.spinsRemaining <= 0 && state.freeSpinsRemaining <= 0 && state.bankroll < state.target) return true;
  return false;
}

/** Check if a powerup threshold is newly crossed. Returns threshold % or null. */
export function checkPowerupThreshold(state: RunState): number | null {
  const progress = state.bankroll / state.target;
  const thresholds = [0.25, 0.50];

  for (const t of thresholds) {
    if (progress >= t && !state.powerupThresholdsHit.includes(t)) {
      state.powerupThresholdsHit.push(t);
      return t;
    }
  }
  return null;
}

/** Get symbol weight overrides from active powerups */
export function getWeightOverrides(state: RunState): SymbolWeightOverride[] {
  const overrides: SymbolWeightOverride[] = [];
  for (const p of state.activePowerups) {
    if (p.type === 'symbol_chance_up' && p.targetSymbolId) {
      overrides.push({ symbolId: p.targetSymbolId, additionalWeight: p.value });
    }
  }
  return overrides;
}

/** Get payout multiplier bonus for a symbol from active powerups */
export function getPayoutBonus(state: RunState, symbolId: string): number {
  let bonus = 0;
  for (const p of state.activePowerups) {
    if (p.type === 'symbol_value_up' && p.targetSymbolId === symbolId) {
      bonus += p.value;
    }
  }
  return bonus;
}

/** Recalculate grid size from base + powerups */
export function recalcGridSize(state: RunState): void {
  let rows = 3;
  let cols = 3;
  for (const p of state.activePowerups) {
    if (p.type === 'extra_row') rows += p.value;
    if (p.type === 'extra_column') cols += p.value;
  }
  state.gridRows = Math.min(rows, 6); // cap at 6
  state.gridCols = Math.min(cols, 6);
}
