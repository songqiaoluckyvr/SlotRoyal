import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Logo background
    this.cameras.main.setBackgroundColor('#000000');
    const logo = this.add.image(W / 2, H / 2, 'logo2');
    const logoScale = Math.max(W / logo.width, H / logo.height);
    logo.setScale(logoScale);

    // Leaderboard table centered on the slot machine area
    this.buildLeaderboard(W / 2 - 210, H / 2 - 130);

    // Start button — lower area
    const startBtn = this.add.text(W / 2, H - 120, 'START GAME', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#44aa44', padding: { x: 30, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);

    startBtn.on('pointerover', () => startBtn.setBackgroundColor('#66cc66'));
    startBtn.on('pointerout', () => startBtn.setBackgroundColor('#44aa44'));
    startBtn.on('pointerdown', () => this.scene.start('Game'));

    this.tweens.add({
      targets: startBtn,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Version
    this.add.text(W / 2, H - 20, 'v0.1 — MVP', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private buildLeaderboard(x: number, y: number): void {
    const scores: { score: number; level: number; date: string }[] =
      JSON.parse(localStorage.getItem('slotroyal_scores') || '[]');

    // Background panel
    const panelW = 420;
    const rowH = 42;
    const headerH = 48;
    const rows = Math.min(scores.length, 10);
    const minContentH = rows > 0 ? rows * rowH + 24 : 50;
    const panelH = (headerH + minContentH + 16) * 3 - 100;

    this.add.rectangle(x + panelW / 2, y + panelH / 2, panelW, panelH, 0x000000, 0.7)
      .setStrokeStyle(1, 0x444466).setDepth(5);

    // Header
    this.add.text(x + panelW / 2, y + 10, 'LEADERBOARD', {
      fontSize: '24px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(6);

    if (scores.length === 0) {
      this.add.text(x + panelW / 2, y + headerH + 14, 'No scores yet — play a game!', {
        fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(6);
      return;
    }

    // Column headers
    const colRank = x + 20;
    const colScore = x + 70;
    const colLevel = x + 260;
    const colDate = x + 340;
    const headY = y + headerH;

    const hdrStyle = { fontSize: '14px', color: '#888888', fontFamily: 'monospace' };
    this.add.text(colRank, headY, '#', hdrStyle).setDepth(6);
    this.add.text(colScore, headY, 'Score', hdrStyle).setDepth(6);
    this.add.text(colLevel, headY, 'Level', hdrStyle).setDepth(6);
    this.add.text(colDate, headY, 'Date', hdrStyle).setDepth(6);

    // Rows
    const top = scores.sort((a, b) => b.score - a.score).slice(0, 10);
    for (let i = 0; i < top.length; i++) {
      const s = top[i];
      const ry = headY + 24 + i * rowH;
      const color = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaaaaa';
      const style = { fontSize: '16px', color, fontFamily: 'monospace' };

      this.add.text(colRank, ry, `${i + 1}`, style).setDepth(6);
      this.add.text(colScore, ry, `$${s.score}`, style).setDepth(6);
      this.add.text(colLevel, ry, `${s.level}`, style).setDepth(6);
      this.add.text(colDate, ry, s.date, style).setDepth(6);
    }
  }
}
