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
    this.add.rectangle(360, 640, 720, 1280, 0x1a0b2e, 0.85); // Темный стильный фон

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({ delay: 100, callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.8).strokeRect(8, 8, 704, 1264);
        this.borderGraphics.lineStyle(2, 0xffffff, 1).strokeRect(8, 8, 704, 1264);
    }, loop: true });

    // Кнопка Назад (3D стиль)
    this.create3DButton(100, 50, 140, 50, '← НАЗАД', 0x3498db, () => this.scene.start('BossListScene'));

    // Босс
    this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(360, 300, this.boss.name, { fontSize: '48px', color: '#ff6b00', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

    // Описание
    const descBg = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(160, 350, 400, 90, 20).lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(160, 350, 400, 90, 20);
    this.add.text(360, 395, this.boss.description, { fontSize: '20px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

    this.add.text(360, 480, 'ВЫБЕРИТЕ БОЙЦОВ', { fontSize: '26px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    // Слоты выбора
    this.slotContainers = [];
    this.createSlot(250, 600, 0);
    this.createSlot(470, 600, 1);

    // Кнопка В БОЙ (3D стиль)
    this.create3DButton(360, 1100, 300, 80, 'В БОЙ', 0x00ff9d, () => {
      const team = this.selectedChars.filter(id => id !== null);
      if (team.length >= 1) this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: team });
    });
  }

  createSlot(x, y, index) {
    const container = this.add.container(x, y);
    
    // Круглая подложка
    const bg = this.add.circle(0, 0, 75, 0x2c3e50).setStrokeStyle(6, 0x00f0ff);
    container.add(bg);

    // Плюсик по центру
    const plus = this.add.text(0, 0, '+', { fontSize: '60px', color: '#7f8c8d', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(plus);

    // Делаем контейнер интерактивным по кругу
    container.setSize(150, 150);
    container.setInteractive(new Phaser.Geom.Circle(75, 75, 75), Phaser.Geom.Circle.Contains);
    
    // Обработчик клика
    container.on('pointerdown', () => {
      this.openCharSelect(index, container, bg, plus);
    });
    
    this.slotContainers[index] = container;
  }

  openCharSelect(slotIndex, slotContainer, slotBg, plusIcon) {
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.9).setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101).fillStyle(0x1a0b2e, 1).fillRoundedRect(80, 200, 560, 880, 30).lineStyle(4, 0x00f0ff, 1).strokeRoundedRect(80, 200, 560, 880, 30);
    const title = this.add.text(360, 260, 'ВЫБЕРИТЕ БОЙЦА', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);

    let y = 340;
    const elements = [overlay, panel, title];

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const isAlreadySelected = this.selectedChars.includes(char.id);
      const btnColor = isAlreadySelected ? 0x333333 : 0x2c3e50;

      // Карточка
      const btnBg = this.add.graphics().setDepth(102)
        .fillStyle(btnColor, 1).fillRoundedRect(120, y, 480, 110, 20)
        .lineStyle(3, isAlreadySelected ? 0x555555 : 0x00ff9d, 1).strokeRoundedRect(120, y, 480, 110, 20);
      
      const avatarBg = this.add.circle(180, y + 55, 40, 0x000000).setDepth(102);
      const avatarImg = this.add.image(180, y + 55, char.id).setDisplaySize(70, 70).setDepth(103);

      const charName = this.add.text(250, y + 30, char.name, { fontSize: '26px', color: isAlreadySelected ? '#777' : '#fff', fontStyle: 'bold' }).setDepth(102);
      const charHp = this.add.text(250, y + 70, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: isAlreadySelected ? '#555' : '#00ff9d' }).setDepth(102);

      elements.push(btnBg, avatarBg, avatarImg, charName, charHp);

      if (!isAlreadySelected) {
        const zone = this.add.zone(360, y + 55, 480, 110).setDepth(103).setInteractive();
        zone.on('pointerdown', () => {
          this.selectedChars[slotIndex] = char.id;
          
          // Обновляем визуал слота
          plusIcon.setVisible(false);
          slotBg.setStrokeStyle(6, 0x00ff9d); // Меняем цвет обводки на зеленый

          // Добавляем картинку персонажа прямо в круг (без масок, чтобы не глючило)
          const img = this.add.image(0, 0, char.id).setDisplaySize(110, 110);
          slotContainer.add(img);
          
          // Закрываем окно
          elements.forEach(el => el.destroy());
        });
        elements.push(zone);
      }

      y += 130;
    });

    const cancelBtn = this.add.text(360, 1020, 'ОТМЕНА', { fontSize: '28px', color: '#ff003c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerdown', () => elements.forEach(el => el.destroy()));
    elements.push(cancelBtn);
  }

  // Универсальная 3D кнопка в стиле Candy Crush
  create3DButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    
    // Тень (нижняя часть кнопки)
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1)
      .fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    
    // Основная часть
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    
    // Блик (сверху для объема)
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.25).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 20);

    // Текст
    const txt = this.add.text(0, 0, text, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // Анимация нажатия
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; onClick(); });
    container.on('pointerout', () => { container.y = y; });
    
    return container;
  }
}
