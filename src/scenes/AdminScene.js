import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { Effects } from '../utils/effects.js';

export default class AdminScene extends Phaser.Scene {
  constructor() { super({ key: 'AdminScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.rectangle(cx, H/2, W, H, 0x000000, 0.95);
    this.add.graphics().fillStyle(0x1a1a2e, 1).fillRoundedRect(cx - 260, H * 0.1, 520, 800, 30).lineStyle(4, 0xff003c, 1).strokeRoundedRect(cx - 260, H * 0.1, 520, 800, 30);
    
    this.add.text(cx, H * 0.15, '👑 АДМИН ПАНЕЛЬ', { fontSize: '36px', color: '#ff003c', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    this.createAdminBtn(cx, H * 0.25, '+ 10 000 Фузов', 0x2ecc71, () => { Save.addFuzz(10000); this.scene.restart(); });
    this.createAdminBtn(cx, H * 0.35, '+ 50 Аптечек', 0x3498db, () => { Save.addMedkits(50); this.scene.restart(); });
    this.createAdminBtn(cx, H * 0.45, '+ 50 Антитоксинов', 0x9b59b6, () => { Save.addAntitoxins(50); this.scene.restart(); });
    this.createAdminBtn(cx, H * 0.55, 'Открыть Всех Персонажей', 0xf1c40f, () => { Save.ownCharacter('cat'); Save.ownCharacter('robot'); Save.ownCharacter('zombie'); Save.ownCharacter('rabit'); Save.ownCharacter('demon'); this.scene.restart(); });
    this.createAdminBtn(cx, H * 0.65, 'Открыть Всех Боссов', 0xff9900, () => { BOSSES.forEach(boss => { Save.data.bosses[boss.id] = 'defeated'; }); Save.flush(); this.scene.restart(); });
    this.createAdminBtn(cx, H * 0.75, 'Сбросить прогресс', 0xe74c3c, () => { Save.reset(); this.scene.start('BootScene'); });

    const backBtn = this.add.container(cx, H * 0.85);
    const bBg = this.add.graphics().fillStyle(0x7f8c8d, 1).fillRoundedRect(-100, -30, 200, 60, 15);
    backBtn.add([bBg, this.add.text(0, 0, 'НАЗАД', { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(200, 60).setInteractive().on('pointerup', () => { Effects.click(this); this.time.delayedCall(100, () => this.scene.start('ShopScene')); });
  }

  createAdminBtn(x, y, text, color, onClick) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-200, -35, 400, 70, 20).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(-200, -35, 400, 70, 20);
    const txt = this.add.text(0, 0, text, { fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(400, 70).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { btn.y += 4; });
    btn.on('pointerup', () => { btn.y -= 4; Effects.click(this); onClick(); });
    btn.on('pointerout', () => btn.y = y);
  }
}
