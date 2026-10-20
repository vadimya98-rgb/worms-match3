import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create() {
    // Фон
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    const cx = this.scale.width / 2;

    // Верхняя панель с валютой
    this.buildHud();

    // Название (добавил обводку для читаемости)
    this.add.text(cx, 200, 'MATCH-WORMIKS', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Кнопки режимов и разделов
    this.makeButton(cx, 480, 'ФАРМ', '#22aa44', () => this.scene.start('FarmScene'));
    this.makeButton(cx, 640, 'БОССЫ', '#cc3333', () => this.scene.start('BossListScene'));
    this.makeButton(cx, 860, 'МАГАЗИН', '#aa66ff', () => this.scene.start('ShopScene'));
    this.makeButton(cx, 1000, 'ЕЖЕДНЕВНЫЙ БОНУС', '#ffaa22', () => this.scene.start('DailyBonusScene'));

    // Кнопка сброса сохранения (для отладки)
    const reset = this.add.text(20, 1230, 'RESET SAVE', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 5, y: 5 }
    });
    reset.setInteractive();
    reset.on('pointerdown', () => {
      Save.reset();
      this.scene.restart();
    });
  }

  buildHud() {
    // Полупрозрачная подложка под HUD
    this.add.rectangle(360, 60, 720, 100, 0x000022, 0.8);

    this.add.text(30, 60, `Фузы: ${Save.getFuzz()}`, {
      fontSize: '28px',
      color: '#ffcc66',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    this.add.text(690, 60, `Аптечки: ${Save.getMedkits()}`, {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0.5);
  }

  makeButton(x, y, label, color, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '48px',
      color: '#ffffff',
      backgroundColor: color,
      padding: { x: 60, y: 24 },
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    btn.setInteractive();
    btn.on('pointerdown', onClick);
    return btn;
  }
}
