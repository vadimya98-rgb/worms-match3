import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { CHARACTERS, getCharacterMaxHp } from '../data/characters.js';
import { Effects } from '../utils/effects.js';

export default class BossDetailScene extends Phaser.Scene {
  constructor() { super({ key: 'BossDetailScene' }); }

  init(data) {
    this.bossIndex = data.bossIndex;
    this.boss = BOSSES[this.bossIndex];
    this.selectedChars = [null, null];
    this.menuOpen = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(cx, H / 2, W, H, 0x1e3799, 0.7);

    this.createCandyButton(100, H * 0.05, 140, 50, '←', 0x3498db, () => this.scene.start('BossListScene'));

    this.add.image(cx, H * 0.15, 'boss' + this.bossIndex).setDisplaySize(180, 180);
    this.add.text(cx, H * 0.26, this.boss.name, {
      fontSize: '48px', color: '#e74c3c', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5);

    // --- Рамка описания: тексты привязаны к границам рамки, награда больше не залезает ---
    const descW = 400;
    const descH = 140;
    const descX = cx - descW / 2;
    const descY = H * 0.30;

    this.add.graphics()
      .fillStyle(0x2c3e50, 0.9).fillRoundedRect(descX, descY, descW, descH, 20)
      .lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(descX, descY, descW, descH, 20);

    this.add.text(cx, descY + 15, this.boss.description, {
      fontSize: '18px', color: '#fff', align: 'center',
      wordWrap: { width: descW - 40 }
    }).setOrigin(0.5, 0); // верх описания привязан к верхнему краю рамки

    this.add.text(cx, descY + descH - 20, `Награда: ${this.boss.reward} Фузов`, {
      fontSize: '22px', color: '#f1c40f', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 1); // низ награды всегда в 20px от нижней границы

    this.add.text(cx, H * 0.44, 'ВЫБЕРИТЕ БОЙЦОВ', {
      fontSize: '26px', color: '#f1c40f', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    this.slotContainers = [];
    this.createSlot(cx - 110, H * 0.53, 0);
    this.createSlot(cx + 110, H * 0.53, 1);

    this.createCandyButton(cx, H * 0.85, 300, 80, 'В БОЙ', 0x00ff9d, () => {
      const team = this.selectedChars.filter(id => id !== null);
      if (team.length > 0) {
        this.scene.start('BossBattleScene', { bossIndex: this.bossIndex, team: team });
      }
    });
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics()
      .fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1)
      .fillRoundedRect(-width / 2, -height / 2 + 10, width, height, 25);
    const bg = this.add.graphics().fillStyle(color, 1)
      .fillRoundedRect(-width / 2, -height / 2, width, height, 25);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3)
      .fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; Effects.click(this); this.time.delayedCall(50, onClick); });
    container.on('pointerout', () => { container.y = y; });
    return container;
  }

  createSlot(x, y, index) {
    const container = this.add.container(x, y);
    const bg = this.add.circle(0, 0, 75, 0x2c3e50).setStrokeStyle(6, 0xffffff, 0.5);
    container.add(bg);
    const plus = this.add.text(0, 0, '+', { fontSize: '60px', color: '#7f8c8d', fontStyle: 'bold' }).setOrigin(0.5);
    container.add(plus);
    const zone = this.add.zone(0, 0, 150, 150).setInteractive({ useHandCursor: true });
    container.add(zone);
    zone.on('pointerup', () => this.openCharSelect(index, container, bg, plus));
    this.slotContainers[index] = container;
  }

  openCharSelect(slotIndex, slotContainer, slotBg, plusIcon) {
    if (this.menuOpen) return;
    this.menuOpen = true;
    Effects.click(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const panelW = 560;
    const panelH = Math.min(700, H * 0.78);
    const panelX = cx - panelW / 2;
    const panelY = (H - panelH) / 2;
    const listTop = panelY + 70;
    const listBottom = panelY + panelH - 70;
    const viewportH = listBottom - listTop;

    const overlay = this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.9)
      .setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101)
      .fillStyle(0x2c3e50, 1).fillRoundedRect(panelX, panelY, panelW, panelH, 30)
      .lineStyle(4, 0x3498db, 1).strokeRoundedRect(panelX, panelY, panelW, panelH, 30);
    const title = this.add.text(cx, panelY + 35, 'ВЫБЕРИТЕ БОЙЦА', {
      fontSize: '32px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102);

    const listContainer = this.add.container(0, 0).setDepth(102);
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(panelX, listTop, panelW, viewportH);
    const mask = maskShape.createGeometryMask();
    listContainer.setMask(mask);

    const itemH = 110;
    const itemGap = 20;
    const step = itemH + itemGap;

    const available = CHARACTERS.filter(c => Save.getCharacter(c.id).owned);
    const contentHeight = available.length * step;
    const maxScroll = Math.max(0, contentHeight - viewportH);

    const destroyables = [overlay, panel, title, listContainer];
    let scrollY = 0;

    // --- Ползунок (только если список не влезает) ---
    const scrollbarVisible = maxScroll > 0;
    let track, thumb, trackX, trackY, trackH, thumbH;
    if (scrollbarVisible) {
      trackX = panelX + panelW - 18;
      trackY = listTop + 5;
      trackH = viewportH - 10;
      thumbH = Math.max(36, trackH * (viewportH / contentHeight));
      track = this.add.graphics().setDepth(102)
        .fillStyle(0x000000, 0.35).fillRoundedRect(trackX, trackY, 8, trackH, 4);
      thumb = this.add.graphics().setDepth(103);
      destroyables.push(track, thumb);
    }

    const drawThumb = () => {
      if (!scrollbarVisible) return;
      const pos = maxScroll === 0 ? 0 : (scrollY / maxScroll) * (trackH - thumbH);
      thumb.clear().fillStyle(0x00ff9d, 0.9)
        .fillRoundedRect(trackX, trackY + pos, 8, thumbH, 4);
    };

    const updateScroll = (newY) => {
      scrollY = Phaser.Math.Clamp(newY, 0, maxScroll);
      listContainer.y = -scrollY;
      drawThumb();
    };
    updateScroll(0);

    // --- Карточки персонажей ---
    let y = listTop + 10;
    available.forEach(char => {
      const state = Save.getCharacter(char.id);
      const isAlreadySelected = this.selectedChars.includes(char.id);
      const btnColor = isAlreadySelected ? 0x333333 : 0x2c3e50;

      const btnBg = this.add.graphics()
        .fillStyle(btnColor, 1).fillRoundedRect(cx - 240, y, 480, itemH, 20)
        .lineStyle(3, isAlreadySelected ? 0x555555 : 0x00ff9d, 1)
        .strokeRoundedRect(cx - 240, y, 480, itemH, 20);

      const avatarBg = this.add.circle(cx - 180, y + itemH / 2, 40, 0x000000);
      const avatarImg = this.add.image(cx - 180, y + itemH / 2, char.id).setDisplaySize(70, 70);
      const charName = this.add.text(cx - 110, y + 25, char.name, {
        fontSize: '26px',
        color: isAlreadySelected ? '#777' : '#fff',
        fontStyle: 'bold'
      });
      const charHp = this.add.text(cx - 110, y + 65,
        `HP: ${getCharacterMaxHp(char.id, state.level)}`,
        { fontSize: '20px', color: isAlreadySelected ? '#555' : '#00ff9d' }
      );

      const zone = this.add.zone(cx, y + itemH / 2, 480, itemH).setInteractive();
      let startX = 0, startY = 0;
      zone.on('pointerdown', (p) => { startX = p.x; startY = p.y; });
      zone.on('pointerup', (p) => {
        if (!this.menuOpen) return;
        const dist = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
        if (dist < 15) {
          Effects.click(this);
          if (isAlreadySelected) {
            this.selectedChars[slotIndex] = null;
            plusIcon.setVisible(true);
            slotBg.setStrokeStyle(6, 0xffffff, 0.5);
            slotContainer.list.slice().forEach(child => {
              if (child.texture) child.destroy();
            });
          } else {
            this.selectedChars[slotIndex] = char.id;
            plusIcon.setVisible(false);
            slotBg.setStrokeStyle(6, 0x2ecc71);
            const img = this.add.image(0, 0, char.id).setDisplaySize(110, 110);
            slotContainer.add(img);
          }
          closeMenu();
        }
      });

      listContainer.add([btnBg, avatarBg, avatarImg, charName, charHp, zone]);
      y += step;
    });

    // --- Подсказка о прокрутке ---
    if (scrollbarVisible) {
      const hint = this.add.text(cx, listBottom + 15, 'Прокрутите список ↓', {
        fontSize: '18px', color: '#f1c40f', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(102);
      destroyables.push(hint);
    }

    // --- Драг + колесо ---
    let dragStartY = 0, scrollStart = 0, isDragging = false;
    const dragStart = (p) => { dragStartY = p.y; scrollStart = scrollY; isDragging = false; };
    const dragMove = (p) => {
      if (Math.abs(p.y - dragStartY) > 6) isDragging = true;
      if (isDragging) updateScroll(scrollStart - (p.y - dragStartY));
    };
    const dragEnd = () => { isDragging = false; };
    const wheelHandler = (pointer, objs, dx, dy) => { updateScroll(scrollY + dy * 0.5); };

    this.input.on('pointerdown', dragStart);
    this.input.on('pointermove', dragMove);
    this.input.on('pointerup', dragEnd);
    this.input.on('wheel', wheelHandler);

    // --- Кнопка ОТМЕНА (внутри панели) ---
    const cancelBtn = this.add.text(cx, panelY + panelH - 35, 'ОТМЕНА', {
      fontSize: '26px', color: '#e74c3c', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(102).setInteractive();
    cancelBtn.on('pointerup', () => { Effects.click(this); closeMenu(); });
    destroyables.push(cancelBtn);

    const closeMenu = () => {
      this.menuOpen = false;
      this.input.off('pointerdown', dragStart);
      this.input.off('pointermove', dragMove);
      this.input.off('pointerup', dragEnd);
      this.input.off('wheel', wheelHandler);
      destroyables.forEach(el => el.destroy());
    };
  }
}
