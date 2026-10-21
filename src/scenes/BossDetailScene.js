import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';
import { Effects } from '../utils/effects.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = [null, null]; 
    this.menuOpen = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.image(cx, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(cx, H/2, W, H, 0x1e3799, 0.7);

    this.createCandyButton(100, H * 0.05, 140, 50, '←', 0x3498db, () => this.scene.start('BossListScene'));

    this.add.image(cx, H * 0.15, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(cx, H * 0.26, this.boss.name, { fontSize: '48px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    const descBg = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(cx - 200, H * 0.3, 400, 120, 20).lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(cx - 200, H * 0.3, 400, 120, 20);
    this.add.text(cx, H * 0.33, this.boss.description, { fontSize: '18px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);
    this.add.text(cx, H * 0.37, `Награда: ${this.boss.reward} Фузов`, { fontSize: '22px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.add.text(cx, H * 0.44, 'ВЫБЕРИТЕ БОЙЦОВ', { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    this.slotContainers = [];
    this.createSlot(cx - 110, H * 0.53, 0);
    this.createSlot(cx + 110, H * 0.53, 1);

    this.createCandyButton(cx, H * 0.85, 300, 80, 'В БОЙ', 0x00ff9d, () => {
      const team = this.selectedChars.filter(id => id !== null);
      if (team.length > 0) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: team });
      }
    });
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; Effects.click(this); this.time.delayedCall(50, onClick); });
    container.on('pointerout', () => { container.y = y; });
    return container;
  }

  createSlot(x, y, index) {
    const container = this.add.container(x, y);
    const bg = this.add.circle(0, 0, 75, 0x2c3e50).setStrokeStyle(6, 0xffffff, 0.5);
    container.add(bg);
    const plus = this.add.text(0, 0, '+', { fontSize: '60px', color: '#7f8c8d', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(plus);
    const zone = this.add.zone(0, 0, 150, 150).setInteractive({ useHandCursor: true });
    container.add(zone);
    zone.on('pointerup', () => this.openCharSelect(index, container, bg, plus));
    this.slotContainers[index] = container;
  }

  openCharSelect(slotIndex, slotContainer, slotBg, plusIcon) {
    if (this.menuOpen) return;
    this.menuOpen = true;
    Effects.click(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const overlay = this.add.rectangle(cx, H/2, W, H, 0x000000, 0.9).setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 1).fillRoundedRect(cx - 280, H * 0.15, 560, 700, 30).lineStyle(4, 0x3498db, 1).strokeRoundedRect(cx - 280, H * 0.15, 560, 700, 30);
    const title = this.add.text(cx, H * 0.18, 'ВЫБЕРИТЕ БОЙЦА', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);

    const listContainer = this.add.container(0, 0).setDepth(102);
    const maskShape = this.make.graphics();
    maskShape.fillRect(cx - 280, H * 0.22, 560, 560);
    const mask = maskShape.createGeometryMask();
    listContainer.setMask(mask);

    const elements = [overlay, panel, title, listContainer];

    let dragStartY = 0;
    let listStartY = 0;
    let isDragging = false;

    const dragMove = (p) => {
        if (!this.menuOpen) return;
        if (Math.abs(p.y - dragStartY) > 10) isDragging = true;
        if (isDragging) {
            let newY = listStartY + (p.y - dragStartY);
            let minScroll = -(CHARACTERS.length * 130 - 500);
            if (newY > 0) newY = 0;
            if (newY < minScroll) newY = minScroll;
            listContainer.y = newY;
        }
    };

    const dragStart = (p) => {
        if (!this.menuOpen) return;
        dragStartY = p.y;
        listStartY = listContainer.y;
        isDragging = false;
    };

    const dragEnd = () => { isDragging = false; };

    this.input.on('pointerdown', dragStart);
    this.input.on('pointermove', dragMove);
    this.input.on('pointerup', dragEnd);

    const closeMenu = () => {
        this.menuOpen = false;
        this.input.off('pointerdown', dragStart);
        this.input.off('pointermove', dragMove);
        this.input.off('pointerup', dragEnd);
        elements.forEach(el => el.destroy());
    };

    let y = H * 0.25;

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const isAlreadySelected = this.selectedChars.includes(char.id);
      const btnColor = isAlreadySelected ? 0x333333 : 0x2c3e50;

      const btnBg = this.add.graphics()
        .fillStyle(btnColor, 1).fillRoundedRect(cx - 240, y, 480, 110, 20)
        .lineStyle(3, isAlreadySelected ? 0x555555 : 0x00ff9d, 1).strokeRoundedRect(cx - 240, y, 480, 110, 20);
      
      const avatarBg = this.add.circle(cx - 180, y + 55, 40, 0x000000);
      const avatarImg = this.add.image(cx - 180, y + 55, char.id).setDisplaySize(70, 70);
      const charName = this.add.text(cx - 110, y + 30, char.name, { fontSize: '26px', color: isAlreadySelected ? '#777' : '#fff', fontStyle: 'bold' });
      const charHp = this.add.text(cx - 110, y + 70, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: isAlreadySelected ? '#555' : '#00ff9d' });

      listContainer.add([btnBg, avatarBg, avatarImg, charName, charHp]);

      const zone = this.add.zone(cx, y + 55, 480, 110).setInteractive();
      let startX = 0, startY = 0;
      zone.on('pointerdown', (p) => { startX = p.x; startY = p.y; });
      zone.on('pointerup', (p) => {
        if (!this.menuOpen) return;
        let dist = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
        if (dist < 15) {
            Effects.click(this);
            if (isAlreadySelected) {
                this.selectedChars[slotIndex] = null;
                plusIcon.setVisible(true);
                slotBg.setStrokeStyle(6, 0xffffff, 0.5);
                slotContainer.list.forEach(child => { if (child.texture) child.destroy(); });
            } else {
                this.selectedChars[slotIndex] = char.id;
                plusIcon.setVisible(false);
                slotBg.setStrokeStyle(6, 0x2ecc71); 
                const img = this.add.image(0, 0, char.id).setDisplaySize(110, 110);
                slotContainer.add(img);
            }
            closeMenu();
        }
      });
      listContainer.add(zone);

      y += 130;
    });

    const cancelBtn = this.add.text(cx, H * 0.85, 'ОТМЕНА', { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerup', () => { Effects.click(this); closeMenu(); });
    elements.push(cancelBtn);
  }
}
