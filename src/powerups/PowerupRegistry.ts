import type { SymbolDef } from '../core/SymbolTable';
import type { WinResult } from '../core/PaylineEvaluator';
import type { SymbolWeightOverride } from '../core/SlotEngine';
import type { PowerupDef, PowerupInstance, RunStateRef } from './types';

class PowerupRegistry {
  private defs: Map<string, PowerupDef> = new Map();

  /** Register a powerup definition */
  register(def: PowerupDef): void {
    this.defs.set(def.type, def);
  }

  /** Get a definition by type */
  getDef(type: string): PowerupDef | undefined {
    return this.defs.get(type);
  }

  /** Get all registered definitions */
  getAll(): PowerupDef[] {
    return Array.from(this.defs.values());
  }

  /** Get available powerups for the current state */
  getAvailable(state: RunStateRef): PowerupDef[] {
    return this.getAll().filter(def => {
      if (def.isAvailable) return def.isAvailable(state);
      return true;
    });
  }

  static readonly MAX_POWERUP_LEVEL = 3;

  /** Check if two powerup instances can merge */
  canMerge(a: PowerupInstance, b: PowerupInstance): boolean {
    if (a.type !== b.type) return false;
    if (a.targetRarity && a.targetRarity !== b.targetRarity) return false;
    if (a.level >= PowerupRegistry.MAX_POWERUP_LEVEL) return false;
    return true;
  }

  /** Merge incoming into existing */
  merge(existing: PowerupInstance, incoming: PowerupInstance): void {
    if (existing.level >= PowerupRegistry.MAX_POWERUP_LEVEL) return;
    const def = this.defs.get(existing.type);
    if (def?.merge) {
      def.merge(existing, incoming);
    } else {
      // Default merge: increment level and add values
      existing.level += 1;
      existing.value += incoming.value;
      existing.description = `${existing.name} Lv.${existing.level}`;
    }
    // Cap level to max
    existing.level = Math.min(existing.level, PowerupRegistry.MAX_POWERUP_LEVEL);
  }

  // ─── Hook runners ───
  // Each iterates active powerups and calls the matching hook

  runBeforeSpin(state: RunStateRef, powerups: PowerupInstance[], bet: number): void {
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      def?.hooks.onBeforeSpin?.(state, p, bet);
    }
  }

  runGridGenerated(state: RunStateRef, powerups: PowerupInstance[], grid: SymbolDef[][]): void {
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      def?.hooks.onGridGenerated?.(state, p, grid);
    }
  }

  runWinEvaluated(state: RunStateRef, powerups: PowerupInstance[], wins: WinResult[], bet: number): void {
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      def?.hooks.onWinEvaluated?.(state, p, wins, bet);
    }
  }

  runAfterSpin(state: RunStateRef, powerups: PowerupInstance[], totalWin: number, bet: number): number {
    let win = totalWin;
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      if (def?.hooks.onAfterSpin) {
        win = def.hooks.onAfterSpin(state, p, win, bet);
      }
    }
    return win;
  }

  runLevelStart(state: RunStateRef, powerups: PowerupInstance[]): void {
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      def?.hooks.onLevelStart?.(state, p);
    }
  }

  collectWeightModifiers(state: RunStateRef, powerups: PowerupInstance[]): SymbolWeightOverride[] {
    const overrides: SymbolWeightOverride[] = [];
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      if (def?.hooks.getWeightModifiers) {
        overrides.push(...def.hooks.getWeightModifiers(state, p));
      }
    }
    return overrides;
  }

  collectPayoutModifier(state: RunStateRef, powerups: PowerupInstance[], symbolId: string): number {
    let bonus = 0;
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      if (def?.hooks.getPayoutModifier) {
        bonus += def.hooks.getPayoutModifier(state, p, symbolId);
      }
    }
    return bonus;
  }

  collectMaxBet(state: RunStateRef, powerups: PowerupInstance[]): number {
    let maxBet = 25; // default
    for (const p of powerups) {
      const def = this.defs.get(p.type);
      if (def?.hooks.getMaxBet) {
        const override = def.hooks.getMaxBet(state, p);
        if (override !== null && override > maxBet) {
          maxBet = override;
        }
      }
    }
    return maxBet;
  }
}

/** Singleton registry */
export const registry = new PowerupRegistry();
