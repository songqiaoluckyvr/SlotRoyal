import Phaser from 'phaser';
import type { RunState } from '../state/RunState';

export class HUD {
  private scene: Phaser.Scene;
  private bankrollText!: Phaser.GameObjects.Text;
  private spinsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private thresholdMarkers: { threshold: number; icon: Phaser.GameObjects.Text }[] = [];
  private winText!: Phaser.GameObjects.Text;
  private denomBtns: { btn: Phaser.GameObjects.Text; value: number }[] = [];
  private betText!: Phaser.GameObjects.Text;
  private selectedDenom = 1;
  private maxBetLabel!: Phaser.GameObjects.Text;
  private currentMaxBet = 25;

  spinBtn!: Phaser.GameObjects.Image;
  betUpBtn!: Phaser.GameObjects.Text;
  betDownBtn!: Phaser.GameObjects.Text;
  skipBtn!: Phaser.GameObjects.Text;
  onBetChange?: (bet: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const W = this.scene.cameras.main.width;

    // Top bar
    this.levelText = this.scene.add.text(20, 12, '', {
      fontSize: '18px', color: '#aaaaff', fontFamily: 'monospace',
    });
    this.targetText = this.scene.add.text(W - 20, 12, '', {
      fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // Progress bar (under top bar)
    const barLeft = 20;
    const barWidth = W - 40;
    this.scene.add.rectangle(W / 2, 42, barWidth, 10, 0x333333);
    this.progressBar = this.scene.add.rectangle(barLeft, 42, 0, 10, 0x44ff44).setOrigin(0, 0.5);

    // Threshold chest markers at 25%, 50%, 75%, 100%
    const thresholds = [0.25, 0.50, 0.75, 1.0];
    this.thresholdMarkers = [];
    for (const t of thresholds) {
      const x = barLeft + barWidth * t;
      const icon = this.scene.add.text(x, 42, '🎁', {
        fontSize: '18px',
      }).setOrigin(0.5).setDepth(5);
      this.thresholdMarkers.push({ threshold: t, icon });
    }

    // Bottom area
    const bottomY = 670;

    this.bankrollText = this.scene.add.text(20, bottomY, '', {
      fontSize: '22px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
    });

    this.spinsText = this.scene.add.text(20, bottomY + 30, '', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
    });

    // Bet denom selector - clicking sets the bet directly
    const betY = bottomY + 15;
    const betCenterX = W / 2;
    const denoms = [1, 5, 10, 25];
    const denomStartX = betCenterX - ((denoms.length - 1) * 60) / 2;

    this.betText = this.scene.add.text(betCenterX, betY - 28, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    for (let i = 0; i < denoms.length; i++) {
      const value = denoms[i];
      const btn = this.scene.add.text(denomStartX + i * 60, betY, `$${value}`, {
        fontSize: '18px', color: '#888888', fontFamily: 'monospace',
        backgroundColor: '#222244',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedDenom = value;
        this.updateDenomColors();
        if (this.onBetChange) this.onBetChange(value);
      });

      this.denomBtns.push({ btn, value });
    }
    this.updateDenomColors();

    this.maxBetLabel = this.scene.add.text(betCenterX, betY + 25, 'Min $1 · Max $25', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Spin button (right bottom)
    this.spinBtn = this.scene.add.image(W - 100, bottomY + 10, 'spin_btn')
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    // Scale to fit nicely
    const btnScale = 120 / Math.max(this.spinBtn.width, this.spinBtn.height);
    this.spinBtn.setScale(btnScale);

    // Skip button (hidden by default, shown when target reached)
    this.skipBtn = this.scene.add.text(W - 100, bottomY + 50, '[ SKIP → ]', {
      fontSize: '16px', color: '#aaaaff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    // Win text (floats above grid)
    this.winText = this.scene.add.text(W / 2, 60, '', {
      fontSize: '42px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
  }

  private updateDenomColors(): void {
    for (const d of this.denomBtns) {
      if (d.value === this.selectedDenom) {
        d.btn.setColor('#ffffff');
        d.btn.setBackgroundColor('#444488');
      } else {
        d.btn.setColor('#888888');
        d.btn.setBackgroundColor('#222244');
      }
    }
  }

  getDenom(): number {
    return this.selectedDenom;
  }

  updateMaxBet(maxBet: number): void {
    if (maxBet === this.currentMaxBet) return;
    this.currentMaxBet = maxBet;

    // Rebuild denom options: powers/multiples up to maxBet
    const denoms: number[] = [1];
    if (maxBet >= 5) denoms.push(5);
    if (maxBet >= 10) denoms.push(10);
    if (maxBet >= 25) denoms.push(25);
    if (maxBet >= 50) denoms.push(50);
    if (maxBet >= 100) denoms.push(100);

    const W = this.scene.cameras.main.width;
    const betCenterX = W / 2;
    const betY = this.denomBtns[0]?.btn.y ?? 0;
    const denomStartX = betCenterX - ((denoms.length - 1) * 60) / 2;

    // Remove old buttons
    for (const d of this.denomBtns) {
      d.btn.destroy();
    }
    this.denomBtns = [];

    // Create new buttons
    for (let i = 0; i < denoms.length; i++) {
      const value = denoms[i];
      const btn = this.scene.add.text(denomStartX + i * 60, betY, `$${value}`, {
        fontSize: '18px', color: '#888888', fontFamily: 'monospace',
        backgroundColor: '#222244',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedDenom = value;
        this.updateDenomColors();
        if (this.onBetChange) this.onBetChange(value);
      });

      this.denomBtns.push({ btn, value });
    }

    // Clamp selected denom
    if (this.selectedDenom > maxBet) {
      this.selectedDenom = denoms[denoms.length - 1];
    }

    this.updateDenomColors();
    this.maxBetLabel.setText(`Min $1 · Max $${maxBet}`);
  }

  update(state: RunState): void {
    const W = this.scene.cameras.main.width;

    this.bankrollText.setText(`$${state.bankroll}`);
    this.betText.setText(`Bet: $${state.currentBet}`);
    this.levelText.setText(`Level ${state.level}`);
    this.targetText.setText(`Earn: $${state.levelEarnings} / $${state.target}`);

    const freeLabel = state.freeSpinsRemaining > 0 ? ` (+${state.freeSpinsRemaining} free)` : '';
    this.spinsText.setText(`Spins: ${state.spinsRemaining}/${state.spinsTotal}${freeLabel}`);

    // Warn when spins are low
    const totalSpins = state.spinsRemaining + state.freeSpinsRemaining;
    if (totalSpins <= 5 && totalSpins > 0) {
      this.spinsText.setColor('#ff4444');
      this.spinsText.setFontStyle('bold');
    } else {
      this.spinsText.setColor('#aaaaaa');
      this.spinsText.setFontStyle('');
    }

    // Progress bar based on level earnings
    const progress = Math.min(1, state.levelEarnings / state.target);
    this.progressBar.width = Math.max(0, (W - 40) * progress);
    this.progressBar.setFillStyle(progress >= 1 ? 0x44ff44 : 0xffcc00);

    // Update threshold markers
    for (const m of this.thresholdMarkers) {
      const hit = state.powerupThresholdsHit.includes(m.threshold);
      m.icon.setAlpha(hit ? 0.3 : 1);
      m.icon.setTint(hit ? 0x666666 : 0xffffff);
    }

    // Show skip button when earnings target reached
    this.skipBtn.setVisible(state.levelEarnings >= state.target);
  }

  showWin(amount: number): void {
    this.winText.setText(`+$${amount}`);
    this.winText.setAlpha(1);
    this.winText.setScale(1.3);
    this.winText.setY(70);
    // Pop in
    this.scene.tweens.add({
      targets: this.winText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
    // Fade out after holding
    this.scene.tweens.add({
      targets: this.winText,
      y: 45,
      alpha: 0,
      delay: 2000,
      duration: 1000,
      ease: 'Power2',
    });
  }

  setSpinEnabled(enabled: boolean): void {
    this.spinBtn.setTint(enabled ? 0xffffff : 0x666666);
    this.spinBtn.setAlpha(enabled ? 1 : 0.5);
    if (enabled) {
      this.spinBtn.setInteractive({ useHandCursor: true });
    } else {
      this.spinBtn.disableInteractive();
    }
  }
}
