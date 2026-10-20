import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() { super({ key: 'SplashScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5);

    // Радужная неоновая рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.5).strokeRect(10, 10, 700, 1260);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.8).strokeRect(10, 10, 700, 1260);
      }, loop: true
    });

    const cx = 360;
    const cy = 640;

    // Рукописный шрифт (симуляция)
    this.add.text(cx, cy - 200, 'Match-Wormiks', {
      fontFamily: '"Comic Sans MS", cursive, sans-serif',
      fontSize: '84px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Полоса загрузки (Закругленная)
    const barW = 400;
    const barH = 30;
    const barX = cx - barW / 2;
    const barY = cy + 50;

    // Фон полосы
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.6).fillRoundedRect(barX, barY, barW, barH, 15);
    barBg.lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(barX, barY, barW, barH, 15);

    // Заполнение полосы
    const barFill = this.add.graphics();
    const progress = { value: 0 };
    
    // Текст загрузки (ПОД полосой)
    const progressText = this.add.text(cx, barY + 50, 'загрузка игры... 0%', {
      fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: progress,
      value: barW - 10,
      duration: 2000,
      ease: 'Linear',
      onUpdate: () => {
        barFill.clear();
        barFill.fillStyle(0x33ff66, 1).fillRoundedRect(barX + 5, barY + 5, progress.value, barH - 10, 10);
        progressText.setText(`загрузка игры... ${Math.floor((progress.value / (barW - 10)) * 100)}%`);
      },
      onComplete: () => this.nextScene(),
    });
  }

  nextScene() {
    if (Save.isDragonOwned()) this.scene.start('HubScene');
    else this.scene.start('StarterWormScene');
  }
}
