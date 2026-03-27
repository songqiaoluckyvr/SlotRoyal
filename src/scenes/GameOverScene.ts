import Phaser from 'phaser';

interface GameOverData {
  level: number;
  bankroll: number;
  finalScore?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Save score to leaderboard
    const score = data.finalScore ?? data.bankroll;
    this.saveScore(score, data.level);

    const isFinalLevel = data.finalScore != null;

    this.add.text(cx, cy - 120, isFinalLevel ? 'RUN COMPLETE!' : 'GAME OVER', {
      fontSize: '48px',
      color: isFinalLevel ? '#ffcc00' : '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 50, `Reached Level ${data.level}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, `Final Bankroll: $${data.bankroll}`, {
      fontSize: '20px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (isFinalLevel) {
      this.add.text(cx, cy + 25, `Level 10 Earnings: $${data.finalScore}`, {
        fontSize: '20px',
        color: '#44ff44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    const restart = this.add.text(cx, cy + 90, 'TRY AGAIN', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      backgroundColor: '#44aa44',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.on('pointerover', () => restart.setBackgroundColor('#66cc66'));
    restart.on('pointerout', () => restart.setBackgroundColor('#44aa44'));
    restart.on('pointerdown', () => this.scene.start('Game'));

    const menu = this.add.text(cx, cy + 150, 'MAIN MENU', {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'monospace',
      backgroundColor: '#333355',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menu.on('pointerover', () => menu.setBackgroundColor('#444477'));
    menu.on('pointerout', () => menu.setBackgroundColor('#333355'));
    menu.on('pointerdown', () => this.scene.start('MainMenu'));
  }

  private saveScore(score: number, level: number): void {
    const scores: { score: number; level: number; date: string }[] =
      JSON.parse(localStorage.getItem('slotroyal_scores') || '[]');

    const date = new Date().toLocaleDateString();
    scores.push({ score, level, date });

    // Keep top 20
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('slotroyal_scores', JSON.stringify(scores.slice(0, 20)));
  }
}
