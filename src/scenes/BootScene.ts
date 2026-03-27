import Phaser from 'phaser';
import { SYMBOLS } from '../core/SymbolTable';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;

    // Load all symbol images
    for (const sym of SYMBOLS) {
      this.load.image(sym.id, `${base}symbols/${sym.id}.png`);
    }

    // Load UI assets
    this.load.image('logo', `${base}ui/logo.png`);
    this.load.image('logo2', `${base}ui/logo2.png`);
    this.load.image('spin_btn', `${base}ui/spin_button.png`);
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
