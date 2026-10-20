import { Save } from '../data/save.js';
import { getCharacterData } from '../data/characters.js';

export default class StarterWormScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StarterWormScene' });
  }

  create() {
    const cx = this.scale.width / 2;
    const dragon = getCharacterData('dragon');

    // Заголовок
    this.add.text(cx, 140, 'Твой первый червь', {
      fontSize: '38px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Карточка с рамкой
    this.add.rectangle(cx, 580, 520, 520, 0x222244)
      .setStrokeStyle(4, 0x6666aa);

    // Заглушка вместо спрайта — круг. Потом заменим на PNG дракона.
    this.add.circle(cx, 540, 140, 0xff6633);

    // Имя
    this.add.text(cx, 720, dragon.name, {
      fontSize: '56px',
      color: '#ffcc66',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // HP
    this.add.text(cx, 790, `HP: ${dragon.baseHp}`, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Кнопка "Забрать"
    const btn = this.add.text(cx, 1080, 'ЗАБРАТЬ', {
      fontSize: '48px',
      color: '#ffffff',
      backgroundColor: '#22aa44',
      padding: { x: 80, y: 30 },
    }).setOrigin(0.5);

    btn.setInteractive();
    btn.on('pointerdown', () => {
      Save.ownCharacter('dragon');
      this.scene.start('HubScene');
    });
  }
}
