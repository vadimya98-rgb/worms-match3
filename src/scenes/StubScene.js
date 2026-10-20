// Простая заглушка: показывает название будущего экрана и кнопку "Назад".
// По мере реализации блоков 2–7 будем заменять StubScene на настоящие сцены.
export default class StubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StubScene' });
  }

  // init вызывается ДО create и получает data из scene.start('StubScene', {...})
  init(data) {
    this.fromScene = data?.from || 'HubScene';
    this.name = data?.name || '...';
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 100, this.name, {
      fontSize: '56px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, cy, '(в разработке)', {
      fontSize: '32px',
      color: '#8888aa',
    }).setOrigin(0.5);

    const back = this.add.text(cx, cy + 220, '← НАЗАД', {
      fontSize: '40px',
      color: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 40, y: 20 },
    }).setOrigin(0.5);

    back.setInteractive();
    back.on('pointerdown', () => this.scene.start(this.fromScene));
  }
}
