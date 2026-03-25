import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { PowerupScene } from './scenes/PowerupScene';
import { GameOverScene } from './scenes/GameOverScene';
import { InfoScene } from './scenes/InfoScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 750,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  scene: [BootScene, GameScene, PowerupScene, GameOverScene, InfoScene],
};

new Phaser.Game(config);
