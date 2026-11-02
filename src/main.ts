import Phaser from 'phaser';
import { DESIGN } from './config/game';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { LevelComplete } from './scenes/LevelComplete';
import { LevelSelect } from './scenes/LevelSelect';
import { MainMenu } from './scenes/MainMenu';
import { Pause } from './scenes/Pause';
import { Preload } from './scenes/Preload';
import { Settings } from './scenes/Settings';
import { Shop } from './scenes/Shop';

document.title = 'DEEP CLAW';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#2a170b',
  scale: {
    // EXPAND: the 720x1280 design area stays fully visible; extra room on tall / wide screens
    // is filled with decorative sky and soil, so there are never black bars.
    mode: Phaser.Scale.EXPAND,
    width: DESIGN.width,
    height: DESIGN.height,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: { antialias: true, powerPreference: 'high-performance', roundPixels: false },
  input: { activePointers: 2 },
  fps: { target: 60 },
  scene: [Boot, Preload, MainMenu, LevelSelect, Game, Pause, Settings, LevelComplete, GameOver, Shop],
});
