import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';

export default class BossListScene extends Phaser.Scene {
  constructor() { super({ key: 'BossListScene' }); }

  create() {
    this.isDragging = false;
    this.moved = false;
    this.startY = 0;
    this.startMapY = 0;

    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.add.text(360, 60, 'КАРТА БОССОВ', { fontSize: '44px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    this.createCandyButton(100, 50, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));

    this.mapContainer = this.add.container(0, 0);
    
    const maskShape = this.make.graphics();
    maskShape.fillRect(0, 100, 720, 1180); 
    const mask = maskShape.createGeometryMask();
    this.mapContainer.setMask(mask);

    this.renderBossMap();
    this.setupScroll();
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 6, width, height, 15);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 15);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 10);
    const txt = this.add.text(0, 0, text, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 4; });
    container.on('pointerup', () => { container.y -= 4; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }

  renderBossMap() {
    const startY = 200;
    const spacingY = 220;

    BOSSES.forEach((boss, index) => {
      let x = 360;
      if (index % 4 === 0) x = 200; 
      if (index % 4 === 1) x = 520; 
      if (index % 4 === 2) x = 360; 
      if (index % 4 === 3) x = 200; 

      const y = startY + index * spacingY;
      const status = this.getBossStatus(index);

      let color = 0x7f8c8d; 
      if (status === 'available') color = 0xe74c3c; 
      if (status === 'defeated') color = 0x2ecc71; 

      const shadow = this.add.circle(x, y + 8, 75, 0x000000, 0.5);
      const g = this.add.circle(x, y, 75, 0x2c3e50).setStrokeStyle(8, color);
      const innerGlow = this.add.circle(x, y, 70).setStrokeStyle(2, 0xffffff, 0.4);

      const bossImg = this.add.image(x, y, 'boss' + index).setDisplaySize(110, 110);
      if (status === 'locked') bossImg.setTint(0x555555).setAlpha(0.7);

      const nameText = this.add.text(x, y + 105, boss.name, { fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

      if (index > 0) {
        let prevX = 360;
        if ((index - 1) % 4 === 0) prevX = 200;
        if ((index - 1) % 4 === 1) prevX = 520;
        if ((index - 1) % 4 === 2) prevX = 360;
        if ((index - 1) % 4 === 3) prevX = 200;
        
        let prevY = startY + (index - 1) * spacingY;
        const line = this.add.line(0, 0, prevX, prevY, x, y, 0x00f0ff, 0.6).setOrigin(0, 0).setLineWidth(6);
        this.mapContainer.add(line);
      }

      this.mapContainer.add([shadow, g, innerGlow, bossImg, nameText]);

      const zone = this.add.zone(x, y, 150, 150).setInteractive();
      
      // ИСПРАВЛЕНИЕ: Слушаем отпускание пальца, чтобы свайп не срабатывал как клик
      zone.on('pointerup', () => {
        if (!this.moved && status !== 'locked') {
          this.scene.start('BossDetailScene', { bossIndex: index });
        }
      });
      
      this.mapContainer.add(zone);
    });
  }

  getBossStatus(index) {
    const boss = BOSSES[index];
    if (Save.data.bosses[boss.id] === 'defeated') return 'defeated';
    if (index === 0) return 'available';
    if (Save.data.bosses[BOSSES[index - 1].id] === 'defeated') return 'available';
    return 'locked';
  }

  setupScroll() {
    this.input.on('pointerdown', (p) => {
      this.startY = p.y;
      this.startMapY = this.mapContainer.y;
      this.isDragging = true;
      this.moved = false;
    });

    this.input.on('pointermove', (p) => {
      if (this.isDragging) {
        let diff = p.y - this.startY;
        // Если палец сдвинулся больше чем на 10 пикселей, это свайп
        if (Math.abs(diff) > 10) this.moved = true;
        
        if (this.moved) {
          let newY = this.startMapY + diff;
          const totalMapHeight = 200 + (BOSSES.length * 220);
          let minScroll = -(totalMapHeight - 1200); 
          
          if (newY > 0) newY = 0;
          if (newY < minScroll) newY = minScroll;
          this.mapContainer.y = newY;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }
}
