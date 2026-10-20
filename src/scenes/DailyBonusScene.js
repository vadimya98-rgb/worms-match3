import { Save } from '../data/save.js';

export default class DailyBonusScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DailyBonusScene' });
  }

  create() {
    // 1. Получаем текущую дату по МСК
    this.todayDate = this.getMskDate();
    this.lastClaimDate = Save.data.player.lastDailyBonusDay;
    this.streak = Save.data.player.dailyStreak;

    // 2. Высчитываем, можно ли сегодня забрать бонус, и какой это будет день
    this.canClaim = (this.todayDate !== this.lastClaimDate);
    
    // Если сегодня уже забирали — показываем текущий стрик. 
    // Если новый день — показываем следующий день (или 1, если стрик был 7).
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

  // Получаем текущую дату строго по Москве в формате YYYY-MM-DD
  getMskDate() {
    const date = new Date();
    // Переводим время в зону Europe/Moscow
    const mskString = date.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const mskDate = new Date(mskString);
    
    const y = mskDate.getFullYear();
    const m = String(mskDate.getMonth() + 1).padStart(2, '0');
    const d = String(mskDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Проверяем, была ли указанная дата вчерашней
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
    const cx = this.scale.width / 2;

    // Заголовок
    this.add.text(cx, 100, 'ЕЖЕДНЕВНЫЙ БОНУС', { fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 160, 'Заходи каждый день и получай награды!', { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0.5);

    // Массив наград для 7 дней
    const rewards = [
      { type: 'fuzz', amount: 100, label: '100 Фузов' },
      { type: 'medkit', amount: 1, label: '1 Аптечка' },
      { type: 'fuzz', amount: 200, label: '200 Фузов' },
      { type: 'medkit', amount: 2, label: '2 Аптечки' },
      { type: 'fuzz', amount: 300, label: '300 Фузов' },
      { type: 'medkit', amount: 3, label: '3 Аптечки' },
      { type: 'fuzz', amount: 1000, label: '1000 Фузов!' }
    ];

    // Отрисовка сетки бонусов (4 строки)
    const startY = 280;
    const spacingY = 150;
    
    for (let i = 0; i < 7; i++) {
      const day = i + 1;
      const row = Math.floor(i / 2);
      const col = i % 2;
      
      // Для 7-го дня делаем одну широкую кнопку по центру
      const isLast = (day === 7);
      const x = isLast ? cx : (col === 0 ? 220 : 500);
      const y = startY + row * spacingY;

      const reward = rewards[i];
      
      // Определяем статус дня
      let bgColor = 0x222244; // Закрыт
      let textColor = '#8888aa';
      let borderColor = 0x444488;

      if (day < this.currentRewardDay || (day === this.currentRewardDay && !this.canClaim)) {
        bgColor = 0x113311; // Уже получен
        textColor = '#33cc66';
        borderColor = 0x33cc66;
      } else if (day === this.currentRewardDay && this.canClaim) {
        bgColor = 0x333311; // Доступен сейчас
        textColor = '#ffcc66';
        borderColor = 0xffcc66;
      }

      // Фон карточки дня
      const cardWidth = isLast ? 500 : 240;
      const bg = this.add.rectangle(x, y, cardWidth, 110, bgColor).setStrokeStyle(3, borderColor);

      // Текст "День N"
      this.add.text(x - (isLast ? 220 : 100), y - 35, `День ${day}`, { fontSize: '24px', color: textColor, fontStyle: 'bold' });
      
      // Иконка и количество
      const icon = reward.type === 'fuzz' ? '💰' : '💊';
      this.add.text(x - (isLast ? 220 : 100), y + 10, `${icon} ${reward.label}`, { fontSize: '22px', color: textColor });
    }

    // Кнопка "ЗАБРАТЬ"
    this.claimBtn = this.add.text(cx, 1000, this.canClaim ? 'ЗАБРАТЬ' : 'УЖЕ ПОЛУЧЕНО', {
      fontSize: '48px', 
      color: '#ffffff', 
      backgroundColor: this.canClaim ? '#22aa44' : '#555555', 
      padding: { x: 80, y: 20 }
    }).setOrigin(0.5);

    if (this.canClaim) {
      this.claimBtn.setInteractive();
      this.claimBtn.on('pointerdown', () => this.claimReward(rewards[this.currentRewardDay - 1]));
    }

    // Кнопка НАЗАД
    const backBtn = this.add.text(360, 1150, '← В МЕНЮ', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 40, y: 15 }
    }).setOrigin(0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));
  }

  // ==========================================
  // ПОЛУЧЕНИЕ НАГРАДЫ
  // ==========================================

  claimReward(reward) {
    this.claimBtn.disableInteractive();

    // Выдаем награду
    if (reward.type === 'fuzz') {
      Save.addFuzz(reward.amount);
    } else if (reward.type === 'medkit') {
      Save.addMedkits(reward.amount);
    }

    // Обновляем данные в сохранении
    Save.data.player.lastDailyBonusDay = this.todayDate;
    Save.data.player.dailyStreak = this.currentRewardDay;
    Save.flush();

    // Визуальный эффект (вспышка)
    this.add.rectangle(360, 640, 720, 1280, 0xffffff).setAlpha(0.5).setDepth(100);
    this.tweens.add({
      targets: this.add.rectangle(360, 640, 720, 1280, 0xffffff).setDepth(100),
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.scene.start('HubScene');
      }
    });
  }
}
