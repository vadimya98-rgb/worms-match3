// Импортируем все сцены игры
import BootScene from './scenes/BootScene.js';
import SplashScene from './scenes/SplashScene.js';
import StarterWormScene from './scenes/StarterWormScene.js';
import HubScene from './scenes/HubScene.js';
import StubScene from './scenes/StubScene.js';
import FarmScene from './scenes/FarmScene.js';
import ShopScene from './scenes/ShopScene.js';
import BossListScene from './scenes/BossListScene.js';
import BossDetailScene from './scenes/BossDetailScene.js';
import BossBattleScene from './scenes/BossBattleScene.js';
import DailyBonusScene from './scenes/DailyBonusScene.js';
import AdminScene from './scenes/AdminScene.js';

const config = {
  type: Phaser.AUTO,
  // Логическое разрешение игры (в пикселях)
  width: 720,
  height: 1280,
  backgroundColor: '#1a1a2e',
  parent: 'game',
  
  scale: {
    // ИЗМЕНЕНО: ENVELOP растягивает игру на весь экран, 
    // заполняя пустые полосы сверху и снизу
    mode: Phaser.Scale.ENVELOP, 
    
    // Центрируем холст
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // Список всех сцен
  scene: [
    BootScene, 
    SplashScene, 
    StarterWormScene, 
    HubScene, 
    StubScene, 
    FarmScene,
    ShopScene,
    BossListScene,
    BossDetailScene,
    BossBattleScene,
    DailyBonusScene,
    AdminScene
  ],
};

// Создаем игру
const game = new Phaser.Game(config);
export default game;
