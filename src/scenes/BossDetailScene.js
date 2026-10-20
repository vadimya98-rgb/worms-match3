import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossDetailScene' });
  }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    
    // Массив для хранения ID выбранных персонажей (максимум 2)
    this.selectedChars = []; 
  }

  create() {
    // Кнопка Назад
    const backBtn = this.add.text(30, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 }
    }).setOrigin(0, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('BossListScene'));

    // Информация о боссе
    this.add.text(360, 150, this.boss.name, { fontSize: '48px', color: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(360, 220, `Уровень: ${this.boss.level} | HP: ${this.boss.maxHp}`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(360, 280, `Награда: ${this.boss.reward} Фузов`, { fontSize: '28px', color: '#ffcc66' }).setOrigin(0.5);
    
    this.add.text(360, 350, this.boss.description, { fontSize: '24px', color: '#aaaaaa', align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5);

    // Разделитель
    this.add.rectangle(360, 420, 600, 2, 0x444488);

    // Заголовок выбора персонажей
    this.add.text(360, 460, 'ВЫБЕРИТЕ ДВУХ ПЕРСОНАЖЕЙ', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);

    // Отрисовка доступных персонажей
    this.renderCharacterSelection();

    // Кнопка "В БОЙ"
    this.startBtn = this.add.text(360, 1150, 'В БОЙ', {
      fontSize: '48px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 80, y: 20 }
    }).setOrigin(0.5);
    this.startBtn.setInteractive();
    
    this.startBtn.on('pointerdown', () => {
      // Проверяем, выбрано ли ровно 2 персонажа
      if (this.selectedChars.length === 2) {
        // Передаем массив выбранных персонажей в сцену боя (пока заглушка, сделаем в 5Б)
        // this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: this.selectedChars });
        console.log('Готов к бою с:', this.selectedChars);
      }
    });
  }

  // ==========================================
  // ВЫБОР ПЕРСОНАЖЕЙ
  // ==========================================

  renderCharacterSelection() {
    const startY = 540;
    const spacing = 130;
    let yOffset = 0;

    // Проходим по всем персонажам
    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      
      // Показываем только купленных персонажей
      if (!state.owned) return;

      const y = startY + yOffset;
      yOffset += spacing;

      // Фон карточки
      const bg = this.add.rectangle(360, y, 600, 110, 0x222244).setStrokeStyle(2, 0x6666aa);
      
      // Имя и уровень
      this.add.text(80, y - 20, `${char.name} (Ур. ${state.level})`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
      
      // HP
      const hp = getCharacterMaxHp(char.id, state.level);
      this.add.text(80, y + 20, `HP: ${hp}`, { fontSize: '22px', color: '#aaaaaa' }).setOrigin(0, 0.5);

      // Индикатор выбора (кружок справа)
      const indicator = this.add.circle(600, y, 25, 0x333366).setStrokeStyle(2, 0xffffff);
      
      // Если персонаж уже выбран, закрашиваем индикатор зеленым
      if (this.selectedChars.includes(char.id)) {
        indicator.setFillStyle(0x33cc66);
      }

      // Клик по карточке
      bg.setInteractive();
      bg.on('pointerdown', () => {
        const index = this.selectedChars.indexOf(char.id);
        
        if (index > -1) {
          // Если уже выбран, убираем из выбора
          this.selectedChars.splice(index, 1);
          indicator.setFillStyle(0x333366);
        } else {
          // Если не выбран, но уже есть 2, ничего не делаем
          if (this.selectedChars.length >= 2) return;
          
          // Добавляем в выбор
          this.selectedChars.push(char.id);
          indicator.setFillStyle(0x33cc66);
        }

        // Обновляем кнопку "В БОЙ"
        this.updateStartButton();
      });
    });
  }

  // Меняет цвет и активность кнопки "В БОЙ"
  updateStartButton() {
    if (this.selectedChars.length === 2) {
      this.startBtn.setBackgroundColor('#22aa44'); // Зеленая
    } else {
      this.startBtn.setBackgroundColor('#555555'); // Серая
    }
  }
}
