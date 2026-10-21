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
    this.load.image('boss4', 'assets/bosses/boss4.png');
    this.load.image('boss5', 'assets/bosses/boss5.png');
    this.load.image('boss6', 'assets/bosses/boss6.png');
    this.load.image('boss7', 'assets/bosses/boss7.png');
    this.load.image('boss8', 'assets/bosses/boss8.png');
    this.load.image('boss9', 'assets/bosses/boss9.png');
    this.load.image('boss10', 'assets/bosses/boss10.png');

    this.load.image('dragon', 'assets/rasa/dragon.png');
    this.load.image('cat', 'assets/rasa/cat.png');
    this.load.image('robot', 'assets/rasa/robot.png');
    this.load.image('zombie', 'assets/rasa/zombie.png');
    this.load.image('rabit', 'assets/rasa/rabit.png');
    this.load.image('demon', 'assets/rasa/demon.png');

    this.load.image('icon_fuz', 'assets/fuz.png');
    this.load.image('icon_medkit', 'assets/aptecka.png'); 
    this.load.image('icon_antitoksin', 'assets/antitoksin.png');

    // Звуки (без shoot)
    this.load.audio('sfx_click', 'assets/sounds/click.mp3');
    this.load.audio('sfx_swap', 'assets/sounds/swap.mp3');
    this.load.audio('sfx_explode', 'assets/sounds/explode.mp3');
    this.load.audio('sfx_buy', 'assets/sounds/buy.mp3');
    this.load.audio('sfx_error', 'assets/sounds/error.mp3');
    this.load.audio('sfx_heal', 'assets/sounds/heal.mp3');
    this.load.audio('sfx_win', 'assets/sounds/win.mp3');
    this.load.audio('sfx_lose', 'assets/sounds/lose.mp3');
  }

  create() {
    Save.load();
    this.scene.start('SplashScene');
  }
}
