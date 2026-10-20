import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';

export default class BossListScene extends Phaser.Scene {
  constructor() { super({ key: 'BossListScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1a0b2e, 0.8);

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({ delay: 100, callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.8).strokeRect(8, 8, 704, 1264);
    }, loop: true });

    this.add.text(360, 100, 'КАРТА БОССОВ', { fontSize: '44px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    // Кнопка Назад (3D)
    this.create3DButton(100, 50, 140, 50, '← НАЗАД', 0x3498db, () => this.scene.start('HubScene'));

    this.renderBossMap();
  }

  create3DButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 8, width, height, 20);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 20);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.2).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, { fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => container.y += 4);
    container.on('pointerup', () => { container.y -= 4; onClick(); });
    container.on('pointerout', () => container.y = y);
    return container;
  }

  renderBossMap() {
    const startY = 260;
    const spacingY = 220;

    BOSSES.forEach((boss, index) => {
      let x = 360;
      if (index === 0) x = 200; if (index === 1) x = 520; if (index === 2) x = 360; if (index === 3) x = 200;
      const y = startY + index * spacingY;
      const status = this.getBossStatus(index);

      let color = 0x555555; // Закрыт
      if (status === 'available') color = 0xff003c; // Доступен (Красный)
      if (status === 'defeated') color = 0x00ff9d; // Пройден (Зеленый)

      // Подложка-круг с тенью
      const shadow = this.add.circle(x, y + 8, 70, 0x000000, 0.8);
      const g = this.add.circle(x, y, 70, 0x1a0b2e).setStrokeStyle(8, color);
      
      // Внутренний блик
      const innerGlow = this.add.circle(x, y, 70).setStrokeStyle(2, 0xffffff, 0.5);

      const bossImg = this.add.image(x, y, 'boss' + index).setDisplaySize(100, 100);
      if (status === 'locked') bossImg.setTint(0x555555).setAlpha(0.5);

      this.add.text(x, y + 100, boss.name, { fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

      // Линии между боссами
      if (index > 0) {
        let prevX = index - 1 === 0 ? 200 : (index - 1 === 1 ? 520 : (index - 1 === 2 ? 360 : 200));
        let prevY = startY + (index - 1) * spacingY;
        const line = this.add.line(0, 0, prevX, prevY, x, y, 0x00f0ff, 0.5).setOrigin(0, 0).setLineWidth(6);
        line.setDepth(-1); // Отправляем линии на задний план
      }

      const zone = this.add.zone(x, y, 140, 140).setInteractive();
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
