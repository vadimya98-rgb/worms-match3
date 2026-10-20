import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() { super({ key: 'HubScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5); // Затемнение фона

    this.createRainbowBorder();
    this.createTopPanel();

    const cx = 360;

    // Кнопки режимов (Современный стиль Match-3)
    this.createCandyButton(cx, 450, 400, 90, 'ФАРМ', 0x2ecc71, '🌾', () => this.scene.start('FarmScene'));
    this.createCandyButton(cx, 580, 400, 90, 'БОССЫ', 0xe74c3c, '👹', () => this.scene.start('BossListScene'));
    this.createCandyButton(cx, 710, 400, 90, 'МАГАЗИН', 0x9b59b6, '🛒', () => this.scene.start('ShopScene'));
    this.createCandyButton(cx, 840, 400, 90, 'БОНУС', 0xf1c40f, '🎁', () => this.scene.start('DailyBonusScene'));

    // Кнопка сброса (для тестов)
    const reset = this.add.text(20, 1230, 'RESET', { fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: {x:5, y:5} });
    reset.setInteractive();
    reset.on('pointerdown', () => { Save.reset(); this.scene.restart(); });
  }

  createRainbowBorder() {
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(10, c, 0.6).strokeRect(10, 10, 700, 1260);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.9).strokeRect(10, 10, 700, 1260);
      }, loop: true
    });
  }

  createTopPanel() {
    const x = 460, w = 240, h = 60;
    
    // Панель Фузов
    this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(x, 20, w, h, 20)
        .lineStyle(4, 0xf1c40f, 1).strokeRoundedRect(x, 20, w, h, 20);
    this.add.text(x + 20, 50, '💰', { fontSize: '32px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 50, `${Save.getFuzz()}`, { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);

    // Панель Аптечек
    this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(x, 90, w, h, 20)
        .lineStyle(4, 0xe74c3c, 1).strokeRoundedRect(x, 90, w, h, 20);
    this.add.text(x + 20, 120, '💊', { fontSize: '32px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 120, `${Save.getMedkits()}`, { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  // Стиль "Мятной карамели" (как в топовых играх)
  createCandyButton(x, y, width, height, text, color, icon, onClick) {
    const container = this.add.container(x, y);
    
    // Тень
    const shadow = this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(-width/2 + 5, -height/2 + 10, width, height, 30);
    
    // Основной фон (градиент имитируем двумя слоями)
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 30);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.2).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 20);
    
    // Толстая обводка
    const border = this.add.graphics().lineStyle(6, 0xffffff, 1).strokeRoundedRect(-width/2, -height/2, width, height, 30);

    // Текст и иконка
    const txt = this.add.text(15, 0, text, { fontSize: '38px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const icn = this.add.text(-width/2 + 45, 0, icon, { fontSize: '36px' }).setOrigin(0.5);

    container.add([shadow, bg, highlight, border, txt, icn]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
