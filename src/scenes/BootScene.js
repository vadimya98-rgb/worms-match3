import { Save } from '../data/save.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Загружаем 6 видов оружия (строго как в папке assets)
    this.load.image('weapon0', 'assets/weapon0.png');
    this.load.image('weapon1', 'assets/weapon1.png');
    this.load.image('weapon2', 'assets/weapon2.png');
    this.load.image('weapon3', 'assets/weapon3.png');
    this.load.image('weapon4', 'assets/weapon4.png');
    this.load.image('weapon5', 'assets/weapon5.png');

    // Персонажи и боссы (закомментированы, пока нет картинок)
    // this.load.image('dragon', 'assets/dragon.png');
    // this.load.image('mage', 'assets/mage.png');
    // this.load.image('warrior', 'assets/warrior.png');
    // this.load.image('tank', 'assets/tank.png');
    // this.load.image('boss0', 'assets/boss0.png');
    // this.load.image('boss1', 'assets/boss1.png');
    // this.load.image('boss2', 'assets/boss2.png');
  }

  create() {
    Save.load();
    this.scene.start('SplashScene');
  }
}
