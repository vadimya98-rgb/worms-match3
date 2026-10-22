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
import InfoScene from './scenes/InfoScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js'; // Импортируем размеры

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT, // Высота теперь динамическая!
  transparent: true, // Фон прозрачный (виден CSS фон)
  parent: 'game',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene, SplashScene, StarterWormScene, HubScene, StubScene,
    FarmScene, ShopScene, BossListScene, BossDetailScene,
    BossBattleScene, DailyBonusScene, AdminScene, InfoScene
  ],
};

const game = new Phaser.Game(config);
export default game;
