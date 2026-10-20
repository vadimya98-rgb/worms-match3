import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create() {
    // ДОБАВИЛИ ФОН ЗАГРУЗКИ
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Затемняющая подложка, чтобы текст читался на фоне
    this.add.rectangle(cx, cy, 720, 1280, 0x000000, 0.4);

    this.add.text(cx, cy - 250, 'MATCH-WORMIKS', {
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(cx, cy - 170, 'загрузка игры...', {
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const barW = 400;
    const barH = 20;
    const barX = cx - barW / 2;
    const barY = cy + 100;

    this.add.rectangle(barX, barY, barW, barH, 0x333366).setOrigin(0, 0);
    const barFill = this.add.rectangle(barX, barY, 0, barH, 0x66ff66).setOrigin(0, 0);

    const progressText = this.add.text(cx, barY + 50, '0%', {
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

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

  nextScene() {
    if (Save.isDragonOwned()) {
      this.scene.start('HubScene');
    } else {
      this.scene.start('StarterWormScene');
    }
  }
}
