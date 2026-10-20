import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() { super({ key: 'SplashScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1a0b2e, 0.85); // Стильный темный фильтр

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({ delay: 100, callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.8).strokeRect(10, 10, 700, 1260);
        this.borderGraphics.lineStyle(2, 0xffffff, 1).strokeRect(10, 10, 700, 1260);
    }, loop: true });

    const cx = 360;
    const cy = 640;

    // Современный сочный заголовок
    const title = this.add.text(cx, cy - 200, 'MATCH\nWORMIKS', {
      fontFamily: '"Arial Black", Impact, sans-serif',
      fontSize: '80px',
      color: '#f1c40f', // Золотой
      align: 'center',
      stroke: '#000000',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 8, color: '#000', blur: 10, fill: true }
    }).setOrigin(0.5);
    title.setScale(0); // Начинаем с 0 для анимации

    this.tweens.add({ targets: title, scale: 1, duration: 800, ease: 'Back.easeOut' });

    // Полоса загрузки (3D стиль)
    const barW = 400;
    const barH = 40;
    const barX = cx - barW / 2;
    const barY = cy + 100;

    // Фон полосы
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.8).fillRoundedRect(barX, barY, barW, barH, 20);
    barBg.lineStyle(4, 0x00f0ff, 1).strokeRoundedRect(barX, barY, barW, barH, 20);

    // Заполнение
    const barFill = this.add.graphics();
    const progress = { value: 0 };
    
    // Текст загрузки
    const progressText = this.add.text(cx, barY + 70, 'ЗАГРУЗКА 0%', {
      fontSize: '24px', color: '#00f0ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: progress,
      value: barW - 12,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        barFill.clear();
        // Заливка (градиент)
        barFill.fillStyle(0x00ff9d, 1).fillRoundedRect(barX + 6, barY + 6, progress.value, barH - 12, 14);
        // Блик
        barFill.fillStyle(0xffffff, 0.4).fillRoundedRect(barX + 6, barY + 6, progress.value, (barH - 12) / 2, 14);
        
        progressText.setText(`ЗАГРУЗКА ${Math.floor((progress.value / (barW - 12)) * 100)}%`);
      },
      onComplete: () => this.nextScene(),
    });
  }

  nextScene() {
    if (Save.isDragonOwned()) this.scene.start('HubScene');
    else this.scene.start('StarterWormScene');
  }
}
