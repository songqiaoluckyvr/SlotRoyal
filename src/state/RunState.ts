import { getLevelConfig } from '../core/LevelConfig';
import type { PowerupInstance, RunStateRef } from '../powerups/types';
import { createRuntimeState } from '../powerups/types';
import { registry } from '../powerups/PowerupRegistry';

export interface RunState extends RunStateRef {
  activePowerups: PowerupInstance[];
  /** Tracks which % thresholds have triggered powerup offers */
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
    levelEarnings: 0,
    spinsRemaining: config.spins,
    spinsTotal: config.spins,
    gridRows: 3,
    gridCols: 3,
    activePowerups: [],
    freeSpinsRemaining: 0,
    maxPowerupSlots: 3,
    powerupThresholdsHit: [],
    runActive: true,
    runtime: createRuntimeState(),
  };
}

export function placeBet(state: RunState): number {
  if (state.freeSpinsRemaining > 0) {
    state.freeSpinsRemaining--;
    return 0;
  }
  const bet = state.currentBet;
  state.bankroll -= bet;
  state.spinsRemaining--;
  return bet;
}

export function addWinnings(state: RunState, amount: number): void {
  state.bankroll += amount;
  state.levelEarnings += amount;
}

export function setBet(state: RunState, bet: number, maxBet?: number): void {
  const max = maxBet ?? 25;
  state.currentBet = Math.max(1, Math.min(max, bet, state.bankroll));
}

export function advanceLevel(state: RunState): void {
  state.level++;
  const config = getLevelConfig(state.level);
  state.target = config.target;
  state.spinsRemaining = config.spins;
  state.spinsTotal = config.spins;
  state.levelEarnings = 0;
  state.powerupThresholdsHit = [];

  // Run onLevelStart hooks
  registry.runLevelStart(state, state.activePowerups);
}

export function canSpin(state: RunState): boolean {
  if (!state.runActive) return false;
  if (state.freeSpinsRemaining > 0) return true;
  return state.spinsRemaining > 0 && state.bankroll >= state.currentBet;
}

export function isLevelCleared(state: RunState): boolean {
  return state.levelEarnings >= state.target;
}

export function isRunOver(state: RunState): boolean {
  if (state.bankroll <= 0) return true;
  if (state.spinsRemaining <= 0 && state.freeSpinsRemaining <= 0 && state.levelEarnings < state.target) return true;
  return false;
}

export function checkPowerupThreshold(state: RunState): number | null {
  const progress = state.levelEarnings / state.target;
  const thresholds = [0.25, 0.50, 0.75, 1.0];

  for (const t of thresholds) {
    if (progress >= t - 0.001 && !state.powerupThresholdsHit.includes(t)) {
      state.powerupThresholdsHit.push(t);
      return t;
    }
  }
  return null;
}

/** Recalculate grid size from base + powerups */
export function recalcGridSize(state: RunState): void {
  let rows = 3;
  let cols = 3;
  for (const p of state.activePowerups) {
    if (p.type === 'extra_row') rows += p.value;
    if (p.type === 'extra_column') cols += p.value;
  }
  state.gridRows = Math.min(rows, 6);
  state.gridCols = Math.min(cols, 6);
}
