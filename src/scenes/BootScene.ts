import Phaser from 'phaser';
import { SYMBOLS } from '../core/SymbolTable';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Load all symbol images
    for (const sym of SYMBOLS) {
      this.load.image(sym.id, `/symbols/${sym.id}.png`);
    }
  }

  create(): void {
    this.scene.start('Game');
  }
}
