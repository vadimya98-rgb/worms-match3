import { Save } from '../data/save.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Сюда будем грузить картинки и звуки (пока пусто)
  }

  create() {
    // Загружаем сохранение ОДИН раз — все следующие сцены работают с Save.data
    Save.load();
    this.scene.start('SplashScene');
  }
}
