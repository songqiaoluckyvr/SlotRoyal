import Phaser from 'phaser';

const STAR_COUNT = 60;

interface Star {
  gfx: Phaser.GameObjects.Arc;
  speed: number;
}

export class Starfield {
  private stars: Star[] = [];
  private w: number;
  private h: number;

  constructor(scene: Phaser.Scene) {
    this.w = scene.cameras.main.width;
    this.h = scene.cameras.main.height;

    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const speed = size * 15 + 5; // bigger = faster (parallax)
      const alpha = Phaser.Math.FloatBetween(0.15, 0.5);
      const x = Phaser.Math.Between(0, this.w);
      const y = Phaser.Math.Between(0, this.h);

      const gfx = scene.add.circle(x, y, size, 0xffffff, alpha).setDepth(-10);
      this.stars.push({ gfx, speed });
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;
    for (const star of this.stars) {
      star.gfx.y += star.speed * dt;
      // Wrap around
      if (star.gfx.y > this.h + 5) {
        star.gfx.y = -5;
        star.gfx.x = Phaser.Math.Between(0, this.w);
      }
    }
  }
}
