import Phaser from 'phaser';
import { spin } from '../core/SlotEngine';
import { evaluatePaylines, generatePaylines } from '../core/PaylineEvaluator';
import {
  createInitialState,
  placeBet,
  addWinnings,
  setBet,
  advanceLevel,
  canSpin,
  isLevelCleared,
  isRunOver,
  checkPowerupThreshold,
  getWeightOverrides,
  getPayoutBonus,
  recalcGridSize,
  type RunState,
} from '../state/RunState';
import { createPowerup, type Powerup, type PowerupType } from '../state/PowerupDefs';
import { SYMBOLS } from '../core/SymbolTable';
import { SlotGrid } from '../ui/SlotGrid';
import { HUD } from '../ui/HUD';
import { PowerupSlots } from '../ui/PowerupSlots';
import { rng } from '../utils/Rng';
import { Starfield } from '../ui/Starfield';

type GamePhase = 'idle' | 'spinning' | 'powerup';

export class GameScene extends Phaser.Scene {
  private state!: RunState;
  private grid!: SlotGrid;
  private hud!: HUD;
  private powerupSlots!: PowerupSlots;
  private phase: GamePhase = 'idle';
  private warnBorder?: Phaser.GameObjects.Rectangle;
  private starfield!: Starfield;

  constructor() {
    super('Game');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.state = createInitialState();
    this.phase = 'idle';

    this.starfield = new Starfield(this);

    this.grid = new SlotGrid(this);
    this.grid.build(this.state.gridRows, this.state.gridCols, 450, 340);

    this.hud = new HUD(this);
    this.powerupSlots = new PowerupSlots(this, 15, 120);
    this.refreshUI();

    // Wire buttons
    this.hud.spinBtn.on('pointerdown', () => this.onSpin());
    this.hud.onBetChange = (bet: number) => {
      setBet(this.state, bet);
      this.refreshUI();
      this.hud.setSpinEnabled(canSpin(this.state));
    };
    this.hud.skipBtn.on('pointerdown', () => this.onSkipLevel());
  }

  update(_time: number, delta: number): void {
    this.starfield.update(delta);
  }

  private refreshUI(): void {
    this.hud.update(this.state);
    this.powerupSlots.update(this.state.activePowerups);
  }

  private onSpin(): void {
    if (this.phase !== 'idle') return;
    if (!canSpin(this.state)) return;

    this.phase = 'spinning';
    this.hud.setSpinEnabled(false);

    const bet = placeBet(this.state);
    this.refreshUI();

    // Generate result
    const overrides = getWeightOverrides(this.state);
    const result = spin(this.state.gridRows, this.state.gridCols, overrides);

    // Display result (instant for MVP — animation in Phase 2)
    this.grid.setGrid(result);

    // Evaluate paylines
    const paylines = generatePaylines(this.state.gridRows, this.state.gridCols);
    const wins = evaluatePaylines(result, paylines, bet > 0 ? bet : this.state.currentBet);

    // Apply payout bonuses from powerups
    let totalWin = 0;
    for (const win of wins) {
      const bonus = getPayoutBonus(this.state, win.symbol.id);
      const boostedAmount = win.winAmount + (bonus * bet);
      totalWin += boostedAmount;
      this.grid.highlightWin(win.winPositions);
    }

    if (totalWin > 0) {
      addWinnings(this.state, totalWin);
      this.hud.showWin(totalWin);
    }

    this.refreshUI();

    // Red border warning when spins are low
    const totalSpins = this.state.spinsRemaining + this.state.freeSpinsRemaining;
    if (totalSpins <= 5 && totalSpins > 0) {
      if (!this.warnBorder) {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        this.warnBorder = this.add.rectangle(W / 2, H / 2, W, H)
          .setStrokeStyle(4, 0xff3333).setFillStyle(0x000000, 0).setDepth(100);
      }
      this.warnBorder.setVisible(true).setAlpha(1);
      this.tweens.add({
        targets: this.warnBorder,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
      });
    }

    // Check game state after a short delay
    this.time.delayedCall(wins.length > 0 ? 800 : 200, () => {
      this.afterSpin();
    });
  }

  private afterSpin(): void {
    // Check run over
    if (isRunOver(this.state)) {
      this.state.runActive = false;
      this.time.delayedCall(500, () => {
        this.scene.start('GameOver', {
          level: this.state.level,
          bankroll: this.state.bankroll,
        });
      });
      return;
    }

    // Check for powerup threshold
    const threshold = checkPowerupThreshold(this.state);
    if (threshold !== null) {
      this.offerPowerup();
      return;
    }

    // Check if out of spins but target reached (auto-advance prompt)
    if (this.state.spinsRemaining <= 0 && this.state.freeSpinsRemaining <= 0 && isLevelCleared(this.state)) {
      this.onSkipLevel();
      return;
    }

    this.phase = 'idle';
    this.hud.setSpinEnabled(canSpin(this.state));
  }

  private onSkipLevel(): void {
    advanceLevel(this.state);
    recalcGridSize(this.state);
    this.grid.build(this.state.gridRows, this.state.gridCols, 450, 340);
    this.grid.reset();
    this.refreshUI();
    this.phase = 'idle';
    this.hud.setSpinEnabled(canSpin(this.state));
  }

  private offerPowerup(onComplete?: () => void): void {
    this.phase = 'powerup';
    const options = this.generatePowerupOptions(3);

    this.scene.launch('Powerup', {
      options,
      state: this.state,
      onComplete: () => {
        recalcGridSize(this.state);
        // Rebuild grid if size changed
        this.grid.build(this.state.gridRows, this.state.gridCols, 450, 340);
        this.refreshUI();

        // Consume free_spins powerup: add to freeSpinsRemaining
        this.applyConsumablePowerups();

        if (onComplete) {
          onComplete();
        } else {
          // Delay to let PowerupScene fully close before re-checking
          this.time.delayedCall(100, () => this.afterSpin());
        }
      },
    });
  }

  private applyConsumablePowerups(): void {
    const toRemove: number[] = [];
    for (let i = 0; i < this.state.activePowerups.length; i++) {
      const p = this.state.activePowerups[i];
      if (p.type === 'free_spins') {
        this.state.freeSpinsRemaining += p.value;
        toRemove.push(i);
      }
      if (p.type === 'red_pocket') {
        const reward = rng.int(10, 50) * this.state.level;
        addWinnings(this.state, reward);
        this.hud.showWin(reward);
        toRemove.push(i);
      }
    }
    // Remove consumed powerups (reverse order to preserve indices)
    for (const i of toRemove.reverse()) {
      this.state.activePowerups.splice(i, 1);
    }
  }

  private generatePowerupOptions(count: number): Powerup[] {
    const types: PowerupType[] = [
      'free_spins', 'extra_row', 'extra_column',
      'symbol_value_up', 'symbol_chance_up', 'red_pocket',
    ];
    const options: Powerup[] = [];
    const usedTypes = new Set<string>();

    while (options.length < count) {
      const type = rng.pick(types);
      const key = type;

      // Avoid duplicate types in same offer
      if (usedTypes.has(key) && options.length < types.length) continue;
      usedTypes.add(key);

      let targetSymbol: string | undefined;
      if (type === 'symbol_value_up' || type === 'symbol_chance_up') {
        const nonWild = SYMBOLS.filter(s => !s.isWild);
        targetSymbol = rng.pick(nonWild).id;
      }

      const p = createPowerup(type, targetSymbol);

      // Scale values with level
      if (type === 'free_spins') {
        p.value = 3 + this.state.level;
        p.description = `+${p.value} free spins`;
      }
      if (type === 'red_pocket') {
        p.description = `$${10 * this.state.level}–$${50 * this.state.level} cash`;
      }
      if (targetSymbol) {
        const sym = SYMBOLS.find(s => s.id === targetSymbol);
        p.description = `${p.description} (${sym?.name})`;
      }

      options.push(p);
    }

    return options;
  }
}
