import { Save } from '../data/save.js';

export default class DailyBonusScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DailyBonusScene' });
  }

  create() {
    // Фон и затемнение
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.6);

    // Радужная неоновая рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.4).strokeRect(8, 8, 704, 1264);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.8).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    // 1. Получаем текущую дату по МСК
    this.todayDate = this.getMskDate();
    this.lastClaimDate = Save.data.player.lastDailyBonusDay;
    this.streak = Save.data.player.dailyStreak;

    // 2. Высчитываем статус
    this.canClaim = (this.todayDate !== this.lastClaimDate);
    this.currentRewardDay = this.canClaim 
      ? (this.lastClaimDate === null ? 1 : (this.streak % 7) + 1) 
      : (this.streak === 0 ? 1 : this.streak);

    // Если игрок пропустил день, сбрасываем стрик на 1
    if (this.canClaim && this.lastClaimDate !== null && !this.isYesterday(this.lastClaimDate)) {
      this.currentRewardDay = 1;
      this.streak = 0; 
    }

    this.buildUI();
  }

  // ==========================================
  // ЛОГИКА ДАТ
  // ==========================================
  getMskDate() {
    const date = new Date();
    const mskString = date.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const mskDate = new Date(mskString);
    const y = mskDate.getFullYear();
    const m = String(mskDate.getMonth() + 1).padStart(2, '0');
    const d = String(mskDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isYesterday(dateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yString = yesterday.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const yDate = new Date(yString);
    const y = yDate.getFullYear();
    const m = String(yDate.getMonth() + 1).padStart(2, '0');
    const d = String(yDate.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
  }

  // ==========================================
  // ИНТЕРФЕЙС
  // ==========================================
  buildUI() {
    const cx = 360;

    // Кнопка НАЗАД (слева)
    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x333366, 0.8).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('HubScene'));

    // Заголовок
    this.add.text(cx, 130, 'ЕЖЕДНЕВНЫЙ БОНУС', { fontSize: '36px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);

    const rewards = [
      { type: 'fuzz', amount: 100, label: '100 💰' },
      { type: 'medkit', amount: 1, label: '1 💊' },
      { type: 'fuzz', amount: 200, label: '200 💰' },
      { type: 'medkit', amount: 2, label: '2 💊' },
      { type: 'fuzz', amount: 300, label: '300 💰' },
      { type: 'medkit', amount: 3, label: '3 💊' },
      { type: 'fuzz', amount: 1000, label: '1000 💰!' }
    ];

    // Отрисовка сетки (3 ряда по 2, и 1 широкий)
    const startY = 240;
    const spacingY = 130;
    const spacingX = 150;
    
    for (let i = 0; i < 7; i++) {
      const day = i + 1;
      const isLast = (day === 7);
      
      let x, y, cardW, cardH;
      if (isLast) {
        x = cx; y = startY + 3 * spacingY; cardW = 340; cardH = 100;
      } else {
        const row = Math.floor(i / 2);
        const col = i % 2;
        x = col === 0 ? cx - 110 : cx + 110;
        y = startY + row * spacingY;
        cardW = 200; cardH = 100;
      }

      const reward = rewards[i];
      
      // Определяем стиль (Неон)
      let bgColor = 0x111122;
      let borderColor = 0x444488;
      
      if (day < this.currentRewardDay || (day === this.currentRewardDay && !this.canClaim)) {
        bgColor = 0x112211; // Темно-зеленый
        borderColor = 0x22aa44; // Неоновый зеленый
      } else if (day === this.currentRewardDay && this.canClaim) {
        bgColor = 0x332200; // Темно-желтый
        borderColor = 0xffcc00; // Неоновый желтый
      }

      // Рисуем карточку
      const g = this.add.graphics();
      g.fillStyle(bgColor, 0.8).fillRoundedRect(x - cardW/2, y, cardW, cardH, 15);
      g.lineStyle(4, borderColor, 1).strokeRoundedRect(x - cardW/2, y, cardW, cardH, 15);

      // Текст "День N"
      this.add.text(x, y + 25, `День ${day}`, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      
      // Награда
      this.add.text(x, y + 65, reward.label, { fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

      // Если сегодняшний день, добавляем пульсацию
      if (day === this.currentRewardDay && this.canClaim) {
        this.tweens.add({
          targets: g,
          alpha: 0.6,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    // КНОПКА ЗАБРАТЬ
    const claimBtnY = 1000;
    const btnContainer = this.add.container(cx, claimBtnY);
    
    const btnColor = this.canClaim ? 0x22aa44 : 0x555555;
    const btnBg = this.add.graphics()
      .fillStyle(btnColor, 0.8)
      .fillRoundedRect(-160, -40, 320, 80, 20)
      .lineStyle(4, 0xffffff, 0.5)
      .strokeRoundedRect(-160, -40, 320, 80, 20);

    const btnText = this.add.text(0, 0, this.canClaim ? 'ЗАБРАТЬ' : 'УЖЕ ПОЛУЧЕНО', {
      fontSize: '36px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(320, 80);

    if (this.canClaim) {
      btnContainer.setInteractive();
      btnContainer.on('pointerdown', () => {
        btnContainer.setScale(0.95);
        this.claimReward(rewards[this.currentRewardDay - 1]);
      });
      btnContainer.on('pointerup', () => btnContainer.setScale(1));
    }
  }

  // ==========================================
  // ПОЛУЧЕНИЕ НАГРАДЫ
  // ==========================================
  claimReward(reward) {
    // Выдаем награду
    if (reward.type === 'fuzz') {
      Save.addFuzz(reward.amount);
    } else if (reward.type === 'medkit') {
      Save.addMedkits(reward.amount);
    }

    // Обновляем данные
    Save.data.player.lastDailyBonusDay = this.todayDate;
    Save.data.player.dailyStreak = this.currentRewardDay;
    Save.flush();

    // Красивая вспышка и переход
    this.cameras.main.flash(500, 255, 255, 255);
    
    this.time.delayedCall(600, () => {
      this.scene.start('HubScene');
    });
  }
}
