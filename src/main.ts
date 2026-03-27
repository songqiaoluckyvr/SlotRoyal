import Phaser from 'phaser';
import './powerups/index'; // Register all powerups
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
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
  scene: [BootScene, MainMenuScene, GameScene, PowerupScene, GameOverScene, InfoScene],
};

new Phaser.Game(config);
