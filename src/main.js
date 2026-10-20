import BootScene from './scenes/BootScene.js';
import SplashScene from './scenes/SplashScene.js';
import StarterWormScene from './scenes/StarterWormScene.js';
import HubScene from './scenes/HubScene.js';
import StubScene from './scenes/StubScene.js';
import FarmScene from './scenes/FarmScene.js';
import ShopScene from './scenes/ShopScene.js'; // Импортируем новую сцену магазина

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
  // Список всех сцен игры
  scene: [
    BootScene, 
    SplashScene, 
    StarterWormScene, 
    HubScene, 
    StubScene, 
    FarmScene,
    ShopScene // Добавили ShopScene в конец списка
  ],
};

const game = new Phaser.Game(config);
export default game;
