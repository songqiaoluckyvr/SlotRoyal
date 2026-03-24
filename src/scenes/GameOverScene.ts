import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { level: number; bankroll: number }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 100, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, `Reached Level ${data.level}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 20, `Final Bankroll: $${data.bankroll}`, {
      fontSize: '20px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const restart = this.add.text(cx, cy + 80, '[ TRY AGAIN ]', {
      fontSize: '28px',
      color: '#44ff44',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.on('pointerover', () => restart.setColor('#88ff88'));
    restart.on('pointerout', () => restart.setColor('#44ff44'));
    restart.on('pointerdown', () => this.scene.start('Game'));
  }
}
