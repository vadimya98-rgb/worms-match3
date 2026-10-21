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
  // МЕНЯЕМ РАЗРЕШЕНИЕ НА ВЫТЯНУТОЕ (как экран телефона)
  width: 720,
  height: 1600, 
  backgroundColor: '#1a1a2e',
  parent: 'game',
  
  scale: {
    // ENVELOP заполняет экран, сохраняя пропорции (если пропорции совпадают, обрезки нет)
    mode: Phaser.Scale.ENVELOP, 
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene, SplashScene, StarterWormScene, HubScene, StubScene, 
    FarmScene, ShopScene, BossListScene, BossDetailScene, 
    BossBattleScene, DailyBonusScene, AdminScene
  ],
};

const game = new Phaser.Game(config);
export default game;
