import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Название
    this.add.text(cx, cy - 250, 'MATCH-WORMIKS', {
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    // Подпись
    this.add.text(cx, cy - 170, 'загрузка игры...', {
      fontSize: '26px',
      color: '#aaaaff',
    }).setOrigin(0.5);

    // Прогресс-бар: подложка + заполнение
    const barW = 400;
    const barH = 20;
    const barX = cx - barW / 2;
    const barY = cy + 100;

    this.add.rectangle(barX, barY, barW, barH, 0x333366).setOrigin(0, 0);
    const barFill = this.add.rectangle(barX, barY, 0, barH, 0x66ff66).setOrigin(0, 0);

    const progressText = this.add.text(cx, barY + 50, '0%', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Объект, который будет "анимироваться" — Phaser твинит его поле value.
    const progress = { value: 0 };
    this.tweens.add({
      targets: progress,
      value: barW,
      duration: 2000,
      ease: 'Linear',
      onUpdate: () => {
        barFill.width = progress.value;
        progressText.setText(`${Math.floor((progress.value / barW) * 100)}%`);
      },
      onComplete: () => this.nextScene(),
    });
  }

  // Решаем, куда идти: если Дракон уже выдан — в хаб, иначе — на выдачу.
  nextScene() {
    if (Save.isDragonOwned()) {
      this.scene.start('HubScene');
    } else {
      this.scene.start('StarterWormScene');
    }
  }
}
