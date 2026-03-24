import Phaser from 'phaser';
import type { Powerup } from '../state/PowerupDefs';
import { canMerge, mergePowerup } from '../state/PowerupDefs';
import type { RunState } from '../state/RunState';

interface PowerupSceneData {
  options: Powerup[];
  state: RunState;
  onComplete: () => void;
}

export class PowerupScene extends Phaser.Scene {
  private sceneData!: PowerupSceneData;

  constructor() {
    super('Powerup');
  }

  create(data: PowerupSceneData): void {
    this.sceneData = data;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(0);

    this.add.text(W / 2, 60, 'CHOOSE A POWERUP', {
      fontSize: '28px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    // Render powerup cards
    const cardWidth = 200;
    const gap = 20;
    const totalWidth = data.options.length * cardWidth + (data.options.length - 1) * gap;
    const startX = (W - totalWidth) / 2 + cardWidth / 2;

    data.options.forEach((powerup, i) => {
      const x = startX + i * (cardWidth + gap);
      const y = H / 2 - 30;
      this.createCard(x, y, cardWidth, powerup);
    });

    // Skip button
    const skip = this.add.text(W / 2, H - 80, '[ SKIP ]', {
      fontSize: '22px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    skip.on('pointerover', () => skip.setColor('#cccccc'));
    skip.on('pointerout', () => skip.setColor('#888888'));
    skip.on('pointerdown', () => this.closeScene());
  }

  private createCard(x: number, y: number, width: number, powerup: Powerup): void {
    const height = 180;

    // Card background
    this.add.rectangle(x, y, width, height, 0x2a2a4a)
      .setStrokeStyle(2, powerup.color).setDepth(1);

    // Name
    this.add.text(x, y - 60, powerup.name, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    // Description
    this.add.text(x, y - 20, powerup.description, {
      fontSize: '14px', color: '#cccccc', fontFamily: 'monospace',
      wordWrap: { width: width - 20 }, align: 'center',
    }).setOrigin(0.5).setDepth(1);

    // Pick button
    const btn = this.add.text(x, y + 50, '[ PICK ]', {
      fontSize: '18px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    btn.on('pointerover', () => btn.setColor('#88ff88'));
    btn.on('pointerout', () => btn.setColor('#44ff44'));
    btn.on('pointerdown', () => this.pickPowerup(powerup));
  }

  private pickPowerup(powerup: Powerup): void {
    const state = this.sceneData.state;

    // Try to merge with existing
    const mergeTarget = state.activePowerups.find(p => canMerge(p, powerup));
    if (mergeTarget) {
      mergePowerup(mergeTarget, powerup);
      this.closeScene();
      return;
    }

    // If slots available, just add
    if (state.activePowerups.length < 5) {
      state.activePowerups.push(powerup);
      this.closeScene();
      return;
    }

    // Slots full — show swap UI
    this.showSwapUI(powerup);
  }

  private showSwapUI(newPowerup: Powerup): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const state = this.sceneData.state;

    // Clear scene and show swap options
    this.children.removeAll();
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0);

    this.add.text(W / 2, 40, 'SLOTS FULL — PICK ONE TO REPLACE', {
      fontSize: '20px', color: '#ff8844', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    // Show new powerup
    this.add.text(W / 2, 80, `New: ${newPowerup.name} — ${newPowerup.description}`, {
      fontSize: '16px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    // Show existing powerups as swap targets
    state.activePowerups.forEach((existing, i) => {
      const y = 140 + i * 50;
      const txt = this.add.text(W / 2, y,
        `[${i + 1}] ${existing.name} Lv.${existing.level} — ${existing.description}`, {
          fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

      txt.on('pointerover', () => txt.setColor('#ff6666'));
      txt.on('pointerout', () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => {
        state.activePowerups[i] = newPowerup;
        this.closeScene();
      });
    });

    // Cancel
    const cancel = this.add.text(W / 2, 140 + state.activePowerups.length * 50 + 30, '[ CANCEL ]', {
      fontSize: '18px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    cancel.on('pointerover', () => cancel.setColor('#cccccc'));
    cancel.on('pointerout', () => cancel.setColor('#888888'));
    cancel.on('pointerdown', () => this.closeScene());
  }

  private closeScene(): void {
    this.sceneData.onComplete();
    this.scene.stop();
  }
}
