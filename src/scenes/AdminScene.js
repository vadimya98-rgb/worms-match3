import { Save } from '../data/save.js';

export default class AdminScene extends Phaser.Scene {
  constructor() { super({ key: 'AdminScene' }); }

  create() {
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.95);
    
    const panel = this.add.graphics().fillStyle(0x1a1a2e, 1).fillRoundedRect(100, 200, 520, 800, 30).lineStyle(4, 0xff003c, 1).strokeRoundedRect(100, 200, 520, 800, 30);
    
    this.add.text(360, 260, '👑 АДМИН ПАНЕЛЬ', { fontSize: '36px', color: '#ff003c', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    const btnAddFuzz = this.createAdminBtn(360, 380, '+ 10 000 Фузов', 0x2ecc71, () => {
        Save.addFuzz(10000);
        this.scene.restart(); // Перезапускаем сцену для обновления (хотя тут не нужно)
    });
    
    this.createAdminBtn(360, 480, '+ 50 Аптечек', 0x3498db, () => {
        Save.addMedkits(50);
    });
    
    this.createAdminBtn(360, 580, '+ 50 Антитоксинов', 0x9b59b6, () => {
        Save.addAntitoxins(50);
    });

    this.createAdminBtn(360, 680, 'Разблокировать Всех', 0xf1c40f, () => {
        Save.ownCharacter('cat');
        Save.ownCharacter('robot');
        Save.ownCharacter('zombie');
    });

    this.createAdminBtn(360, 780, 'Сбросить прогресс', 0xe74c3c, () => {
        Save.reset();
        this.scene.start('BootScene');
    });

    const backBtn = this.add.container(360, 900);
    const bBg = this.add.graphics().fillStyle(0x7f8c8d, 1).fillRoundedRect(-100, -30, 200, 60, 15);
    backBtn.add([bBg, this.add.text(0, 0, 'НАЗАД', { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(200, 60).setInteractive().on('pointerdown', () => this.scene.start('ShopScene'));
  }

  createAdminBtn(x, y, text, color, onClick) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-200, -35, 400, 70, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(-200, -35, 400, 70, 20);
    const txt = this.add.text(0, 0, text, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(400, 70).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { btn.y += 4; onClick(); });
    btn.on('pointerup', () => btn.y -= 4);
    btn.on('pointerout', () => btn.y = y);
  }
}
