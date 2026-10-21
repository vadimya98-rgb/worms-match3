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
  // ВОЗВРАЩАЕМ 1280, чтобы кнопки не съезжали
  width: 720,
  height: 1280,
  // ДЕЛАЕМ ФОН ПРОЗРАЧНЫМ (чтобы видеть CSS-фон)
  transparent: true, 
  parent: 'game',
  
  scale: {
    // FIT вписывает игру целиком, ничего не обрезая
    mode: Phaser.Scale.FIT, 
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
