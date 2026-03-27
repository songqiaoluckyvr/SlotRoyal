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

    // Load UI assets
    this.load.image('logo', '/ui/logo.png');
    this.load.image('logo2', '/ui/logo2.png');
    this.load.image('spin_btn', '/ui/spin_button.png');
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
