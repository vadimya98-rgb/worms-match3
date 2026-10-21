import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { Effects } from '../utils/effects.js';

export default class BossListScene extends Phaser.Scene {
  constructor() { super({ key: 'BossListScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.isDragging = false;
    this.moved = false;
    this.startY = 0;
    this.startMapY = 0;

    this.add.image(W/2, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W/2, H/2, W, H, 0x1e3799, 0.6);

    this.add.text(W/2, H * 0.06, 'КАРТА БОССОВ', { fontSize: '44px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    this.createCandyButton(100, H * 0.06, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));

    this.mapContainer = this.add.container(0, 0);
    
    const maskShape = this.make.graphics();
    maskShape.fillRect(0, H * 0.1, W, H * 0.9); 
    const mask = maskShape.createGeometryMask();
    this.mapContainer.setMask(mask);

    this.renderBossMap(W, H);
    this.setupScroll(W, H);
    this.setupClick(W, H);
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
    container.on('pointerup', () => { container.y -= 4; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }

  renderBossMap(W, H) {
    this.startMapY = H * 0.15;
    const spacingY = 220;
    this.bossPositions = [];

    BOSSES.forEach((boss, index) => {
      let x = W/2;
      if (index % 4 === 0) x = W * 0.3; 
      if (index % 4 === 1) x = W * 0.7; 
      if (index % 4 === 2) x = W * 0.5; 
      if (index % 4 === 3) x = W * 0.3; 

      const y = this.startMapY + index * spacingY;
      this.bossPositions.push({ x, y, index });
      
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
        let prevX = W * 0.5;
        if ((index - 1) % 4 === 0) prevX = W * 0.3;
        if ((index - 1) % 4 === 1) prevX = W * 0.7;
        if ((index - 1) % 4 === 2) prevX = W * 0.5;
        if ((index - 1) % 4 === 3) prevX = W * 0.3;
        
        let prevY = this.startMapY + (index - 1) * spacingY;
        const line = this.add.line(0, 0, prevX, prevY, x, y, 0x00f0ff, 0.6).setOrigin(0, 0).setLineWidth(6);
        this.mapContainer.add(line);
      }

      this.mapContainer.add([shadow, g, innerGlow, bossImg, nameText]);
    });
  }

  getBossStatus(index) {
    const boss = BOSSES[index];
    if (Save.data.bosses[boss.id] === 'defeated') return 'defeated';
    if (index === 0) return 'available';
    if (Save.data.bosses[BOSSES[index - 1].id] === 'defeated') return 'available';
    return 'locked';
  }

  setupScroll(W, H) {
    this.input.on('pointerdown', (p) => {
      if (p.y < H * 0.1) return;
      this.startY = p.y;
      this.mapY = this.mapContainer.y;
      this.isDragging = true;
      this.moved = false;
    });

    this.input.on('pointermove', (p) => {
      if (this.isDragging) {
        let diff = p.y - this.startY;
        if (Math.abs(diff) > 10) this.moved = true;
        
        if (this.moved) {
          let newY = this.mapY + diff;
          const totalMapHeight = this.startMapY + (BOSSES.length * 220);
          let minScroll = -(totalMapHeight - H * 0.9); 
          
          if (newY > 0) newY = 0;
          if (newY < minScroll) newY = minScroll;
          this.mapContainer.y = newY;
        }
      }
    });

    this.input.on('pointerup', () => { this.isDragging = false; });
  }

  setupClick(W, H) {
    this.input.on('pointerup', (p) => {
      if (this.moved || p.y < H * 0.1) return;
      let localY = p.y - this.mapContainer.y;

      this.bossPositions.forEach((pos) => {
        let dist = Phaser.Math.Distance.Between(p.x, localY, pos.x, pos.y);
        
        if (dist < 75) {
          const status = this.getBossStatus(pos.index);
          if (status !== 'locked') {
            Effects.click(this);
            this.time.delayedCall(100, () => this.scene.start('BossDetailScene', { bossIndex: pos.index }));
          } else {
            Effects.error(this);
          }
        }
      });
    });
  }
}
