import { WEAPONS } from '../data/weapons.js';
import { Effects } from '../utils/effects.js';

export default class InfoScene extends Phaser.Scene {
  constructor() { super({ key: 'InfoScene' }); }

  init(data) {
    this.currentTab = data?.tab || 'weapons';
    this.contentElements = [];
    this.scrollListeners = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(cx, H / 2, W, H, 0x1e3799, 0.7);

    this.createCandyButton(100, H * 0.05, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));

    this.add.text(cx, H * 0.1, 'ИНФОРМАЦИЯ', {
      fontSize: '36px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    // --- Вкладки ---
    this.tabWeaponsBtn = this.add.text(cx - 140, H * 0.17, 'ОРУЖИЕ', {
      fontSize: '22px', color: '#fff', backgroundColor: '#2ecc71',
      padding: { x: 18, y: 8 }, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    this.tabOtherBtn = this.add.text(cx + 140, H * 0.17, 'ОСТАЛЬНОЕ', {
      fontSize: '22px', color: '#fff', backgroundColor: '#2c3e50',
      padding: { x: 18, y: 8 }, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    this.tabWeaponsBtn.on('pointerdown', () => this.switchTab('weapons'));
    this.tabOtherBtn.on('pointerdown', () => this.switchTab('other'));

    this.switchTab(this.currentTab);
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 6, width, height, 15);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 15);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 10);
    const txt = this.add.text(0, 0, text, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 4; });
    container.on('pointerup', () => { container.y -= 4; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }

  switchTab(tab) {
    if (this.currentTab === tab && this.contentElements.length > 0) return;
    this.currentTab = tab;
    Effects.click(this);

    this.tabWeaponsBtn.setBackgroundColor(tab === 'weapons' ? '#2ecc71' : '#2c3e50');
    this.tabOtherBtn.setBackgroundColor(tab === 'other' ? '#2ecc71' : '#2c3e50');

    // Очистка предыдущей вкладки
    this.contentElements.forEach(el => el.destroy());
    this.contentElements = [];
    if (this.scrollListeners) {
      this.input.off('pointerdown', this.scrollListeners.down);
      this.input.off('pointermove', this.scrollListeners.move);
      this.input.off('pointerup', this.scrollListeners.up);
      this.input.off('wheel', this.scrollListeners.wheel);
      this.scrollListeners = null;
    }

    if (tab === 'weapons') this.buildWeaponsTab();
    else this.buildOtherTab();
  }

  buildWeaponsTab() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const listTop = H * 0.24;
    const listBottom = H * 0.9;
    const viewportH = listBottom - listTop;

    const listContainer = this.add.container(0, 0);
    this.contentElements.push(listContainer);

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, listTop, W, viewportH);
    listContainer.setMask(maskShape.createGeometryMask());

    const itemH = 100;
    const itemGap = 16;
    const step = itemH + itemGap;

    let y = listTop + 10;

    WEAPONS.forEach(w => {
      // Рамка оружия
      const rowBg = this.add.graphics()
        .fillStyle(0x2c3e50, 0.9).fillRoundedRect(cx - 280, y, 560, itemH, 18)
        .lineStyle(3, 0x00ff9d, 1).strokeRoundedRect(cx - 280, y, 560, itemH, 18);
      listContainer.add(rowBg);

      // Иконка оружия слева
      const iconBg = this.add.circle(cx - 230, y + itemH / 2, 36, 0x000000);
      listContainer.add(iconBg);
      const icon = this.add.image(cx - 230, y + itemH / 2, 'weapon' + w.id).setDisplaySize(60, 60);
      listContainer.add(icon);

      // Название — урон
      const nameTxt = this.add.text(cx - 170, y + itemH / 2, `${w.name} — ${w.damage} урона`, {
        fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0, 0.5);
      listContainer.add(nameTxt);

      // Доп. свойства (пробитие / заморозка)
      const extras = [];
      if (w.armorPierce > 0) extras.push(`пробитие ${w.armorPierce}`);
      if (w.stun) extras.push('заморозка');
      if (extras.length > 0) {
        const extraTxt = this.add.text(cx - 170, y + itemH / 2 + 28, `(${extras.join(', ')})`, {
          fontSize: '14px', color: '#3498db', fontStyle: 'italic'
        }).setOrigin(0, 0.5);
        listContainer.add(extraTxt);
      }

      y += step;
    });

    // --- Примечание (яркий блок) ---
    const noteH = 190;
    const noteBg = this.add.graphics()
      .fillStyle(0xd35400, 0.95).fillRoundedRect(cx - 280, y + 10, 560, noteH, 18)
      .lineStyle(4, 0xf1c40f, 1).strokeRoundedRect(cx - 280, y + 10, 560, noteH, 18);
    listContainer.add(noteBg);

    const noteTitle = this.add.text(cx, y + 50, '📢 ПРИМЕЧАНИЕ', {
      fontSize: '26px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    listContainer.add(noteTitle);

    const noteText = this.add.text(cx, y + 125, 'Возможно, когда-то в игре появится\nвозможность улучшать пушки\nи наносить больший урон...', {
      fontSize: '20px', color: '#fff', align: 'center', fontStyle: 'italic',
      wordWrap: { width: 520 }, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    listContainer.add(noteText);

    y += noteH + 20;

    const contentHeight = y - listTop;
    const maxScroll = Math.max(0, contentHeight - viewportH);

    // Подсказка о прокрутке
    if (maxScroll > 0) {
      const hint = this.add.text(cx, listBottom + 12, '↓ Прокрутите вниз, чтобы увидеть больше ↓', {
        fontSize: '16px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);
      this.contentElements.push(hint);
    }

    // --- Скролл: свайп + колесо ---
    let scrollY = 0;
    const updateScroll = (newY) => {
      scrollY = Phaser.Math.Clamp(newY, 0, maxScroll);
      listContainer.y = -scrollY;
    };

    let dragStartY = 0, scrollStart = 0, isDragging = false;
    const down = (p) => {
      if (p.y < listTop || p.y > listBottom) return;
      dragStartY = p.y; scrollStart = scrollY; isDragging = false;
    };
    const move = (p) => {
      if (Math.abs(p.y - dragStartY) > 8) isDragging = true;
      if (isDragging) updateScroll(scrollStart - (p.y - dragStartY));
    };
    const up = () => { isDragging = false; };
    const wheel = (pointer, objs, dx, dy) => { updateScroll(scrollY + dy * 0.5); };

    this.input.on('pointerdown', down);
    this.input.on('pointermove', move);
    this.input.on('pointerup', up);
    this.input.on('wheel', wheel);

    this.scrollListeners = { down, move, up, wheel };
  }

  buildOtherTab() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const bg = this.add.graphics()
      .fillStyle(0x2c3e50, 0.9).fillRoundedRect(cx - 280, H * 0.35, 560, H * 0.3, 20)
      .lineStyle(3, 0x3498db, 1).strokeRoundedRect(cx - 280, H * 0.35, 560, H * 0.3, 20);
    this.contentElements.push(bg);

    const txt = this.add.text(cx, H * 0.5, 'Тут будет информация,\nчуть позже...', {
      fontSize: '28px', color: '#fff', align: 'center', fontStyle: 'italic',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.contentElements.push(txt);
  }
}
