import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = [null, null]; // Два слота
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.7);

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.6).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('BossListScene'));

    this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(160, 160);
    this.add.text(360, 290, this.boss.name, { fontSize: '48px', color: '#ff003c', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    const descBg = this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(160, 340, 400, 90, 20).lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(160, 340, 400, 90, 20);
    this.add.text(360, 385, this.boss.description, { fontSize: '20px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

    this.add.text(360, 480, 'ВЫБЕРИТЕ ПЕРСОНАЖЕЙ', { fontSize: '24px', color: '#aaa', fontStyle: 'bold' }).setOrigin(0.5);

    // Слоты для выбора
    this.slotContainers = [];
    this.createSlot(270, 580, 0);
    this.createSlot(450, 580, 1);

    // Кнопка В БОЙ
    const startBtn = this.add.container(360, 1100);
    const sBg = this.add.graphics().fillStyle(0x00ff9d, 0.9).fillRoundedRect(-150, -40, 300, 80, 25);
    startBtn.add([sBg, this.add.text(0, 0, 'В БОЙ', { fontSize: '40px', color: '#1a1a2e', fontStyle: 'bold' }).setOrigin(0.5)]);
    startBtn.setSize(300, 80).setInteractive();

    startBtn.on('pointerdown', () => {
      const team = this.selectedChars.filter(id => id !== null);
      if (team.length >= 1) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: team });
      }
    });
  }

  createSlot(x, y, index) {
    const container = this.add.container(x, y);
    
    // Фон слота
    const bg = this.add.graphics().fillStyle(0x1a1a2e, 0.8).fillRoundedRect(-80, -80, 160, 160, 20);
    bg.lineStyle(4, 0x00f0ff, 0.8).strokeRoundedRect(-80, -80, 160, 160, 20);
    container.add(bg);

    // Крестик (если пусто)
    const cross = this.add.text(0, 0, '+', { fontSize: '64px', color: '#555', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(cross);

    // Зона клика
    const zone = this.add.zone(0, 0, 160, 160).setInteractive();
    container.add(zone);

    zone.on('pointerdown', () => {
      this.openCharSelect(index, container, cross);
    });

    this.slotContainers[index] = { container, cross, isFilled: false };
  }

  openCharSelect(slotIndex, slotContainer, crossIcon) {
    // Затемнение
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.9).setDepth(100).setInteractive();
    
    const panel = this.add.graphics().setDepth(101).fillStyle(0x1a1a2e, 1).fillRoundedRect(100, 200, 520, 880, 30).lineStyle(4, 0x00f0ff, 1).strokeRoundedRect(100, 200, 520, 880, 30);
    
    const title = this.add.text(360, 250, 'ВЫБЕРИТЕ БОЙЦА', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);

    let y = 320;
    const elements = [overlay, panel, title];

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      // Проверка, выбран ли уже этот персонаж в другом слоте
      const isAlreadySelected = this.selectedChars.includes(char.id);

      const btnBg = this.add.graphics().setDepth(102)
        .fillStyle(isAlreadySelected ? 0x333333 : 0x222244, 0.9)
        .fillRoundedRect(140, y, 440, 100, 15)
        .lineStyle(2, isAlreadySelected ? 0x555555 : 0x00ff9d, 0.8)
        .strokeRoundedRect(140, y, 440, 100, 15);
      
      const charName = this.add.text(180, y + 30, char.name, { fontSize: '24px', color: isAlreadySelected ? '#777' : '#fff', fontStyle: 'bold' }).setDepth(102);
      const charHp = this.add.text(180, y + 65, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '18px', color: isAlreadySelected ? '#555' : '#00ff9d' }).setDepth(102);

      elements.push(btnBg, charName, charHp);

      if (!isAlreadySelected) {
        const zone = this.add.zone(360, y + 50, 440, 100).setDepth(103).setInteractive();
        zone.on('pointerdown', () => {
          this.selectedChars[slotIndex] = char.id;
          slotContainer.removeAll(true);
          
          const newBg = this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(-80, -80, 160, 160, 20);
          newBg.lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(-80, -80, 160, 160, 20);
          const img = this.add.image(0, 0, char.id).setDisplaySize(100, 100);
          
          slotContainer.add([newBg, img]);
          
          // Закрываем окно
          elements.forEach(el => el.destroy());
        });
        elements.push(zone);
      }

      y += 120;
    });

    // Кнопка отмены
    const cancelBtn = this.add.text(360, 1000, 'ОТМЕНА', { fontSize: '28px', color: '#ff003c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerdown', () => elements.forEach(el => el.destroy()));
    elements.push(cancelBtn);
  }
}
