import { Save } from '../data/save.js';
import { Effects } from '../utils/effects.js';
import { VERSION } from '../version.js';

export default class HubScene extends Phaser.Scene {
  constructor() { super({ key: 'HubScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.image(W/2, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W/2, H/2, W, H, 0x1e3799, 0.6);

    this.createTopPanel(W, H);

    this.add.text(W/2, H * 0.2, 'РЕЖИМЫ ИГРЫ', { fontSize: '32px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    const modesY = H * 0.38;
    const modesH = H * 0.26;
    this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(W/2 - 220, modesY - modesH/2, 440, modesH, 30).lineStyle(3, 0xffffff, 0.3).strokeRoundedRect(W/2 - 220, modesY - modesH/2, 440, modesH, 30);

    this.createCandyButton(W/2, modesY - 65, 360, 80, 'БЕСКОНЕЧНЫЙ', 0x2ecc71, '∞', () => this.scene.start('FarmScene'));
    this.createCandyButton(W/2, modesY + 65, 360, 80, 'БОССЫ', 0xe74c3c, '👹', () => this.scene.start('BossListScene'));

    this.add.graphics().fillStyle(0xffffff, 0.5).fillRect(W/2 - 160, H * 0.56, 320, 2);

    this.createCandyButton(W/2, H * 0.63, 360, 80, 'МАГАЗИН', 0x9b59b6, '🛒', () => this.scene.start('ShopScene'));
    this.createCandyButton(W/2, H * 0.75, 360, 80, 'ИНФОРМАЦИЯ', 0x3498db, 'ℹ️', () => this.scene.start('InfoScene'));
    this.createCandyButton(W/2, H * 0.87, 360, 80, 'БОНУС', 0xf1c40f, '🎁', () => this.scene.start('DailyBonusScene'));

    this.createSaveLoadButton(80, H * 0.04);

    this.add.text(15, H - 15, `v${VERSION}`, {
      fontSize: '14px', color: '#cccccc', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 1).setDepth(1000);
  }

  createSaveLoadButton(x, y) {
    const btn = this.add.container(x, y).setDepth(1000);
    const bg = this.add.graphics().fillStyle(0x3498db, 1).fillRoundedRect(-40, -28, 80, 56, 15)
      .lineStyle(3, 0xffffff, 0.6).strokeRoundedRect(-40, -28, 80, 56, 15);
    const icon = this.add.text(0, 0, '💾', { fontSize: '32px' }).setOrigin(0.5);
    btn.add([bg, icon]);
    btn.setSize(80, 56).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { btn.y += 4; });
    btn.on('pointerup', () => {
      btn.y -= 4;
      Effects.click(this);
      this.scene.start('SaveLoadScene');
    });
    btn.on('pointerout', () => { btn.y = y; });
  }

  createTopPanel(W, H) {
    const x = W - 280, w = 260, h = 60;
    const startY = H * 0.03;

    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, startY, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, startY, w, h, 20);
    this.add.image(x + 40, startY + 30, 'icon_fuz').setDisplaySize(35, 35);
    this.add.text(x + 80, startY + 30, `${Save.getFuzz()}`, { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);

    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, startY + 70, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, startY + 70, w, h, 20);
    this.add.image(x + 40, startY + 100, 'icon_medkit').setDisplaySize(35, 35);
    this.add.text(x + 80, startY + 100, `${Save.getMedkits()}`, { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);

    let antiCount = Save.getAntitoxins ? Save.getAntitoxins() : 0;
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(x, startY + 140, w, h, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(x, startY + 140, w, h, 20);
    this.add.image(x + 40, startY + 170, 'icon_antitoksin').setDisplaySize(35, 35);
    this.add.text(x + 80, startY + 170, `${antiCount}`, { fontSize: '28px', color: '#00f0ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);
  }

  createCandyButton(x, y, width, height, text, color, icon, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(15, 0, text, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const icn = this.add.text(-width/2 + 40, 0, icon, { fontSize: '28px' }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt, icn]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
