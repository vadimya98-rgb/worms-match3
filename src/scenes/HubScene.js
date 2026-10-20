import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() { super({ key: 'HubScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.createTopPanel();

    const cx = 360;
    this.add.text(cx, 350, 'РЕЖИМЫ ИГРЫ', { fontSize: '32px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(140, 390, 440, 260, 30).lineStyle(3, 0xffffff, 0.3).strokeRoundedRect(140, 390, 440, 260, 30);
    
    this.createCandyButton(cx, 470, 360, 80, 'ФАРМ', 0x2ecc71, '🌾', () => this.scene.start('FarmScene'));
    this.createCandyButton(cx, 580, 360, 80, 'БОССЫ', 0xe74c3c, '👹', () => this.scene.start('BossListScene'));

    this.add.graphics().fillStyle(0xffffff, 0.5).fillRect(200, 710, 320, 2);

    this.createCandyButton(cx, 800, 360, 80, 'МАГАЗИН', 0x9b59b6, '🛒', () => this.scene.start('ShopScene'));
    this.createCandyButton(cx, 910, 360, 80, 'БОНУС', 0xf1c40f, '🎁', () => this.scene.start('DailyBonusScene'));
  }

  createTopPanel() {
    const x = 440, w = 260, h = 60;
    
    // Фузы
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, 20, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, 20, w, h, 20);
    this.add.image(x + 40, 50, 'icon_fuz').setDisplaySize(35, 35);
    this.add.text(x + 80, 50, `${Save.getFuzz()}`, { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);

    // Аптечки
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, 90, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, 90, w, h, 20);
    this.add.image(x + 40, 120, 'icon_medkit').setDisplaySize(35, 35);
    this.add.text(x + 80, 120, `${Save.getMedkits()}`, { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);

    // Антитоксины
    let antiCount = Save.getAntitoxins ? Save.getAntitoxins() : 0;
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, 160, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, 160, w, h, 20);
    this.add.image(x + 40, 190, 'icon_antitoksin').setDisplaySize(35, 35);
    this.add.text(x + 80, 190, `${antiCount}`, { fontSize: '28px', color: '#00f0ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);
  }

  createCandyButton(x, y, width, height, text, color, icon, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(15, 0, text, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const icn = this.add.text(-width/2 + 45, 0, icon, { fontSize: '32px' }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt, icn]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
