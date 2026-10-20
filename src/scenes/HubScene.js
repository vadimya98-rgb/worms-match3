import { Save } from '../data/save.js';

export default class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.4);

    this.createRainbowBorder();
    this.createTopPanel();

    const cx = this.scale.width / 2;

    this.add.text(cx, 220, 'MATCH-WORMIKS', {
      fontSize: '56px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5);

    this.createNeonButton(cx, 480, 400, 90, 'ФАРМ', 0x22aa44, () => this.scene.start('FarmScene'));
    this.createNeonButton(cx, 620, 400, 90, 'БОССЫ', 0xcc3333, () => this.scene.start('BossListScene'));
    this.createNeonButton(cx, 760, 400, 90, 'МАГАЗИН', 0xaa66ff, () => this.scene.start('ShopScene'));
    this.createNeonButton(cx, 900, 400, 90, 'БОНУС', 0xffaa22, () => this.scene.start('DailyBonusScene'));

    const reset = this.add.text(20, 1230, 'RESET', { fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: {x:5, y:5} });
    reset.setInteractive();
    reset.on('pointerdown', () => { Save.reset(); this.scene.restart(); });
  }

  // РАДУЖНАЯ НЕОНОВАЯ РАМКА
  createRainbowBorder() {
    this.borderGraphics = this.add.graphics();
    this.borderColors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ccff, 0x6600ff, 0xff00ff];
    this.colorIndex = 0;

    this.time.addEvent({
      delay: 150,
      callback: () => {
        this.borderGraphics.clear();
        let c1 = this.borderColors[this.colorIndex % this.borderColors.length];
        let c2 = this.borderColors[(this.colorIndex + 1) % this.borderColors.length];
        
        // Рисуем свечение (несколько слоев)
        for(let i=0; i<3; i++) {
            this.borderGraphics.lineStyle(4 + i*4, i%2===0 ? c1 : c2, 0.3 - i*0.1);
            this.borderGraphics.strokeRect(10, 10, 700, 1260);
        }
        this.borderGraphics.lineStyle(4, 0xffffff, 0.8);
        this.borderGraphics.strokeRect(10, 10, 700, 1260);

        this.colorIndex++;
      },
      loop: true
    });
  }

  createTopPanel() {
    const x = 460, w = 240, h = 60;
    
    let g1 = this.add.graphics();
    g1.fillStyle(0x000000, 0.6); g1.fillRoundedRect(x, 20, w, h, 15);
    g1.lineStyle(2, 0xffcc66, 1); g1.strokeRoundedRect(x, 20, w, h, 15);
    this.add.text(x + 20, 50, '💰', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 50, `${Save.getFuzz()}`, { fontSize: '28px', color: '#ffcc66', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);

    let g2 = this.add.graphics();
    g2.fillStyle(0x000000, 0.6); g2.fillRoundedRect(x, 90, w, h, 15);
    g2.lineStyle(2, 0xff4444, 1); g2.strokeRoundedRect(x, 90, w, h, 15);
    this.add.text(x + 20, 120, '💊', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.add.text(x + 70, 120, `${Save.getMedkits()}`, { fontSize: '28px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  // УНИВЕРСАЛЬНАЯ НЕОНОВАЯ КНОПКА
  createNeonButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    
    // Свечение (Glow)
    bg.lineStyle(12, color, 0.2); bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);
    bg.lineStyle(6, color, 0.5); bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);
    // Основа
    bg.fillStyle(0x000000, 0.6); bg.fillRoundedRect(-width/2, -height/2, width, height, 20);
    bg.lineStyle(2, 0xffffff, 0.8); bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);

    const label = this.add.text(0, 0, text, { fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive();
    container.on('pointerdown', () => { container.setScale(0.95); onClick(); });
    container.on('pointerup', () => container.setScale(1));
    container.on('pointerout', () => container.setScale(1));
  }
}
