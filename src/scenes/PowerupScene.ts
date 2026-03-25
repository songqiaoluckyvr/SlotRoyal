import Phaser from 'phaser';
import type { PowerupInstance } from '../powerups/types';
import { registry } from '../powerups/PowerupRegistry';
import type { RunState } from '../state/RunState';

interface PowerupSceneData {
  options: PowerupInstance[];
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

  private createCard(x: number, y: number, width: number, powerup: PowerupInstance): void {
    const height = 180;

    this.add.rectangle(x, y, width, height, 0x2a2a4a)
      .setStrokeStyle(2, powerup.color).setDepth(1);

    this.add.text(x, y - 60, powerup.name, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    this.add.text(x, y - 20, powerup.description, {
      fontSize: '14px', color: '#cccccc', fontFamily: 'monospace',
      wordWrap: { width: width - 20 }, align: 'center',
    }).setOrigin(0.5).setDepth(1);

    // Instant/Passive badge
    const badge = powerup.consumable ? 'INSTANT' : 'PASSIVE';
    const badgeColor = powerup.consumable ? '#ff8844' : '#44aaff';
    this.add.text(x, y + 20, badge, {
      fontSize: '11px', color: badgeColor, fontFamily: 'monospace',
      backgroundColor: '#1a1a2e', padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(1);

    const btn = this.add.text(x, y + 50, '[ PICK ]', {
      fontSize: '18px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    btn.on('pointerover', () => btn.setColor('#88ff88'));
    btn.on('pointerout', () => btn.setColor('#44ff44'));
    btn.on('pointerdown', () => this.pickPowerup(powerup));
  }

  private pickPowerup(powerup: PowerupInstance): void {
    const state = this.sceneData.state;

    // Consumables apply immediately — don't occupy a slot
    if (powerup.consumable) {
      this.applyConsumable(powerup);
      this.closeScene();
      return;
    }

    // Try to merge with existing
    const mergeTarget = state.activePowerups.find(p => registry.canMerge(p, powerup));
    if (mergeTarget) {
      registry.merge(mergeTarget, powerup);
      this.closeScene();
      return;
    }

    // If slots available, just add
    if (state.activePowerups.length < 3) {
      state.activePowerups.push(powerup);
      this.closeScene();
      return;
    }

    // Slots full — show swap UI
    this.showSwapUI(powerup);
  }

  private applyConsumable(powerup: PowerupInstance): void {
    const state = this.sceneData.state;
    if (powerup.type === 'free_spins') {
      state.freeSpinsRemaining += powerup.value;
    }
    if (powerup.type === 'red_pocket') {
      const reward = Phaser.Math.Between(10, 50) * state.level;
      state.bankroll += reward;
      state.levelEarnings += reward;
    }
  }

  private showSwapUI(newPowerup: PowerupInstance): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const state = this.sceneData.state;

    this.children.removeAll();
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0);

    this.add.text(W / 2, 40, 'SLOTS FULL — PICK ONE TO REPLACE', {
      fontSize: '20px', color: '#ff8844', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    this.add.text(W / 2, 80, `New: ${newPowerup.name} — ${newPowerup.description}`, {
      fontSize: '16px', color: '#44ff44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

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
