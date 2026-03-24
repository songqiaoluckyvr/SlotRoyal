import Phaser from 'phaser';
import type { SymbolDef } from '../core/SymbolTable';

const CELL_SIZE = 80;
const CELL_GAP = 6;
const SPRITE_SIZE = 64; // display size for the 128px sprites
const MAX_ROWS = 6;
const MAX_COLS = 6;

interface Cell {
  bg: Phaser.GameObjects.Rectangle;
  sprite: Phaser.GameObjects.Image;
  lockIcon: Phaser.GameObjects.Text;
  isLocked: boolean;
}

export class SlotGrid {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private cells: Cell[][] = [];
  private activeRows = 0;
  private activeCols = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  build(activeRows: number, activeCols: number, centerX: number, centerY: number): void {
    this.destroy();
    this.activeRows = activeRows;
    this.activeCols = activeCols;
    this.cells = [];

    const totalW = MAX_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const totalH = MAX_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const startX = centerX - totalW / 2 + CELL_SIZE / 2;
    const startY = centerY - totalH / 2 + CELL_SIZE / 2;

    // Border around entire grid
    const pad = 8;
    const border = this.scene.add.rectangle(centerX, centerY, totalW + pad * 2, totalH + pad * 2)
      .setStrokeStyle(2, 0x5555aa).setFillStyle(0x000000, 0);
    this.container.add(border);

    for (let r = 0; r < MAX_ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < MAX_COLS; c++) {
        const x = startX + c * (CELL_SIZE + CELL_GAP);
        const y = startY + r * (CELL_SIZE + CELL_GAP);
        const locked = r >= activeRows || c >= activeCols;

        const bg = this.scene.add.rectangle(x, y, CELL_SIZE, CELL_SIZE,
          locked ? 0x111122 : 0x333355
        ).setStrokeStyle(locked ? 1 : 2, locked ? 0x222233 : 0x5555aa);

        if (locked) {
          bg.setAlpha(0.5);
        }

        const sprite = this.scene.add.image(x, y, '__DEFAULT')
          .setDisplaySize(SPRITE_SIZE, SPRITE_SIZE)
          .setVisible(false);

        const lockIcon = this.scene.add.text(x, y, '🔒', {
          fontSize: '20px',
        }).setOrigin(0.5).setAlpha(0.3).setVisible(locked);

        this.container.add([bg, sprite, lockIcon]);
        row.push({ bg, sprite, lockIcon, isLocked: locked });
      }
      this.cells.push(row);
    }
  }

  setGrid(grid: SymbolDef[][]): void {
    for (let r = 0; r < this.activeRows; r++) {
      for (let c = 0; c < this.activeCols; c++) {
        if (grid[r] && grid[r][c]) {
          const sym = grid[r][c];
          const cell = this.cells[r][c];
          cell.sprite.setTexture(sym.id).setVisible(true).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
          cell.bg.setFillStyle(sym.color, 0.15);
          cell.bg.setStrokeStyle(2, sym.color);
        }
      }
    }
  }

  highlightWin(positions: [number, number][]): void {
    for (const [r, c] of positions) {
      if (this.cells[r] && this.cells[r][c] && !this.cells[r][c].isLocked) {
        const cell = this.cells[r][c];
        this.scene.tweens.add({
          targets: [cell.bg, cell.sprite],
          alpha: { from: 1, to: 0.3 },
          duration: 150,
          yoyo: true,
          repeat: 3,
        });
      }
    }
  }

  reset(): void {
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < MAX_COLS; c++) {
        const cell = this.cells[r][c];
        if (!cell.isLocked) {
          cell.sprite.setVisible(false);
          cell.bg.setFillStyle(0x333355);
          cell.bg.setStrokeStyle(2, 0x5555aa);
          cell.bg.setAlpha(1);
          cell.sprite.setAlpha(1);
        }
      }
    }
  }

  private destroy(): void {
    this.container.removeAll(true);
    this.cells = [];
  }
}
