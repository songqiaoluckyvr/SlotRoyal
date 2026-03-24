import Phaser from 'phaser';
import type { SymbolDef } from '../core/SymbolTable';

const CELL_SIZE = 80;
const CELL_GAP = 6;
const SPRITE_SIZE = 64; // display size for the 128px sprites

interface Cell {
  bg: Phaser.GameObjects.Rectangle;
  sprite: Phaser.GameObjects.Image;
}

export class SlotGrid {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private cells: Cell[][] = [];
  private rows = 0;
  private cols = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  build(rows: number, cols: number, centerX: number, centerY: number): void {
    this.destroy();
    this.rows = rows;
    this.cols = cols;
    this.cells = [];

    const totalW = cols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const totalH = rows * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const startX = centerX - totalW / 2 + CELL_SIZE / 2;
    const startY = centerY - totalH / 2 + CELL_SIZE / 2;

    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (CELL_SIZE + CELL_GAP);
        const y = startY + r * (CELL_SIZE + CELL_GAP);

        const bg = this.scene.add.rectangle(x, y, CELL_SIZE, CELL_SIZE, 0x333355)
          .setStrokeStyle(2, 0x5555aa);

        const sprite = this.scene.add.image(x, y, '__DEFAULT')
          .setDisplaySize(SPRITE_SIZE, SPRITE_SIZE)
          .setVisible(false);

        this.container.add([bg, sprite]);
        row.push({ bg, sprite });
      }
      this.cells.push(row);
    }
  }

  setGrid(grid: SymbolDef[][]): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
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
      if (this.cells[r] && this.cells[r][c]) {
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
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        cell.sprite.setVisible(false);
        cell.bg.setFillStyle(0x333355);
        cell.bg.setStrokeStyle(2, 0x5555aa);
        cell.bg.setAlpha(1);
        cell.sprite.setAlpha(1);
      }
    }
  }

  private destroy(): void {
    this.container.removeAll(true);
    this.cells = [];
  }
}
