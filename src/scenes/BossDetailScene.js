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
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.7);

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({ delay: 100, callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.6).strokeRect(8, 8, 704, 1264);
    }, loop: true });

    // Кнопка Назад
    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('BossListScene'));

    // Босс
    this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(360, 300, this.boss.name, { fontSize: '48px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    // Описание
    const descBg = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(160, 360, 400, 90, 20).lineStyle(4, 0x2ecc71, 1).strokeRoundedRect(160, 360, 400, 90, 20);
    this.add.text(360, 405, this.boss.description, { fontSize: '20px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

    this.add.text(360, 490, 'ВЫБЕРИТЕ БОЙЦОВ', { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    // Слоты выбора (Круглые)
    this.slotContainers = [];
    this.createSlot(250, 600, 0);
    this.createSlot(470, 600, 1);

    // Кнопка В БОЙ
    const startBtn = this.add.container(360, 1100);
    const sBg = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(-150, -40, 300, 80, 30).lineStyle(6, 0xffffff, 1).strokeRoundedRect(-150, -40, 300, 80, 30);
    startBtn.add([sBg, this.add.text(0, 0, 'В БОЙ', { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5)]);
    startBtn.setSize(300, 80).setInteractive();
    startBtn.on('pointerdown', () => {
      const team = this.selectedChars.filter(id => id !== null);
      if (team.length >= 1) this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: team });
    });
  }

  createSlot(x, y, index) {
    const container = this.add.container(x, y);
    
    // Круглая подложка
    const bg = this.add.circle(0, 0, 75, 0x2c3e50).setStrokeStyle(6, 0x3498db);
    container.add(bg);

    // Плюсик по центру
    const plus = this.add.text(0, 0, '+', { fontSize: '60px', color: '#7f8c8d', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(plus);

    const zone = this.add.zone(0, 0, 150, 150).setInteractive();
    container.add(zone);

    zone.on('pointerdown', () => this.openCharSelect(index, container));
    this.slotContainers[index] = container;
  }

  openCharSelect(slotIndex, slotContainer) {
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.9).setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101).fillStyle(0x1a1a2e, 1).fillRoundedRect(80, 200, 560, 880, 30).lineStyle(4, 0x3498db, 1).strokeRoundedRect(80, 200, 560, 880, 30);
    const title = this.add.text(360, 260, 'ВЫБЕРИТЕ БОЙЦА', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);

    let y = 340;
    const elements = [overlay, panel, title];

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const isAlreadySelected = this.selectedChars.includes(char.id);
      const btnColor = isAlreadySelected ? 0x444444 : 0x2c3e50;

      // Карточка
      const btnBg = this.add.graphics().setDepth(102)
        .fillStyle(btnColor, 1).fillRoundedRect(120, y, 480, 110, 20)
        .lineStyle(3, isAlreadySelected ? 0x555555 : 0x2ecc71, 1).strokeRoundedRect(120, y, 480, 110, 20);
      
      // Круглая аватарка
      const avatarBg = this.add.circle(180, y + 55, 40, 0x000000).setDepth(102);
      const avatarImg = this.add.image(180, y + 55, char.id).setDisplaySize(70, 70).setDepth(103);

      const charName = this.add.text(250, y + 30, char.name, { fontSize: '26px', color: isAlreadySelected ? '#777' : '#fff', fontStyle: 'bold' }).setDepth(102);
      const charHp = this.add.text(250, y + 70, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: isAlreadySelected ? '#555' : '#2ecc71' }).setDepth(102);

      elements.push(btnBg, avatarBg, avatarImg, charName, charHp);

      if (!isAlreadySelected) {
        const zone = this.add.zone(360, y + 55, 480, 110).setDepth(103).setInteractive();
        zone.on('pointerdown', () => {
          this.selectedChars[slotIndex] = char.id;
          
          // Очищаем слот и ставим картинку в круг
          slotContainer.removeAll(true);
          const newBg = this.add.circle(0, 0, 75, 0x1a1a2e).setStrokeStyle(6, 0x2ecc71);
          const img = this.add.image(0, 0, char.id).setDisplaySize(110, 110);
          
          // Делаем картинку круглой с помощью маски
          const maskShape = this.make.graphics();
          maskShape.fillCircle(x = slotContainer.x, y = slotContainer.y, 75);
          const mask = maskShape.createGeometryMask();
          img.setMask(mask);

          slotContainer.add([newBg, img]);
          
          elements.forEach(el => el.destroy());
        });
        elements.push(zone);
      }

      y += 130;
    });

    const cancelBtn = this.add.text(360, 1020, 'ОТМЕНА', { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerdown', () => elements.forEach(el => el.destroy()));
    elements.push(cancelBtn);
  }
}
