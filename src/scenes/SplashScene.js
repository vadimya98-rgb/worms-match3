import { Save } from '../data/save.js';

export default class SplashScene extends Phaser.Scene {
  constructor() { super({ key: 'SplashScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.image(W/2, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.4);

    const cx = W / 2;
    const cy = H / 2;

    this.add.text(cx, cy - H * 0.15, 'Wormix Match', {
      fontSize: '72px', color: '#ffffff', fontStyle: 'bold', align: 'center', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(cx, cy - H * 0.1, 'загрузка игры...', {
      fontSize: '26px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    const barW = 400;
    const barH = 20;
    const barX = cx - barW / 2;
    const barY = cy + H * 0.05;

    this.add.rectangle(barX, barY, barW, barH, 0x333366).setOrigin(0, 0);
    const barFill = this.add.rectangle(barX, barY, 0, barH, 0x66ff66).setOrigin(0, 0);

    const progressText = this.add.text(cx, barY + 50, '0%', {
      fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
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
