import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';

export default class BossListScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossListScene' });
  }

  create() {
    // Верхняя панель
    this.add.rectangle(360, 60, 720, 100, 0x000022);
    this.add.text(30, 60, `Фузы: ${Save.getFuzz()}`, { fontSize: '28px', color: '#ffcc66' }).setOrigin(0, 0.5);

    // Кнопка Назад
    const backBtn = this.add.text(690, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 }
    }).setOrigin(1, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));

    // Заголовок
    this.add.text(360, 150, 'КАРТА БОССОВ', { fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Генерируем карту (зигзагом)
    this.renderBossMap();
  }

  // ==========================================
  // ОТРИСОВКА КАРТЫ БОССОВ
  // ==========================================

  renderBossMap() {
    const startY = 300;
    const spacingY = 200; // Расстояние по вертикали

    BOSSES.forEach((boss, index) => {
      // Делаем зигзаг по оси X
      let x = 360; // Центр
      if (index % 3 === 0) x = 200; // Влево
      if (index % 3 === 1) x = 520; // Вправо
      
      const y = startY + index * spacingY;

      // Определяем статус босса (закрыт, доступен, побежден)
      const status = this.getBossStatus(index);

      // Цвет кружочка
      let color = 0x555555; // Серый (закрыт)
      if (status === 'available') color = 0xff3333; // Красный (нужно пройти)
      if (status === 'defeated') color = 0x33cc66; // Зеленый (пройден)

      // Рисуем кружок босса
      const circle = this.add.circle(x, y, 70, color).setStrokeStyle(4, 0xffffff);
      circle.setInteractive();

      // Номер босса внутри кружка
      this.add.text(x, y, `${index + 1}`, { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

      // Название босса под кружком
      this.add.text(x, y + 90, boss.name, { fontSize: '24px', color: '#ffffff', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5);

      // Соединяем линиями (просто для красоты)
      if (index > 0) {
        let prevX = 360;
        if ((index - 1) % 3 === 0) prevX = 200;
        if ((index - 1) % 3 === 1) prevX = 520;
        let prevY = startY + (index - 1) * spacingY;
        this.add.line(0, 0, prevX, prevY, x, y, 0x444488).setOrigin(0, 0).setLineWidth(4);
      }

      // Обработка клика
      circle.on('pointerdown', () => {
        if (status === 'locked') return; // Если закрыт, не реагируем
        this.scene.start('BossDetailScene', { bossIndex: index });
      });
    });
  }

  // ==========================================
  // ЛОГИКА СТАТУСОВ БОССОВ
  // ==========================================

  getBossStatus(index) {
    const boss = BOSSES[index];
    
    // Если босс уже побежден (сохранено в Save)
    if (Save.data.bosses[boss.id] === 'defeated') return 'defeated';
    
    // Первый босс всегда доступен
    if (index === 0) return 'available';

    // Босс доступен, если предыдущий побежден
    const prevBoss = BOSSES[index - 1];
    if (Save.data.bosses[prevBoss.id] === 'defeated') return 'available';

    // В остальных случаях - закрыт
    return 'locked';
  }
}
