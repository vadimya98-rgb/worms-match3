import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.3);

    // ВЕРХНЯЯ ПАНЕЛЬ (Справа, в две строки)
    this.createTopPanel();

    const cx = this.scale.width / 2;

    // Название
    this.add.text(cx, 200, 'MATCH-WORMIKS', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Кнопки режимов
    this.createRoundedButton(cx, 450, 400, 90, 'ФАРМ', 0x22aa44, () => this.scene.start('FarmScene'));
    this.createRoundedButton(cx, 580, 400, 90, 'БОССЫ', 0xcc3333, () => this.scene.start('BossListScene'));
    this.createRoundedButton(cx, 710, 400, 90, 'МАГАЗИН', 0xaa66ff, () => this.scene.start('ShopScene'));
    this.createRoundedButton(cx, 840, 400, 90, 'БОНУС', 0xffaa22, () => this.scene.start('DailyBonusScene'));

    // Кнопка сброса
    const reset = this.add.text(20, 1230, 'RESET', { fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: {x:5, y:5} });
    reset.setInteractive();
    reset.on('pointerdown', () => { Save.reset(); this.scene.restart(); });
  }

  createTopPanel() {
    const x = 460;
    const w = 240;
    const h = 60;
    
    // Плашка для Фузов
    let g1 = this.add.graphics();
    g1.fillStyle(0x000000, 0.6);
    g1.fillRoundedRect(x, 20, w, h, 15);
    g1.lineStyle(2, 0xffcc66, 0.8);
    g1.strokeRoundedRect(x, 20, w, h, 15);
    
    // Иконка и текст фузов (пока текст, потом заменим на иконку)
    this.add.text(x + 20, 50, '💰', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 50, `${Save.getFuzz()}`, { fontSize: '28px', color: '#ffcc66', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);

    // Плашка для Аптечек
    let g2 = this.add.graphics();
    g2.fillStyle(0x000000, 0.6);
    g2.fillRoundedRect(x, 90, w, h, 15);
    g2.lineStyle(2, 0xff4444, 0.8);
    g2.strokeRoundedRect(x, 90, w, h, 15);
    
    // Иконка и текст аптечек
    this.add.text(x + 20, 120, '💊', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 120, `${Save.getMedkits()}`, { fontSize: '28px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  createRoundedButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.8); // Полупрозрачный фон
    bg.fillRoundedRect(-width/2, -height/2, width, height, 20);
    bg.lineStyle(4, 0xffffff, 0.5);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);

    const label = this.add.text(0, 0, text, {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive();

    // Анимация нажатия
    container.on('pointerdown', () => {
      container.setScale(0.95);
      onClick();
    });
    container.on('pointerup', () => container.setScale(1));
    container.on('pointerout', () => container.setScale(1));
  }
}
