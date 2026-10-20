import { Save } from '../data/save.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.load.image('bg', 'assets/bg.jpg');

    this.load.image('weapon0', 'assets/weapon0.png');
    this.load.image('weapon1', 'assets/weapon1.png');
    this.load.image('weapon2', 'assets/weapon2.png');
    this.load.image('weapon3', 'assets/weapon3.png');
    this.load.image('weapon4', 'assets/weapon4.png');
    this.load.image('weapon5', 'assets/weapon5.png');

    this.load.image('boss0', 'assets/bosses/boss0.png');
    this.load.image('boss1', 'assets/bosses/boss1.png');
    this.load.image('boss2', 'assets/bosses/boss2.png');
    this.load.image('boss3', 'assets/bosses/boss3.png');

    this.load.image('dragon', 'assets/rasa/dragon.png');
    this.load.image('cat', 'assets/rasa/cat.png');
    this.load.image('robot', 'assets/rasa/robot.png');
    this.load.image('zombie', 'assets/rasa/zombie.png');

    // ИСПРАВЛЕНО: aptecka.png
    this.load.image('icon_fuz', 'assets/fuz.png');
    this.load.image('icon_medkit', 'assets/aptecka.png'); 
    this.load.image('icon_antitoksin', 'assets/antitoksin.png');
  }

  create() {
    Save.load();
    this.scene.start('SplashScene');
  }
}
