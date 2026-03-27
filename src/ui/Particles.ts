import Phaser from 'phaser';

/** Create a circle texture for particles (cached by key) */
function ensureCircleTexture(scene: Phaser.Scene, key: string, color: number, radius: number): string {
  if (scene.textures.exists(key)) return key;
  const size = radius * 2;
  const g = scene.make.graphics({});
  g.fillStyle(color, 1);
  g.fillCircle(size / 2, size / 2, radius);
  g.generateTexture(key, size, size);
  g.destroy();
  return key;
}

/** Sparkle particles during reel spin — call start/stop */
export function createSpinSparkles(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Particles.ParticleEmitter {
  const key = ensureCircleTexture(scene, 'particle_spark', 0xffffff, 3);
  const emitter = scene.add.particles(x, y, key, {
    speed: { min: 20, max: 60 },
    angle: { min: 260, max: 280 },
    lifespan: 600,
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.6, end: 0 },
    frequency: 40,
    quantity: 2,
    emitZone: {
      type: 'random',
      source: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig,
    tint: [0xffffff, 0xffcc00, 0x44aaff, 0xff88ff],
  }).setDepth(15);

  return emitter;
}

/** Firework burst at a position — auto-cleans up */
export function fireworkBurst(scene: Phaser.Scene, x: number, y: number, color?: number): void {
  const burstColor = color ?? Phaser.Utils.Array.GetRandom([0xffcc00, 0xff4444, 0x44ff44, 0x44aaff, 0xff88ff]);
  const key = ensureCircleTexture(scene, `particle_fw_${burstColor}`, burstColor, 4);

  const emitter = scene.add.particles(x, y, key, {
    speed: { min: 80, max: 250 },
    angle: { min: 0, max: 360 },
    lifespan: 1000,
    scale: { start: 1, end: 0, ease: 'sine.out' },
    alpha: { start: 1, end: 0 },
    gravityY: 120,
  }).setDepth(50);

  emitter.explode(30);

  scene.time.delayedCall(1200, () => emitter.destroy());
}

/** Multiple firework bursts spread across an area — for big wins */
export function celebrationFireworks(scene: Phaser.Scene, cx: number, cy: number, count: number = 3): void {
  for (let i = 0; i < count; i++) {
    scene.time.delayedCall(i * 200, () => {
      const x = cx + Phaser.Math.Between(-150, 150);
      const y = cy + Phaser.Math.Between(-80, 80);
      fireworkBurst(scene, x, y);
    });
  }
}
