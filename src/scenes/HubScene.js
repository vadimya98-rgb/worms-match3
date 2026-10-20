import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create() {
    const cx = this.scale.width / 2;

    // Верхняя панель с валютой
    this.buildHud();

    // Название
    this.add.text(cx, 200, 'MATCH-WORMIKS', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Кнопки режимов и разделов
    // Кнопка ФАРМ теперь ведет на FarmScene
    this.makeButton(cx, 480, 'ФАРМ', '#22aa44', () => this.scene.start('FarmScene'));
    
    // Остальные кнопки пока ведут на заглушку
    // Было: this.makeButton(cx, 640, 'БОССЫ', '#cc3333', () => this.openStub('Боссы'));
// Стало:
this.makeButton(cx, 640, 'БОССЫ', '#cc3333', () => this.scene.start('BossListScene'));
    // Было: this.makeButton(cx, 860, 'МАГАЗИН', '#aa66ff', () => this.openStub('Магазин'));
// Стало:
this.makeButton(cx, 860, 'МАГАЗИН', '#aa66ff', () => this.scene.start('ShopScene'));
    this.makeButton(cx, 1000, 'ЕЖЕДНЕВНЫЙ БОНУС', '#ffaa22', () => this.openStub('Бонус'));

    // Кнопка сброса сохранения (для отладки)
    const reset = this.add.text(20, 1230, 'RESET SAVE', {
      fontSize: '18px',
      color: '#666666',
    });
    reset.setInteractive();
    reset.on('pointerdown', () => {
      Save.reset();
      this.scene.restart();
    });
  }

  // Рисует верхнюю панель с текущими фузами и аптечками
  buildHud() {
    this.add.rectangle(360, 60, 720, 100, 0x000022);

    this.add.text(30, 60, `Фузы: ${Save.getFuzz()}`, {
      fontSize: '28px',
      color: '#ffcc66',
    }).setOrigin(0, 0.5);

    this.add.text(690, 60, `Аптечки: ${Save.getMedkits()}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(1, 0.5);
  }

  // Универсальный хелпер создания кнопки-текста
  makeButton(x, y, label, color, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '48px',
      color: '#ffffff',
      backgroundColor: color,
      padding: { x: 60, y: 24 },
    }).setOrigin(0.5);
    
    btn.setInteractive();
    btn.on('pointerdown', onClick);
    
    return btn;
  }

  // Заглушка для еще не реализованных экранов
  openStub(name) {
    this.scene.start('StubScene', { from: 'HubScene', name });
  }
}
