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
    // Фон
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    const backBtn = this.add.text(30, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('BossListScene'));

    this.add.text(360, 150, this.boss.name, { 
      fontSize: '48px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 
    }).setOrigin(0.5);
    this.add.text(360, 220, `Уровень: ${this.boss.level} | HP: ${this.boss.maxHp}`, { 
      fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);
    this.add.text(360, 280, `Награда: ${this.boss.reward} Фузов`, { 
      fontSize: '28px', color: '#ffcc66', stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);
    
    this.add.text(360, 350, this.boss.description, { 
      fontSize: '24px', color: '#ffffff', align: 'center', wordWrap: { width: 600 }, stroke: '#000000', strokeThickness: 4 
    }).setOrigin(0.5);

    this.add.rectangle(360, 420, 600, 2, 0xffffff);

    this.add.text(360, 460, 'ВЫБЕРИТЕ ДО ДВУХ ПЕРСОНАЖЕЙ', { 
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
    const startY = 540;
    const spacing = 130;
    let yOffset = 0;

    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const y = startY + yOffset;
      yOffset += spacing;

      const bg = this.add.rectangle(360, y, 600, 110, 0x222244).setStrokeStyle(2, 0x6666aa);
      
      this.add.text(80, y - 20, `${char.name} (Ур. ${state.level})`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
      
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
