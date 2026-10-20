import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = []; 
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.6);

    // Кнопка Назад
    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x333366, 0.8).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('BossListScene'));

    // Босс
    const bossImg = this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(360, 300, this.boss.name, { fontSize: '48px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(360, 350, `Уровень: ${this.boss.level} | HP: ${this.boss.maxHp}`, { fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    // ОПИСАНИЕ В РАМКЕ
    const descBg = this.add.graphics();
    descBg.fillStyle(0x000000, 0.5); descBg.fillRoundedRect(160, 390, 400, 100, 20);
    descBg.lineStyle(4, 0x22aa44, 0.8); descBg.strokeRoundedRect(160, 390, 400, 100, 20); // Зеленая рамка
    this.add.text(360, 440, this.boss.description, { fontSize: '20px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

    this.add.text(360, 530, 'ВЫБЕРИТЕ ПЕРСОНАЖЕЙ', { fontSize: '24px', color: '#aaa', fontStyle: 'bold' }).setOrigin(0.5);

    this.renderCharacterSelection();
    this.createStartButton();
  }

  renderCharacterSelection() {
    let y = 580;
    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const bg = this.add.graphics();
      bg.fillStyle(0x222244, 0.6); bg.fillRoundedRect(160, y, 400, 100, 15);
      const borderColor = this.selectedChars.includes(char.id) ? 0x33cc66 : 0x444488;
      bg.lineStyle(3, borderColor, 1); bg.strokeRoundedRect(160, y, 400, 100, 15);
      
      this.add.text(200, y + 30, `${char.name} (Ур. ${state.level})`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(200, y + 65, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '18px', color: '#aaa' }).setOrigin(0, 0.5);

      const ind = this.add.circle(520, y + 50, 20, this.selectedChars.includes(char.id) ? 0x33cc66 : 0x333366).setStrokeStyle(2, 0xffffff);

      const zone = this.add.zone(360, y + 50, 400, 100).setInteractive();
      zone.on('pointerdown', () => {
        const idx = this.selectedChars.indexOf(char.id);
        if (idx > -1) { this.selectedChars.splice(idx, 1); ind.setFillStyle(0x333366); }
        else { if (this.selectedChars.length >= 2) return; this.selectedChars.push(char.id); ind.setFillStyle(0x33cc66); }
      });

      y += 120;
    });
  }

  createStartButton() {
    const btn = this.add.container(360, 1150);
    const bg = this.add.graphics();
    bg.fillStyle(0x22aa44, 0.8); bg.fillRoundedRect(-150, -40, 300, 80, 20);
    bg.lineStyle(4, 0xffffff, 0.6); bg.strokeRoundedRect(-150, -40, 300, 80, 20);
    
    const txt = this.add.text(0, 0, 'В БОЙ', { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(300, 80).setInteractive();

    btn.on('pointerdown', () => {
      if (this.selectedChars.length >= 1) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: this.selectedChars });
      }
    });
  }
}
