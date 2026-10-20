import BootScene from './scenes/BootScene.js';
import SplashScene from './scenes/SplashScene.js';
import StarterWormScene from './scenes/StarterWormScene.js';
import HubScene from './scenes/HubScene.js';
import StubScene from './scenes/StubScene.js';

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
  scene: [BootScene, SplashScene, StarterWormScene, HubScene, StubScene],
};

const game = new Phaser.Game(config);
export default game;
