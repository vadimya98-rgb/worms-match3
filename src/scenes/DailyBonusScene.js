import { Save } from '../data/save.js';

export default class DailyBonusScene extends Phaser.Scene {
  constructor() { super({ key: 'DailyBonusScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.todayDate = this.getMskDate();
    this.lastClaimDate = Save.data.player.lastDailyBonusDay;
    this.streak = Save.data.player.dailyStreak;
    this.canClaim = (this.todayDate !== this.lastClaimDate);
    this.currentRewardDay = this.canClaim ? (this.lastClaimDate === null ? 1 : (this.streak % 7) + 1) : (this.streak === 0 ? 1 : this.streak);

    if (this.canClaim && this.lastClaimDate !== null && !this.isYesterday(this.lastClaimDate)) {
      this.currentRewardDay = 1; this.streak = 0; 
    }

    this.buildUI();
  }

  getMskDate() {
    const date = new Date(); const mskString = date.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const mskDate = new Date(mskString); const y = mskDate.getFullYear();
    const m = String(mskDate.getMonth() + 1).padStart(2, '0'); const d = String(mskDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isYesterday(dateStr) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yString = yesterday.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const yDate = new Date(yString); const y = yDate.getFullYear();
    const m = String(yDate.getMonth() + 1).padStart(2, '0'); const d = String(yDate.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
  }

  buildUI() {
    const cx = 360;

    // Кнопка Назад
    this.createCandyButton(100, 50, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));

    this.add.text(cx, 130, 'ЕЖЕДНЕВНЫЙ БОНУС', { fontSize: '36px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    const rewards = [
      { type: 'fuzz', amount: 100, label: '100 💰' }, { type: 'medkit', amount: 1, label: '1 💊' },
      { type: 'fuzz', amount: 200, label: '200 💰' }, { type: 'medkit', amount: 2, label: '2 💊' },
      { type: 'fuzz', amount: 300, label: '300 💰' }, { type: 'medkit', amount: 3, label: '3 💊' },
      { type: 'fuzz', amount: 1000, label: '1000 💰!' }
    ];

    const startY = 240, spacingY = 130;
    
    for (let i = 0; i < 7; i++) {
      const day = i + 1;
      const isLast = (day === 7);
      let x, y, cardW, cardH;
      
      if (isLast) { x = cx; y = startY + 3 * spacingY; cardW = 340; cardH = 100; }
      else { const row = Math.floor(i / 2), col = i % 2; x = col === 0 ? cx - 110 : cx + 110; y = startY + row * spacingY; cardW = 200; cardH = 100; }

      const reward = rewards[i];
      
      // Стили карточек (3D плитки)
      let bgColor = 0x2c3e50; // Темный (закрыт)
      let borderColor = 0x34495e;
      
      if (day < this.currentRewardDay || (day === this.currentRewardDay && !this.canClaim)) {
        bgColor = 0x27ae60; // Зеленый (получен)
        borderColor = 0x2ecc71;
      } else if (day === this.currentRewardDay && this.canClaim) {
        bgColor = 0xd35400; // Оранжевый (доступен)
        borderColor = 0xf39c12;
      }

      // Тень
      this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(x - cardW/2, y + 5, cardW, cardH, 20);
      // Фон
      const g = this.add.graphics().fillStyle(bgColor, 1).fillRoundedRect(x - cardW/2, y, cardW, cardH, 20).lineStyle(3, borderColor, 1).strokeRoundedRect(x - cardW/2, y, cardW, cardH, 20);

      this.add.text(x, y + 25, `День ${day}`, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.add.text(x, y + 65, reward.label, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

      // Пульсация текущего дня
      if (day === this.currentRewardDay && this.canClaim) {
        this.tweens.add({ targets: g, alpha: 0.8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

    // Кнопка ЗАБРАТЬ
    this.createCandyButton(cx, 1000, 320, 80, this.canClaim ? 'ЗАБРАТЬ' : 'ПОЛУЧЕНО', this.canClaim ? 0x2ecc71 : 0x7f8c8d, () => {
      if (this.canClaim) this.claimReward(rewards[this.currentRewardDay - 1]);
    });
  }

  claimReward(reward) {
    if (reward.type === 'fuzz') Save.addFuzz(reward.amount);
    else if (reward.type === 'medkit') Save.addMedkits(reward.amount);

    Save.data.player.lastDailyBonusDay = this.todayDate;
    Save.data.player.dailyStreak = this.currentRewardDay;
    Save.flush();

    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(600, () => this.scene.start('HubScene'));
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height);
    if (onClick) {
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => { container.y += 5; });
      container.on('pointerup', () => { container.y -= 5; onClick(); });
      container.on('pointerout', () => { container.y = y; });
    }
  }
}
