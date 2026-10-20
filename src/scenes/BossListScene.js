import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';

export default class BossListScene extends Phaser.Scene {
  constructor() { super({ key: 'BossListScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5);

    // Радужная рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 150,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 5000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.5).strokeRect(10, 10, 700, 1260);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.8).strokeRect(10, 10, 700, 1260);
      }, loop: true
    });

    this.add.text(360, 100, 'КАРТА БОССОВ', { fontSize: '48px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    // Кнопка НАЗАД (стилизованная)
    this.createBackButton();

    this.renderBossMap();
  }

  createBackButton() {
    const btn = this.add.container(100, 50);
    const bg = this.add.graphics();
    bg.fillStyle(0x333366, 0.8); bg.fillRoundedRect(-70, -25, 140, 50, 15);
    bg.lineStyle(2, 0xffffff, 0.5); bg.strokeRoundedRect(-70, -25, 140, 50, 15);
    const txt = this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(140, 50).setInteractive();
    btn.on('pointerdown', () => this.scene.start('HubScene'));
  }

  renderBossMap() {
    const startY = 260;
    const spacingY = 240;

    BOSSES.forEach((boss, index) => {
      let x = 360;
      if (index === 0) x = 200; if (index === 1) x = 520; if (index === 2) x = 360; if (index === 3) x = 200;
      const y = startY + index * spacingY;
      const status = this.getBossStatus(index);

      let color = 0x555555;
      if (status === 'available') color = 0xff2222;
      if (status === 'defeated') color = 0x22ff22;

      // Неоновый круг
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.7); g.fillCircle(x, y, 75);
      g.lineStyle(10, color, 0.3); g.strokeCircle(x, y, 75); // Свечение
      g.lineStyle(4, color, 1); g.strokeCircle(x, y, 75);    // Контур
      
      const bossImg = this.add.image(x, y, 'boss' + index);
      bossImg.setDisplaySize(100, 100);
      if (status === 'locked') bossImg.setTint(0x555555);

      this.add.text(x, y + 100, boss.name, { fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

      const zone = this.add.zone(x, y, 150, 150).setInteractive();
      zone.on('pointerdown', () => {
        if (status !== 'locked') this.scene.start('BossDetailScene', { bossIndex: index });
      });
    });
  }

  getBossStatus(index) {
    const boss = BOSSES[index];
    if (Save.data.bosses[boss.id] === 'defeated') return 'defeated';
    if (index === 0) return 'available';
    if (Save.data.bosses[BOSSES[index - 1].id] === 'defeated') return 'available';
    return 'locked';
  }
}
