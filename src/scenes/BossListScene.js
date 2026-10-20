import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';

export default class BossListScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossListScene' });
  }

  create() {
    // Фон
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    this.add.rectangle(360, 60, 720, 100, 0x000022, 0.8);
    this.add.text(30, 60, `Фузы: ${Save.getFuzz()}`, { 
      fontSize: '28px', color: '#ffcc66', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0, 0.5);

    const backBtn = this.add.text(690, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(1, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));

    this.add.text(360, 150, 'КАРТА БОССОВ', { 
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 
    }).setOrigin(0.5);

    this.renderBossMap();
  }

  renderBossMap() {
    const startY = 280;
    const spacingY = 220; // Чуть уменьшил, чтобы 4 босса влезли на экран

    BOSSES.forEach((boss, index) => {
      let x = 360;
      // Зигзаг для 4-х боссов: влево, вправо, по центру, влево
      if (index === 0) x = 200;
      if (index === 1) x = 520;
      if (index === 2) x = 360;
      if (index === 3) x = 200;
      
      const y = startY + index * spacingY;

      const status = this.getBossStatus(index);

      let color = 0x555555;
      if (status === 'available') color = 0xff3333;
      if (status === 'defeated') color = 0x33cc66;

      const circle = this.add.circle(x, y, 60, color).setStrokeStyle(4, 0xffffff);
      circle.setInteractive();

      this.add.text(x, y, `${index + 1}`, { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, y + 80, boss.name, { 
        fontSize: '24px', color: '#ffffff', align: 'center', wordWrap: { width: 200 }, stroke: '#000000', strokeThickness: 4 
      }).setOrigin(0.5);

      if (index > 0) {
        let prevX = 360;
        if (index - 1 === 0) prevX = 200;
        if (index - 1 === 1) prevX = 520;
        if (index - 1 === 2) prevX = 360;
        let prevY = startY + (index - 1) * spacingY;
        this.add.line(0, 0, prevX, prevY, x, y, 0xffffff).setOrigin(0, 0).setLineWidth(4);
      }

      circle.on('pointerdown', () => {
        if (status === 'locked') return;
        this.scene.start('BossDetailScene', { bossIndex: index });
      });
    });
  }

  getBossStatus(index) {
    const boss = BOSSES[index];
    if (Save.data.bosses[boss.id] === 'defeated') return 'defeated';
    if (index === 0) return 'available';
    const prevBoss = BOSSES[index - 1];
    if (Save.data.bosses[prevBoss.id] === 'defeated') return 'available';
    return 'locked';
  }
}
