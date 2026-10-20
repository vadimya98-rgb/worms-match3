import { Save } from '../data/save.js';
import { getCharacterData } from '../data/characters.js';

export default class StarterWormScene extends Phaser.Scene {
  constructor() { super({ key: 'StarterWormScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5);

    // Рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.5).strokeRect(10, 10, 700, 1260);
      }, loop: true
    });

    const cx = 360;
    const dragon = getCharacterData('dragon');

    this.add.text(cx, 150, 'Твой первый червь', {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    // ЗЕЛЕНАЯ РАМКА (Меньше размером)
    const frameBg = this.add.graphics();
    frameBg.fillStyle(0x000000, 0.6).fillRoundedRect(210, 300, 300, 300, 30);
    frameBg.lineStyle(6, 0x22aa44, 1).strokeRoundedRect(210, 300, 300, 300, 30);
    frameBg.lineStyle(2, 0xffffff, 0.8).strokeRoundedRect(215, 305, 290, 290, 25); // Внутренний блик

    // Тень под персонажем
    const shadow = this.add.ellipse(cx, 560, 120, 30, 0x000000, 0.6);
    
    // Персонаж
    const dragonImg = this.add.image(cx, 450, 'dragon');
    dragonImg.setDisplaySize(140, 140);

    // Анимация парения и вращения
    this.tweens.add({ targets: dragonImg, y: 430, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: dragonImg, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });
    this.tweens.add({ targets: shadow, scaleX: 0.8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, 650, dragon.name, { fontSize: '48px', color: '#ffcc66', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(cx, 710, `HP: ${dragon.baseHp}`, { fontSize: '28px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    // Кнопка ДАЛЕЕ
    const btn = this.add.container(cx, 950);
    const bg = this.add.graphics().fillStyle(0x22aa44, 0.8).fillRoundedRect(-150, -40, 300, 80, 20).lineStyle(4, 0xffffff, 0.5).strokeRoundedRect(-150, -40, 300, 80, 20);
    const txt = this.add.text(0, 0, 'ДАЛЕЕ', { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(300, 80).setInteractive();
    
    btn.on('pointerdown', () => {
      Save.ownCharacter('dragon');
      this.scene.start('HubScene');
    });
  }
}
