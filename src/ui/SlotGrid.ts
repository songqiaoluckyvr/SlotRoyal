import Phaser from 'phaser';
import type { SymbolDef } from '../core/SymbolTable';
import { SYMBOLS } from '../core/SymbolTable';

const CELL_SIZE = 80;
const CELL_GAP = 6;
const SPRITE_SIZE = 64; // display size for the 128px sprites
const MAX_ROWS = 6;
const MAX_COLS = 6;

const SPIN_CYCLE_MS = 60;        // ms between symbol swaps during spin
const MIN_SPIN_CYCLES = 8;       // minimum cycles before first column stops

interface Cell {
  bg: Phaser.GameObjects.Rectangle;
  sprite: Phaser.GameObjects.Image;
  lockIcon: Phaser.GameObjects.Text;
  isLocked: boolean;
  baseY: number;                  // original Y position for bounce
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
        row.push({ bg, sprite, lockIcon, isLocked: locked, baseY: y });
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

  /** Pre-set specific cells to their final symbols immediately (no animation) */
  setPartialGrid(grid: SymbolDef[][], cells: Set<string>): void {
    for (const key of cells) {
      const [r, c] = key.split(',').map(Number);
      if (r < this.activeRows && c < this.activeCols) {
        const cell = this.cells[r][c];
        const sym = grid[r][c];
        cell.sprite.setTexture(sym.id).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
        cell.sprite.setVisible(true);
        cell.sprite.setAlpha(1);
        if (cell.sprite.preFX) cell.sprite.preFX.clear();
        cell.sprite.y = cell.baseY;
        cell.bg.y = cell.baseY;
        cell.bg.setFillStyle(sym.color, 0.15);
        cell.bg.setStrokeStyle(2, sym.color);
      }
    }
  }

  /**
   * Spin and reveal the grid. If onlyCells is provided, only those cells animate;
   * the rest stay in place showing their current symbol.
   */
  spinAndReveal(finalGrid: SymbolDef[][], onComplete: () => void, onlyCells?: Set<string>): void {
    const nonWild = SYMBOLS.filter(s => !s.isWild);

    // If onlyCells provided, figure out which columns have cells to animate
    const isPartial = onlyCells != null;
    const activeCellSet = onlyCells;

    // Collect columns that need spinning
    const colsToSpin = new Set<number>();
    if (isPartial) {
      for (const key of activeCellSet!) {
        const c = parseInt(key.split(',')[1]);
        colsToSpin.add(c);
      }
    } else {
      for (let c = 0; c < this.activeCols; c++) colsToSpin.add(c);
    }

    // If no columns to spin, just update and done
    if (colsToSpin.size === 0) {
      this.setGrid(finalGrid);
      onComplete();
      return;
    }

    let stoppedCols = 0;
    const totalCols = colsToSpin.size;

    // Reset animated cells to spinning state with blur
    for (let r = 0; r < this.activeRows; r++) {
      for (let c = 0; c < this.activeCols; c++) {
        if (isPartial && !activeCellSet!.has(`${r},${c}`)) continue;
        const cell = this.cells[r][c];
        cell.sprite.setVisible(true);
        cell.sprite.setAlpha(0.7);
        if (cell.sprite.preFX) {
          cell.sprite.preFX.addBlur(0, 0, 2, 1);
        }
        cell.bg.setFillStyle(0x333355);
        cell.bg.setStrokeStyle(2, 0x5555aa);
      }
    }

    // For each column that needs spinning
    let colIndex = 0;
    for (const c of colsToSpin) {
      let cycleCount = 0;
      const stopAt = MIN_SPIN_CYCLES + colIndex * 2; // shorter for cascade
      colIndex++;

      const timer = this.scene.time.addEvent({
        delay: SPIN_CYCLE_MS,
        loop: true,
        callback: () => {
          cycleCount++;
          const offset = (cycleCount % 2 === 0) ? 6 : 0;

          for (let r = 0; r < this.activeRows; r++) {
            if (isPartial && !activeCellSet!.has(`${r},${c}`)) continue;
            const cell = this.cells[r][c];
            const randomSym = Phaser.Utils.Array.GetRandom(nonWild);
            cell.sprite.setTexture(randomSym.id).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
            cell.sprite.y = cell.baseY + offset;
            cell.bg.y = cell.baseY + offset;
          }

          if (cycleCount >= stopAt) {
            timer.remove();
            this.stopColumn(c, finalGrid, () => {
              stoppedCols++;
              if (stoppedCols >= totalCols) {
                onComplete();
              }
            }, isPartial ? activeCellSet : undefined);
          }
        },
      });
    }
  }

  /** Stop a single column: set final symbols and play settle animation */
  private stopColumn(col: number, finalGrid: SymbolDef[][], onDone: () => void, onlyCells?: Set<string>): void {
    const rowsToSettle: number[] = [];
    for (let r = 0; r < this.activeRows; r++) {
      if (onlyCells && !onlyCells.has(`${r},${col}`)) continue;
      rowsToSettle.push(r);
    }

    if (rowsToSettle.length === 0) {
      onDone();
      return;
    }

    let settled = 0;
    for (const r of rowsToSettle) {
      const cell = this.cells[r][col];
      const sym = finalGrid[r][col];

      // Set final symbol — clear blur and restore alpha
      if (cell.sprite.preFX) {
        cell.sprite.preFX.clear();
      }
      cell.sprite.setTexture(sym.id).setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
      cell.sprite.setAlpha(1);
      cell.bg.setFillStyle(sym.color, 0.15);
      cell.bg.setStrokeStyle(2, sym.color);

      // Settle bounce: overshoot down then snap back
      cell.sprite.y = cell.baseY - 8;
      cell.bg.y = cell.baseY - 8;

      this.scene.tweens.add({
        targets: [cell.sprite, cell.bg],
        y: cell.baseY,
        duration: 150,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          settled++;
          if (settled >= rowsToSettle.length) {
            onDone();
          }
        },
      });
    }
  }

  private destroy(): void {
    this.container.removeAll(true);
    this.cells = [];
  }
}
