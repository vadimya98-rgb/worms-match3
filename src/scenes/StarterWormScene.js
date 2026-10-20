import { Save } from '../data/save.js';
import { getCharacterData } from '../data/characters.js';

export default class StarterWormScene extends Phaser.Scene {
  constructor() { super({ key: 'StarterWormScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6); // Синий фильтр

    const cx = 360;
    const dragon = getCharacterData('dragon');

    this.add.text(cx, 150, 'Твой первый червь', {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    // Стеклянная витрина
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(210, 300, 300, 300, 30)
        .lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(210, 300, 300, 300, 30);

    // Тень под персонажем
    const shadow = this.add.ellipse(cx, 560, 120, 30, 0x000000, 0.6);
    
    // Персонаж
    const dragonImg = this.add.image(cx, 450, 'dragon').setDisplaySize(140, 140);

    // Анимация парения
    this.tweens.add({ targets: dragonImg, y: 430, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: shadow, scaleX: 0.8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, 650, dragon.name, { fontSize: '48px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(cx, 710, `HP: ${dragon.baseHp}`, { fontSize: '28px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    // 3D Кнопка ДАЛЕЕ
    this.createCandyButton(cx, 950, 300, 80, 'ДАЛЕЕ', 0x2ecc71, () => {
      Save.ownCharacter('dragon');
      this.scene.start('HubScene');
    });
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, { fontSize: '36px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
