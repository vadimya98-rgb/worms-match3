import { Save } from '../data/save.js';
import { Effects } from '../utils/effects.js';

export default class SaveLoadScene extends Phaser.Scene {
  constructor() { super({ key: 'SaveLoadScene' }); }

  init(data) {
    this.currentTab = data?.tab || 'save';
    this.contentElements = [];
    this.domEl = null;
    this.statusText = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(cx, H / 2, W, H, 0x1e3799, 0.7);

    this.createCandyButton(100, H * 0.05, 140, 50, '←', 0x3498db, () => {
      this.cleanupDom();
      this.scene.start('HubScene');
    });

    this.add.text(cx, H * 0.1, 'СОХРАНЕНИЕ ПРОГРЕССА', {
      fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.tabSaveBtn = this.add.text(cx - 140, H * 0.18, 'СОХРАНИТЬ', {
      fontSize: '20px', color: '#fff', backgroundColor: '#2ecc71',
      padding: { x: 16, y: 8 }, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    this.tabLoadBtn = this.add.text(cx + 140, H * 0.18, 'ЗАГРУЗИТЬ', {
      fontSize: '20px', color: '#fff', backgroundColor: '#2c3e50',
      padding: { x: 16, y: 8 }, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    this.tabSaveBtn.on('pointerdown', () => this.switchTab('save'));
    this.tabLoadBtn.on('pointerdown', () => this.switchTab('load'));

    this.events.once('shutdown', () => this.cleanupDom());

    this.switchTab(this.currentTab);
  }

  cleanupDom() {
    if (this.domEl) {
      try { this.domEl.destroy(); } catch (e) {}
      this.domEl = null;
    }
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width / 2, -height / 2 + 6, width, height, 15);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 15);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height / 2, 10);
    const txt = this.add.text(0, 0, text, { fontSize: '20px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 4; });
    container.on('pointerup', () => { container.y -= 4; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }

  switchTab(tab) {
    this.currentTab = tab;
    Effects.click(this);
    this.tabSaveBtn.setBackgroundColor(tab === 'save' ? '#2ecc71' : '#2c3e50');
    this.tabLoadBtn.setBackgroundColor(tab === 'load' ? '#2ecc71' : '#2c3e50');

    this.contentElements.forEach((el) => el.destroy());
    this.contentElements = [];
    this.cleanupDom();
    if (this.statusText) { this.statusText.destroy(); this.statusText = null; }

    if (tab === 'save') this.buildSaveView();
    else this.buildLoadView();
  }

  buildSaveView() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const info = this.add.text(cx, H * 0.25, 'Скопируйте код и сохраните в надёжном месте.\nПо нему вы восстановите прогресс после переустановки.', {
      fontSize: '16px', color: '#fff', align: 'center',
      stroke: '#000', strokeThickness: 3, wordWrap: { width: 560 }
    }).setOrigin(0.5);
    this.contentElements.push(info);

    const code = Save.exportCode();
    if (!code) {
      const err = this.add.text(cx, H * 0.5, 'Ошибка экспорта прогресса', {
        fontSize: '22px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);
      this.contentElements.push(err);
      return;
    }

    const codeBg = this.add.graphics()
      .fillStyle(0x1a2530, 1).fillRoundedRect(cx - 290, H * 0.36, 580, 180, 12)
      .lineStyle(2, 0x00ff9d, 1).strokeRoundedRect(cx - 290, H * 0.36, 580, 180, 12);
    this.contentElements.push(codeBg);

    const codeText = this.add.text(cx, H * 0.36 + 90, code, {
      fontSize: '11px', color: '#9de', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 560, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.contentElements.push(codeText);

    const info2 = this.add.text(cx, H * 0.56, `Длина кода: ${code.length} символов`, {
      fontSize: '14px', color: '#aaa', fontStyle: 'italic', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);
    this.contentElements.push(info2);

    this.createCandyButton(cx, H * 0.68, 340, 70, '📋 КОПИРОВАТЬ', 0x3498db, async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
          this.showStatus('Код скопирован в буфер!', 0x2ecc71);
        } else {
          this.showStatus('Буфер недоступен — сделайте скриншот', 0xf1c40f);
        }
      } catch (e) {
        this.showStatus('Буфер недоступен — сделайте скриншот', 0xf1c40f);
      }
    });

    const tip = this.add.text(cx, H * 0.78, 'Если буфер обмена не работает — сделайте скриншот\nи сохраните его. Код можно будет вставить вручную.', {
      fontSize: '14px', color: '#bbb', align: 'center',
      stroke: '#000', strokeThickness: 2, wordWrap: { width: 540 }
    }).setOrigin(0.5);
    this.contentElements.push(tip);
  }

  buildLoadView() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const info = this.add.text(cx, H * 0.25, 'Вставьте код в поле ниже и нажмите «Загрузить».\nВнимание: ваш текущий прогресс будет заменён!', {
      fontSize: '16px', color: '#fff', align: 'center',
      stroke: '#000', strokeThickness: 3, wordWrap: { width: 560 }
    }).setOrigin(0.5);
    this.contentElements.push(info);

    this.domEl = this.add.dom(cx, H * 0.44).createFromHTML(
      `<textarea id="loadCodeInput" placeholder="Вставьте код сюда..." ` +
      `style="width:88vw;max-width:560px;height:140px;font-size:11px;` +
      `font-family:monospace;padding:10px;border-radius:10px;` +
      `border:2px solid #3498db;background:#1a2530;color:#fff;` +
      `resize:none;box-sizing:border-box;outline:none;"></textarea>`
    );

    this.createCandyButton(cx - 95, H * 0.6, 170, 55, '📋 ВСТАВИТЬ', 0x3498db, async () => {
      const ta = document.getElementById('loadCodeInput');
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (ta && text) {
            ta.value = text.trim();
            this.showStatus('Код вставлен!', 0x2ecc71);
          } else {
            this.showStatus('Буфер пуст', 0xf1c40f);
          }
        } else {
          this.showStatus('Вставьте вручную (долгое нажатие)', 0xf1c40f);
        }
      } catch (e) {
        this.showStatus('Вставьте вручную (долгое нажатие)', 0xf1c40f);
      }
    });

    this.createCandyButton(cx + 95, H * 0.6, 170, 55, '✅ ЗАГРУЗИТЬ', 0x2ecc71, () => {
      const ta = document.getElementById('loadCodeInput');
      if (!ta || !ta.value.trim()) {
        this.showStatus('Введите код', 0xe74c3c);
        return;
      }
      const result = Save.importCode(ta.value);
      if (result.ok) {
        Effects.win(this);
        this.showStatus('Прогресс загружен!', 0x2ecc71);
        this.time.delayedCall(1400, () => {
          this.cleanupDom();
          this.scene.start('HubScene');
        });
      } else {
        Effects.error(this);
        this.showStatus(result.error || 'Ошибка загрузки', 0xe74c3c);
      }
    });
  }

  showStatus(text, color) {
    if (this.statusText) this.statusText.destroy();
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height * 0.92, text, {
      fontSize: '20px', color: hexColor, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(1000);
    this.time.delayedCall(2500, () => {
      if (this.statusText) { this.statusText.destroy(); this.statusText = null; }
    });
  }
}
