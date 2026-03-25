import Phaser from 'phaser';
import { spin, spinSingleCell } from '../core/SlotEngine';
import type { SymbolDef } from '../core/SymbolTable';
import { evaluatePaylines, generatePaylines, type WinResult } from '../core/PaylineEvaluator';
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
  recalcGridSize,
  type RunState,
} from '../state/RunState';
import { registry, type PowerupInstance } from '../powerups/index';
import type { Rarity } from '../state/PowerupDefs';
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

    // Info button
    const infoBtn = this.add.text(this.cameras.main.width - 20, 56, '[ ? ]', {
      fontSize: '18px', color: '#aaaaff', fontFamily: 'monospace',
      backgroundColor: '#222244', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);

    infoBtn.on('pointerover', () => infoBtn.setColor('#ffffff'));
    infoBtn.on('pointerout', () => infoBtn.setColor('#aaaaff'));
    infoBtn.on('pointerdown', () => this.openInfo());

    // Wire buttons
    this.hud.spinBtn.on('pointerdown', () => this.onSpin());
    this.hud.onBetChange = (bet: number) => {
      const maxBet = registry.collectMaxBet(this.state, this.state.activePowerups);
      setBet(this.state, bet, maxBet);
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
    const betAmount = bet > 0 ? bet : this.state.currentBet;
    this.refreshUI();
    this.grid.reset();

    // Update effective max bet for hooks to read
    this.state.runtime.effectiveMaxBet = registry.collectMaxBet(this.state, this.state.activePowerups);

    // Hook: before spin
    registry.runBeforeSpin(this.state, this.state.activePowerups, betAmount);

    // Generate result with weight modifiers from powerups
    const overrides = registry.collectWeightModifiers(this.state, this.state.activePowerups);
    const result = spin(this.state.gridRows, this.state.gridCols, overrides);

    // Capture sticky positions BEFORE grid hooks (new wilds from this spin should still animate)
    const preStickyEntries = (this.state.runtime.stickyWildEntries || []).filter(e => e.turns > 0);
    const stickySet = new Set<string>(preStickyEntries.map(e => `${e.r},${e.c}`));

    // Hook: grid generated (symbol transform, sticky wilds, etc.)
    registry.runGridGenerated(this.state, this.state.activePowerups, result);
    let spinCells: Set<string> | undefined;
    if (stickySet.size > 0) {
      spinCells = new Set<string>();
      for (let r = 0; r < this.state.gridRows; r++) {
        for (let c = 0; c < this.state.gridCols; c++) {
          if (!stickySet.has(`${r},${c}`)) {
            spinCells.add(`${r},${c}`);
          }
        }
      }
      // Pre-set sticky cells to wild immediately so they don't flicker
      this.grid.setPartialGrid(result, stickySet);
    }

    // Animate spin — exclude sticky wilds which are already shown
    const onSpinComplete = () => {
      const paylines = generatePaylines(this.state.gridRows, this.state.gridCols);
      const wins = evaluatePaylines(result, paylines, betAmount);

      // Hook: win evaluated (diagonal master, etc.)
      registry.runWinEvaluated(this.state, this.state.activePowerups, wins, betAmount);

      // Apply payout bonuses from powerups
      let totalWin = 0;
      for (const win of wins) {
        const bonus = registry.collectPayoutModifier(this.state, this.state.activePowerups, win.symbol.id);
        const boostedAmount = win.winAmount + (bonus * betAmount);
        totalWin += boostedAmount;
        this.grid.highlightWin(win.winPositions);
      }

      // Track consecutive wins for lucky streak
      if (totalWin > 0) {
        this.state.runtime.consecutiveWins++;
      } else {
        this.state.runtime.consecutiveWins = 0;
      }

      // Hook: after spin (insurance, compound interest, lucky streak, etc.)
      totalWin = registry.runAfterSpin(this.state, this.state.activePowerups, totalWin, betAmount);

      // Remove any spent powerups (value depleted to 0 or below)
      this.state.activePowerups = this.state.activePowerups.filter(p => p.value > 0);

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

      // Check for cascade: re-roll winning positions on a win
      if (totalWin > 0 && this.state.runtime.cascadesRemaining > 0) {
        this.doCascade(result, wins, betAmount);
        return;
      }

      // Check for second chance re-spin
      if (this.state.runtime.secondChanceTriggered) {
        this.state.runtime.secondChanceTriggered = false;
        this.time.delayedCall(300, () => {
          this.phase = 'idle';
          this.onSpin(); // trigger a free re-spin
        });
        return;
      }

      // Check game state after a short delay
      this.time.delayedCall(wins.length > 0 ? 800 : 200, () => {
        this.afterSpin();
      });
    };
    this.grid.spinAndReveal(result, onSpinComplete, spinCells);
  }

  /** Cascade: re-roll winning positions and evaluate again, recursively */
  private doCascade(grid: SymbolDef[][], prevWins: WinResult[], betAmount: number): void {
    this.state.runtime.cascadesRemaining--;

    const overrides = registry.collectWeightModifiers(this.state, this.state.activePowerups);
    const rerollCells = new Set<string>();
    for (const win of prevWins) {
      for (const [r, c] of win.winPositions) {
        rerollCells.add(`${r},${c}`);
      }
    }
    for (const key of rerollCells) {
      const [r, c] = key.split(',').map(Number);
      grid[r][c] = spinSingleCell(overrides);
    }

    this.time.delayedCall(600, () => {
      // Only animate the re-rolled cells
      this.grid.spinAndReveal(grid, () => {
        const paylines = generatePaylines(this.state.gridRows, this.state.gridCols);
        const wins = evaluatePaylines(grid, paylines, betAmount);
        registry.runWinEvaluated(this.state, this.state.activePowerups, wins, betAmount);

        let cascadeWin = 0;
        for (const win of wins) {
          const bonus = registry.collectPayoutModifier(this.state, this.state.activePowerups, win.symbol.id);
          cascadeWin += win.winAmount + (bonus * betAmount);
          this.grid.highlightWin(win.winPositions);
        }

        if (cascadeWin > 0) {
          addWinnings(this.state, cascadeWin);
          this.hud.showWin(cascadeWin);
          this.state.runtime.consecutiveWins++;
        }

        this.refreshUI();

        if (cascadeWin > 0 && this.state.runtime.cascadesRemaining > 0) {
          this.doCascade(grid, wins, betAmount);
        } else {
          this.time.delayedCall(wins.length > 0 ? 800 : 200, () => this.afterSpin());
        }
      }, rerollCells);
    });
  }

  private afterSpin(): void {
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

    const threshold = checkPowerupThreshold(this.state);
    if (threshold !== null) {
      this.offerPowerup();
      return;
    }

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

  private openInfo(): void {
    if (this.phase !== 'idle') return;
    this.phase = 'powerup';

    this.scene.launch('Info', {
      gridRows: this.state.gridRows,
      gridCols: this.state.gridCols,
      onClose: () => {
        this.phase = 'idle';
        this.hud.setSpinEnabled(canSpin(this.state));
      },
    });
  }

  private offerPowerup(onComplete?: () => void): void {
    if (this.phase === 'powerup') return;
    this.phase = 'powerup';
    const options = this.generatePowerupOptions(3);

    this.scene.launch('Powerup', {
      options,
      state: this.state,
      onComplete: () => {
        recalcGridSize(this.state);
        this.grid.build(this.state.gridRows, this.state.gridCols, 450, 340);
        this.refreshUI();

        if (onComplete) {
          onComplete();
        } else {
          this.phase = 'idle';
          this.time.delayedCall(200, () => this.afterSpin());
        }
      },
    });
  }

  private generatePowerupOptions(count: number): PowerupInstance[] {
    // Get available powerups from registry (filters out maxed ones)
    const available = registry.getAvailable(this.state);
    const options: PowerupInstance[] = [];
    const usedTypes = new Set<string>();

    while (options.length < count && usedTypes.size < available.length) {
      const def = rng.pick(available);

      // Avoid duplicate types in same offer
      if (usedTypes.has(def.type) && options.length < available.length) continue;
      usedTypes.add(def.type);

      // For rarity-based powerups, pick a random rarity
      let targetRarity: Rarity | undefined;
      if (def.type === 'symbol_value_up' || def.type === 'symbol_chance_up') {
        const rarities: Rarity[] = ['common', 'uncommon', 'rare'];
        targetRarity = rng.pick(rarities);
      }

      const p = def.create(1, this.state.level, targetRarity);
      options.push(p);
    }

    return options;
  }
}
