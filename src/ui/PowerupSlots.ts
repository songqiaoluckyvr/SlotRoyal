import Phaser from 'phaser';
import type { Powerup } from '../state/PowerupDefs';

const SLOT_SIZE = 40;
const SLOT_GAP = 8;
const MAX_SLOTS = 5;

export class PowerupSlots {
  private container: Phaser.GameObjects.Container;
  private slots: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; tooltip: Phaser.GameObjects.Text }[] = [];
  private tooltipBg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);

    // Label
    const label = scene.add.text(0, -20, 'Powerups:', {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
    });
    this.container.add(label);

    // Shared tooltip background (hidden by default)
    this.tooltipBg = scene.add.rectangle(0, 0, 200, 30, 0x000000, 0.9)
      .setStrokeStyle(1, 0x555555).setVisible(false).setDepth(20);
    this.container.add(this.tooltipBg);

    // Create 5 empty slots (vertical layout)
    for (let i = 0; i < MAX_SLOTS; i++) {
      const sy = i * (SLOT_SIZE + SLOT_GAP);

      const bg = scene.add.rectangle(SLOT_SIZE / 2, sy + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x222244)
        .setStrokeStyle(1, 0x444466);

      const text = scene.add.text(SLOT_SIZE / 2, sy + SLOT_SIZE / 2, '', {
        fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
        align: 'center',
      }).setOrigin(0.5);

      const tooltip = scene.add.text(SLOT_SIZE + 8, sy + SLOT_SIZE / 2, '', {
        fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
        wordWrap: { width: 150 },
      }).setOrigin(0, 0.5).setVisible(false).setDepth(21);

      // Hover for tooltip
      bg.setInteractive();
      bg.on('pointerover', () => {
        if (tooltip.text) tooltip.setVisible(true);
      });
      bg.on('pointerout', () => tooltip.setVisible(false));

      this.container.add([bg, text, tooltip]);
      this.slots.push({ bg, text, tooltip });
    }
  }

  update(powerups: Powerup[]): void {
    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = this.slots[i];
      if (i < powerups.length) {
        const p = powerups[i];
        slot.bg.setStrokeStyle(2, p.color);
        slot.bg.setFillStyle(p.color, 0.2);
        // Short label: first 2 chars + level
        const shortLabel = p.name.substring(0, 3).toUpperCase();
        slot.text.setText(p.level > 1 ? `${shortLabel}\n${p.level}` : shortLabel);
        slot.tooltip.setText(`${p.name} Lv.${p.level}: ${p.description}`);
      } else {
        slot.bg.setStrokeStyle(1, 0x444466);
        slot.bg.setFillStyle(0x222244);
        slot.text.setText('');
        slot.tooltip.setText('');
        slot.tooltip.setVisible(false);
      }
    }
  }
}
