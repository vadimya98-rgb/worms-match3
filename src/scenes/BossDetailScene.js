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
    this.selectedChars = []; 
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5); // Затемнение фона

    const backBtn = this.add.text(30, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('BossListScene'));

    // КАРТИНКА БОССА НА ЭКРАНЕ ВЫБОРА
    const bossImg = this.add.image(360, 200, 'boss' + this.bossIndex);
    bossImg.setDisplaySize(180, 180);

    this.add.text(360, 330, this.boss.name, { 
      fontSize: '48px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 
    }).setOrigin(0.5);
    this.add.text(360, 390, `Уровень: ${this.boss.level} | HP: ${this.boss.maxHp}${this.boss.armor ? ` | Броня: ${this.boss.armor}` : ''}`, { 
      fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);
    this.add.text(360, 440, `Награда: ${this.boss.reward} Фузов`, { 
      fontSize: '24px', color: '#ffcc66', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);
    
    this.add.text(360, 490, this.boss.description, { 
      fontSize: '22px', color: '#ffffff', align: 'center', wordWrap: { width: 600 }, stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);

    this.add.rectangle(360, 530, 600, 2, 0xffffff);

    this.add.text(360, 570, 'ВЫБЕРИТЕ ДО ДВУХ ПЕРСОНАЖЕЙ', { 
      fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);

    this.renderCharacterSelection();

    this.startBtn = this.add.text(360, 1150, 'В БОЙ', {
      fontSize: '48px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 80, y: 20 },
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    this.startBtn.setInteractive();
    
    this.startBtn.on('pointerdown', () => {
      if (this.selectedChars.length >= 1) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: this.selectedChars });
      }
    });
  }

  renderCharacterSelection() {
    const startY = 640;
    const spacing = 120;
    let yOffset = 0;

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const y = startY + yOffset;
      yOffset += spacing;

      const bg = this.add.rectangle(360, y, 600, 100, 0x222244, 0.9).setStrokeStyle(2, 0x6666aa);
      
      this.add.text(80, y - 15, `${char.name} (Ур. ${state.level})`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
      
      const hp = getCharacterMaxHp(char.id, state.level);
      this.add.text(80, y + 20, `HP: ${hp}`, { fontSize: '22px', color: '#aaaaaa' }).setOrigin(0, 0.5);

      const indicator = this.add.circle(600, y, 25, 0x333366).setStrokeStyle(2, 0xffffff);
      
      if (this.selectedChars.includes(char.id)) indicator.setFillStyle(0x33cc66);

      bg.setInteractive();
      bg.on('pointerdown', () => {
        const index = this.selectedChars.indexOf(char.id);
        if (index > -1) {
          this.selectedChars.splice(index, 1);
          indicator.setFillStyle(0x333366);
        } else {
          if (this.selectedChars.length >= 2) return;
          this.selectedChars.push(char.id);
          indicator.setFillStyle(0x33cc66);
        }
        this.updateStartButton();
      });
    });
  }

  updateStartButton() {
    if (this.selectedChars.length >= 1) {
      this.startBtn.setBackgroundColor('#22aa44');
    } else {
      this.startBtn.setBackgroundColor('#555555');
    }
  }
}
