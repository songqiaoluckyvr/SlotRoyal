import Phaser from 'phaser';
import type { RunState } from '../state/RunState';

export class HUD {
  private scene: Phaser.Scene;
  private bankrollText!: Phaser.GameObjects.Text;
  private spinsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private winText!: Phaser.GameObjects.Text;
  private denomBtns: { btn: Phaser.GameObjects.Text; value: number }[] = [];
  private betText!: Phaser.GameObjects.Text;
  private selectedDenom = 1;

  spinBtn!: Phaser.GameObjects.Text;
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
    this.scene.add.rectangle(W / 2, 42, W - 40, 10, 0x333333);
    this.progressBar = this.scene.add.rectangle(20, 42, 0, 10, 0x44ff44).setOrigin(0, 0.5);

    // Bottom area
    const bottomY = 520;

    this.bankrollText = this.scene.add.text(20, bottomY, '', {
      fontSize: '22px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
    });

    this.spinsText = this.scene.add.text(20, bottomY + 30, '', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
    });

    // Bet controls: [ - ]  Bet: $X  [ + ]   with denom selector below
    const betY = bottomY + 5;
    const betCenterX = W / 2;

    this.betDownBtn = this.scene.add.text(betCenterX - 100, betY, '[ - ]', {
      fontSize: '20px', color: '#ff8844', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.betText = this.scene.add.text(betCenterX, betY, '', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.betUpBtn = this.scene.add.text(betCenterX + 100, betY, '[ + ]', {
      fontSize: '20px', color: '#ff8844', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Denom selector row
    const denoms = [1, 5, 10, 25];
    const denomY = betY + 30;
    const denomStartX = betCenterX - ((denoms.length - 1) * 55) / 2;

    for (let i = 0; i < denoms.length; i++) {
      const value = denoms[i];
      const btn = this.scene.add.text(denomStartX + i * 55, denomY, `$${value}`, {
        fontSize: '14px', color: '#888888', fontFamily: 'monospace',
        backgroundColor: '#222244',
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedDenom = value;
        this.updateDenomColors();
      });

      this.denomBtns.push({ btn, value });
    }
    this.updateDenomColors();

    // Spin button (right bottom)
    this.spinBtn = this.scene.add.text(W - 100, bottomY + 10, 'SPIN', {
      fontSize: '28px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.scene.add.text(W - 100, bottomY + 38, 'Min $1 · Max $25', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

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

  update(state: RunState): void {
    const W = this.scene.cameras.main.width;

    this.bankrollText.setText(`$${state.bankroll}`);
    this.betText.setText(`Bet: $${state.currentBet}`);
    this.levelText.setText(`Level ${state.level}`);
    this.targetText.setText(`Target: $${state.target}`);

    const freeLabel = state.freeSpinsRemaining > 0 ? ` (+${state.freeSpinsRemaining} free)` : '';
    this.spinsText.setText(`Spins: ${state.spinsRemaining}/${state.spinsTotal}${freeLabel}`);

    // Progress bar
    const progress = Math.min(1, state.bankroll / state.target);
    this.progressBar.width = Math.max(0, (W - 40) * progress);
    this.progressBar.setFillStyle(progress >= 1 ? 0x44ff44 : 0xffcc00);

    // Show skip button when target reached
    this.skipBtn.setVisible(state.bankroll >= state.target);
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
    this.spinBtn.setColor(enabled ? '#44ff44' : '#666666');
    if (enabled) {
      this.spinBtn.setInteractive({ useHandCursor: true });
    } else {
      this.spinBtn.disableInteractive();
    }
  }
}
