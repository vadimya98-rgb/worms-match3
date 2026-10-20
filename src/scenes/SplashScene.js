import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() { super({ key: 'SplashScene' }); }

  create() {
    // Фон (используем твой фон, но добавляем легкий синий фильтр)
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6); 

    // Красивая стеклянная панель по центру
    this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(60, 400, 600, 400, 40);

    const cx = 360;
    const cy = 600;

    // Заголовок с объемной тенью
    this.add.text(cx, cy - 150, 'MATCH\nWORMIKS', {
      fontFamily: '"Arial Black", sans-serif',
      fontSize: '72px',
      color: '#f1c40f',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 8, color: '#000', blur: 15, fill: true }
    }).setOrigin(0.5);

    // 3D Полоса загрузки
    const barW = 400;
    const barH = 35;
    const barX = cx - barW / 2;
    const barY = cy + 20;

    // Фон полосы (темный)
    this.add.graphics().fillStyle(0x2c3e50, 1).fillRoundedRect(barX, barY, barW, barH, 20);
    // Обводка
    this.add.graphics().lineStyle(4, 0xffffff, 0.8).strokeRoundedRect(barX, barY, barW, barH, 20);

    const barFill = this.add.graphics();
    const progress = { value: 0 };
    
    this.add.text(cx, barY + 65, 'ЗАГРУЗКА...', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: progress,
      value: barW - 10,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        barFill.clear();
        // Заливка (Мятный цвет)
        barFill.fillStyle(0x2ecc71, 1).fillRoundedRect(barX + 5, barY + 5, progress.value, barH - 10, 15);
        // Блик для объема
        barFill.fillStyle(0xffffff, 0.3).fillRoundedRect(barX + 5, barY + 5, progress.value, (barH - 10) / 2, 15);
      },
      onComplete: () => this.nextScene(),
    });
  }

  nextScene() {
    if (Save.isDragonOwned()) this.scene.start('HubScene');
    else this.scene.start('StarterWormScene');
  }
}
