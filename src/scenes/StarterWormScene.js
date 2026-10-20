import { Save } from '../data/save.js';
import { getCharacterData } from '../data/characters.js';

export default class StarterWormScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StarterWormScene' });
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    const cx = this.scale.width / 2;
    const dragon = getCharacterData('dragon');

    this.add.text(cx, 140, 'Твой первый червь', {
      fontSize: '38px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.rectangle(cx, 580, 520, 520, 0x222244, 0.8)
      .setStrokeStyle(4, 0x6666aa);

    const dragonImg = this.add.image(cx, 540, 'dragon');
    dragonImg.setDisplaySize(200, 200);

    this.add.text(cx, 720, dragon.name, {
      fontSize: '56px', color: '#ffcc66', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(cx, 790, `HP: ${dragon.baseHp}`, {
      fontSize: '32px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    const btn = this.add.text(cx, 1080, 'ЗАБРАТЬ', {
      fontSize: '48px', color: '#ffffff', backgroundColor: '#22aa44', padding: { x: 80, y: 30 },
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    btn.setInteractive();
    btn.on('pointerdown', () => {
      Save.ownCharacter('dragon');
      this.scene.start('HubScene');
    });
  }
}
