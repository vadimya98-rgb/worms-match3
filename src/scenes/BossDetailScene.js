import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = []; 
    this.charUIElements = []; // Для обновления кружков выбора
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.6);

    // Рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.4).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    // Кнопка Назад
    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x333366, 0.8).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('BossListScene'));

    this.add.image(360, 180, 'boss' + this.bossIndex).setDisplaySize(160, 160);
    this.add.text(360, 290, this.boss.name, { fontSize: '48px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    // Описание в зеленой рамке
    const descBg = this.add.graphics().fillStyle(0x000000, 0.6).fillRoundedRect(160, 340, 400, 90, 20).lineStyle(4, 0x22aa44, 1).strokeRoundedRect(160, 340, 400, 90, 20);
    this.add.text(360, 385, this.boss.description, { fontSize: '20px', color: '#fff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

    this.add.text(360, 480, 'ВЫБЕРИТЕ ПЕРСОНАЖЕЙ', { fontSize: '24px', color: '#aaa', fontStyle: 'bold' }).setOrigin(0.5);

    // Отрисовка карточек
    let y = 540;
    CHARACTERS.forEach(char => {
      const state = Save.getCharacter(char.id);
      if (!state.owned) return;

      const cardBg = this.add.graphics().fillStyle(0x222244, 0.8).fillRoundedRect(160, y, 400, 90, 15);
      cardBg.lineStyle(3, 0x444488, 1).strokeRoundedRect(160, y, 400, 90, 15);
      
      this.add.text(200, y + 30, `${char.name} (Ур. ${state.level})`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(200, y + 60, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '18px', color: '#aaa' }).setOrigin(0, 0.5);

      const indicator = this.add.circle(520, y + 45, 20, 0x333366).setStrokeStyle(2, 0xffffff);

      // Кнопка-зона на всю карточку
      const zone = this.add.zone(360, y + 45, 400, 90).setInteractive();
      zone.on('pointerdown', () => {
        const idx = this.selectedChars.indexOf(char.id);
        if (idx > -1) {
          this.selectedChars.splice(idx, 1);
          indicator.setFillStyle(0x333366);
          cardBg.clear().fillStyle(0x222244, 0.8).fillRoundedRect(160, y, 400, 90, 15).lineStyle(3, 0x444488, 1).strokeRoundedRect(160, y, 400, 90, 15);
        } else {
          if (this.selectedChars.length >= 2) return;
          this.selectedChars.push(char.id);
          indicator.setFillStyle(0x33cc66);
          cardBg.clear().fillStyle(0x222244, 0.8).fillRoundedRect(160, y, 400, 90, 15).lineStyle(3, 0x33cc66, 1).strokeRoundedRect(160, y, 400, 90, 15);
        }
      });

      y += 110;
    });

    // Кнопка В БОЙ
    const startBtn = this.add.container(360, 1150);
    const sBg = this.add.graphics().fillStyle(0x22aa44, 0.8).fillRoundedRect(-150, -40, 300, 80, 20).lineStyle(4, 0xffffff, 0.6).strokeRoundedRect(-150, -40, 300, 80, 20);
    startBtn.add([sBg, this.add.text(0, 0, 'В БОЙ', { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)]);
    startBtn.setSize(300, 80).setInteractive();

    startBtn.on('pointerdown', () => {
      if (this.selectedChars.length >= 1) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: this.selectedChars });
      }
    });
  }
}
