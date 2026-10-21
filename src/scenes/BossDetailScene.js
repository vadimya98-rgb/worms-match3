import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = [null, null]; 
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.7);

    this.createCandyButton(100, 50, 140, 50, '←', 0x3498db, () => this.scene.start('BossListScene'));

    this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(360, 300, this.boss.name, { fontSize: '48px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    const descBg = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(160, 350, 400, 120, 20).lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(160, 350, 400, 120, 20);
    this.add.text(360, 385, this.boss.description, { fontSize: '18px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);
    this.add.text(360, 435, `Награда: ${this.boss.reward} Фузов`, { fontSize: '22px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.add.text(360, 520, 'ВЫБЕРИТЕ БОЙЦОВ', { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    this.slotContainers = [];
    this.createSlot(250, 630, 0);
    this.createSlot(470, 630, 1);

    this.createCandyButton(360, 1100, 300, 80, 'В БОЙ', 0x00ff9d, () => {
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
    container.on('pointerup', () => { container.y -= 5; this.time.delayedCall(50, onClick); });
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
    zone.on('pointerdown', () => this.openCharSelect(index, container, bg, plus));
    this.slotContainers[index] = container;
  }

  openCharSelect(slotIndex, slotContainer, slotBg, plusIcon) {
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.9).setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 1).fillRoundedRect(80, 200, 560, 800, 30).lineStyle(4, 0x3498db, 1).strokeRoundedRect(80, 200, 560, 800, 30);
    const title = this.add.text(360, 250, 'ВЫБЕРИТЕ БОЙЦА', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);

    const listContainer = this.add.container(0, 0).setDepth(102);
    const maskShape = this.make.graphics();
    maskShape.fillRect(80, 290, 560, 620);
    const mask = maskShape.createGeometryMask();
    listContainer.setMask(mask);

    let y = 320;
    const elements = [overlay, panel, title];

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const isAlreadySelected = this.selectedChars.includes(char.id);
      const btnColor = isAlreadySelected ? 0x333333 : 0x2c3e50;

      const btnBg = this.add.graphics()
        .fillStyle(btnColor, 1).fillRoundedRect(120, y, 480, 110, 20)
        .lineStyle(3, isAlreadySelected ? 0x555555 : 0x00ff9d, 1).strokeRoundedRect(120, y, 480, 110, 20);
      
      const avatarBg = this.add.circle(180, y + 55, 40, 0x000000);
      const avatarImg = this.add.image(180, y + 55, char.id).setDisplaySize(70, 70);
      const charName = this.add.text(250, y + 30, char.name, { fontSize: '26px', color: isAlreadySelected ? '#777' : '#fff', fontStyle: 'bold' });
      const charHp = this.add.text(250, y + 70, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: isAlreadySelected ? '#555' : '#00ff9d' });

      listContainer.add([btnBg, avatarBg, avatarImg, charName, charHp]);

      const zone = this.add.zone(360, y + 55, 480, 110).setInteractive();
      zone.on('pointerup', () => { // ИСПОЛЬЗУЕМ UP, ЧТОБЫ НЕ КОНФЛИКТОВАТЬ СО СВАЙПОМ
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
        this.time.delayedCall(10, () => { elements.forEach(el => el.destroy()); listContainer.destroy(); });
      });
      listContainer.add(zone);

      y += 130;
    });

    // СКРОЛЛ ПОВЕШЕН НА ПАНЕЛЬ, А НЕ НА НЕВИДИМУЮ ЗОНУ
    let startY = 0, startListY = 0, isDragging = false, moved = false;
    
    panel.setInteractive(new Phaser.Geom.Rectangle(80, 200, 560, 800), Phaser.Geom.Rectangle.Contains); // Делаем панель кликабельной для скролла

    panel.on('pointerdown', (p) => {
        startY = p.y; startListY = listContainer.y; isDragging = true; moved = false;
    });
    panel.on('pointermove', (p) => {
        if (isDragging) {
            let diff = p.y - startY;
            if (Math.abs(diff) > 10) moved = true;
            if (moved) {
                let newY = startListY + diff;
                let minScroll = -(CHARACTERS.length * 130 - 580); 
                if (newY > 0) newY = 0;
                if (newY < minScroll) newY = minScroll;
                listContainer.y = newY;
            }
        }
    });
    panel.on('pointerup', () => { isDragging = false; });

    const cancelBtn = this.add.text(360, 950, 'ОТМЕНА', { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerup', () => {
        this.time.delayedCall(10, () => { elements.forEach(el => el.destroy()); listContainer.destroy(); });
    });
    elements.push(cancelBtn);
  }
}
