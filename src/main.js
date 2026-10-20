import BootScene from './scenes/BootScene.js';
import SplashScene from './scenes/SplashScene.js';
import StarterWormScene from './scenes/StarterWormScene.js';
import HubScene from './scenes/HubScene.js';
import StubScene from './scenes/StubScene.js';
import FarmScene from './scenes/FarmScene.js';
import ShopScene from './scenes/ShopScene.js';
import BossListScene from './scenes/BossListScene.js';     // Импорт карты боссов
import BossDetailScene from './scenes/BossDetailScene.js'; // Импорт деталей босса

const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#1a1a2e',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene, 
    SplashScene, 
    StarterWormScene, 
    HubScene, 
    StubScene, 
    FarmScene,
    ShopScene,
    BossListScene,   // Добавили карту
    BossDetailScene  // Добавили детали
  ],
};

const game = new Phaser.Game(config);
export default game;
