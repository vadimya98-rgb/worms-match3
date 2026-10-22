import { Save } from '../data/save.js';
import { Effects } from '../utils/effects.js';

export default class FarmScene extends Phaser.Scene {
  constructor() { super({ key: 'FarmScene' }); }

  init(data) {
    this.level = data?.level || 1;
    this.score = 0;
    // Очки: +100 за уровень (было +500 — слишком круто)
    this.targetScore = 1500 + (this.level - 1) * 100;
    // Ходы: +1 каждые 2 уровня
    this.movesLeft = 20 + Math.floor((this.level - 1) / 2);
    // Награда растёт с уровнем
    this.reward = 30 + (this.level - 1) * 40;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.image(W/2, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W/2, H/2, W, H, 0x1e3799, 0.6);

    this.COLS = 8; this.ROWS = 8;
    this.TILE_SIZE = Math.min(80, (W - 40) / this.COLS);
    this.GAP = 4;
    this.OFFSET_X = (W - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = H * 0.35;

    this.grid = []; this.isBusy = false; this.isGameOver = false;
    this.selectedTile = null; this.pool = [0, 1, 2, 3, 4, 5];

    this.buildHUD(W, H);
    this.createBoard(W, H);
    this.setupInput();

    this.createCandyButton(W/2, H * 0.9, 300, 70, '←', 0x3498db, () => this.scene.start('HubScene'));
  }

  buildHUD(W, H) {
    // Уровень
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(20, H * 0.05, 180, 60, 15).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(20, H * 0.05, 180, 60, 15);
    this.levelText = this.add.text(110, H * 0.05 + 30, `Уровень ${this.level}`, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // Ходы
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(W - 200, H * 0.05, 180, 60, 15).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(W - 200, H * 0.05, 180, 60, 15);
    this.movesText = this.add.text(W - 110, H * 0.05 + 30, `Ходы: ${this.movesLeft}`, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // Очки
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(W/2 - 200, H * 0.12, 400, 60, 15).lineStyle(3, 0xffcc00, 0.8).strokeRoundedRect(W/2 - 200, H * 0.12, 400, 60, 15);
    this.scoreText = this.add.text(W/2, H * 0.12 + 30, `Очки: 0 / ${this.targetScore}`, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // Награда (видно заранее, чтобы игрок понимал, за что играет)
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(W/2 - 110, H * 0.18, 220, 45, 12).lineStyle(2, 0xf1c40f, 0.8).strokeRoundedRect(W/2 - 110, H * 0.18, 220, 45, 12);
    this.add.image(W/2 - 75, H * 0.18 + 22, 'icon_fuz').setDisplaySize(24, 24);
    this.add.text(W/2 - 45, H * 0.18 + 22, `Награда: ${this.reward}`, { fontSize: '18px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  updateHUD() {
    this.movesText.setText(`Ходы: ${this.movesLeft}`);
    this.scoreText.setText(`Очки: ${this.score} / ${this.targetScore}`);
  }

  createBoard(W, H) {
    const boardW = this.COLS * this.TILE_SIZE;
    const boardH = this.ROWS * this.TILE_SIZE;
    this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW + 20, boardH + 20, 25).lineStyle(4, 0x3498db, 1).strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW + 20, boardH + 20, 25);

    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        let cIdx, isMatch;
        do {
          isMatch = false; cIdx = Phaser.Utils.Array.GetRandom(this.pool);
          if (col >= 2 && this.grid[row][col - 1].colorIndex === cIdx && this.grid[row][col - 2].colorIndex === cIdx) isMatch = true;
          if (row >= 2 && this.grid[row - 1][col].colorIndex === cIdx && this.grid[row - 2][col].colorIndex === cIdx) isMatch = true;
        } while (isMatch);
        this.grid[row][col] = this.createTile(row, col, cIdx);
      }
    }
  }

  createTile(row, col, colorIndex) {
    const x = this.OFFSET_X + col * this.TILE_SIZE + this.TILE_SIZE / 2;
    const y = this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2;

    const tileBg = this.add.graphics().fillStyle(0x34495e, 1).fillRoundedRect(-this.TILE_SIZE/2 + 4, -this.TILE_SIZE/2 + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8, 15);
    tileBg.setPosition(x, y);
    tileBg.setDepth(5);

    const tile = this.add.image(x, y, 'weapon' + colorIndex).setDisplaySize(this.TILE_SIZE - this.GAP - 10, this.TILE_SIZE - this.GAP - 10);
    tile.setDepth(10);
    tile.gridRow = row; tile.gridCol = col; tile.colorIndex = colorIndex; tile.bg = tileBg;

    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver) return;
      if (!this.selectedTile) { this.selectedTile = tile; tile.setTint(0xaaaaaa); Effects.click(this); }
      else if (this.selectedTile === tile) { this.selectedTile.clearTint(); this.selectedTile = null; }
      else {
        const first = this.selectedTile; first.clearTint(); this.selectedTile = null;
        if (this.areNeighbors(first, tile)) this.swapTiles(first, tile);
      }
    });
    return tile;
  }

  areNeighbors(t1, t2) {
    return (Math.abs(t1.gridRow - t2.gridRow) === 1 && t1.gridCol === t2.gridCol) || (Math.abs(t1.gridCol - t2.gridCol) === 1 && t1.gridRow === t2.gridRow);
  }

  setupInput() {
    let startX = 0, startY = 0, startTile = null;
    this.input.on('pointerdown', (p) => {
      if (this.isBusy || this.isGameOver) return;
      startX = p.x; startY = p.y;
      const c = Math.floor((p.x - this.OFFSET_X) / this.TILE_SIZE);
      const r = Math.floor((p.y - this.OFFSET_Y) / this.TILE_SIZE);
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) startTile = this.grid[r][c];
    });
    this.input.on('pointerup', (p) => {
      if (this.isBusy || this.isGameOver || !startTile) return;
      const dx = p.x - startX, dy = p.y - startY;
      let tr = startTile.gridRow, tc = startTile.gridCol;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) tc += (dx > 0) ? 1 : -1;
      else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) tr += (dy > 0) ? 1 : -1;
      else { startTile = null; return; }

      if (tr >= 0 && tr < this.ROWS && tc >= 0 && tc < this.COLS) this.swapTiles(startTile, this.grid[tr][tc]);
      startTile = null;
    });
  }

  swapTiles(t1, t2) {
    this.isBusy = true;
    Effects.swap(this);
    this.grid[t1.gridRow][t1.gridCol] = t2; this.grid[t2.gridRow][t2.gridCol] = t1;
    const tr = t1.gridRow; t1.gridRow = t2.gridRow; t2.gridRow = tr;
    const tc = t1.gridCol; t1.gridCol = t2.gridCol; t2.gridCol = tc;

    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg],
      x: (target) => {
          if (target === t1 || target === t1.bg) return this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
          if (target === t2 || target === t2.bg) return this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
          return target.x;
      },
      y: (target) => {
          if (target === t1 || target === t1.bg) return this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
          if (target === t2 || target === t2.bg) return this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
          return target.y;
      },
      duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) {
            this.movesLeft--; this.updateHUD(); t1.bg.destroy(); t2.bg.destroy(); this.removeTiles(matches);
        } else this.swapBack(t1, t2);
      }
    });
  }

  swapBack(t1, t2) {
    this.grid[t1.gridRow][t1.gridCol] = t2; this.grid[t2.gridRow][t2.gridCol] = t1;
    const tr = t1.gridRow; t1.gridRow = t2.gridRow; t2.gridRow = tr;
    const tc = t1.gridCol; t1.gridCol = t2.gridCol; t2.gridCol = tc;
    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg],
      x: (target) => {
          if (target === t1 || target === t1.bg) return this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
          if (target === t2 || target === t2.bg) return this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
          return target.x;
      },
      y: (target) => {
          if (target === t1 || target === t1.bg) return this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
          if (target === t2 || target === t2.bg) return this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
          return target.y;
      },
      duration: 200, ease: 'Back.easeIn', onComplete: () => { this.isBusy = false; }
    });
  }

  findMatches() {
    const m = [];
    for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS - 2; c++) {
      const a=this.grid[r][c], b=this.grid[r][c+1], d=this.grid[r][c+2];
      if (a&&b&&d&&a.active&&b.active&&d.active&&a.colorIndex===b.colorIndex&&b.colorIndex===d.colorIndex) { if(!m.includes(a))m.push(a); if(!m.includes(b))m.push(b); if(!m.includes(d))m.push(d); }
    }
    for (let c = 0; c < this.COLS; c++) for (let r = 0; r < this.ROWS - 2; r++) {
      const a=this.grid[r][c], b=this.grid[r+1][c], d=this.grid[r+2][c];
      if (a&&b&&d&&a.active&&b.active&&d.active&&a.colorIndex===b.colorIndex&&b.colorIndex===d.colorIndex) { if(!m.includes(a))m.push(a); if(!m.includes(b))m.push(b); if(!m.includes(d))m.push(d); }
    }
    return m;
  }

  // ИСПРАВЛЕНИЕ БАГА: уничтожаем тайлы мгновенно (как в BossBattleScene),
  // а визуальный отклик даём отдельным "поп"-кругом, который живёт независимо.
  removeTiles(tiles) {
    this.score += tiles.length * 50;
    if (tiles.length === 4) this.score += 100;
    if (tiles.length >= 5) this.score += 250;
    this.updateHUD();

    tiles.forEach(t => {
      if (t && t.active) {
        const px = t.x, py = t.y;
        this.grid[t.gridRow][t.gridCol] = null;
        if (t.bg) t.bg.destroy();
        t.destroy();

        // Аккуратный "поп" без риска оставить призрак тайла
        const pop = this.add.circle(px, py, 10, 0xffffff, 0.85).setDepth(15);
        this.tweens.add({
          targets: pop,
          scaleX: 4, scaleY: 4,
          alpha: 0,
          duration: 220,
          ease: 'Quad.easeOut',
          onComplete: () => pop.destroy()
        });
      }
    });
    this.time.delayedCall(200, () => this.applyGravity());
  }

  applyGravity() {
    for (let c = 0; c < this.COLS; c++) {
      let emptyRow = this.ROWS - 1;
      for (let r = this.ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null && this.grid[r][c].active) {
          if (r !== emptyRow) {
            const t = this.grid[r][c]; this.grid[emptyRow][c] = t; this.grid[r][c] = null; t.gridRow = emptyRow;
            this.tweens.add({ targets: [t, t.bg], y: this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
          }
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        const ci = Phaser.Utils.Array.GetRandom(this.pool);
        const t = this.createTile(r, c, ci);
        const startY = this.OFFSET_Y - (emptyRow - r + 1) * this.TILE_SIZE;
        t.y = startY; t.bg.y = startY;
        this.grid[r][c] = t;
        this.tweens.add({ targets: [t, t.bg], y: this.OFFSET_Y + r * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
      }
    }
    this.time.delayedCall(350, () => {
      const nm = this.findMatches();
      if (nm.length > 0) this.removeTiles(nm);
      else { this.isBusy = false; this.checkLevelStatus(); }
    });
  }

  checkLevelStatus() {
    const W = this.scale.width;
    const H = this.scale.height;

    if (this.score >= this.targetScore) {
      this.isGameOver = true;
      Effects.win(this);
      Save.addFuzz(this.reward);
      this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85).setDepth(100);
      this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(W/2 - 200, H/2 - 200, 400, 400, 30).lineStyle(4, 0x2ecc71, 1).strokeRoundedRect(W/2 - 200, H/2 - 200, 400, 400, 30);

      this.add.text(W/2, H/2 - 120, 'УРОВЕНЬ ПРОЙДЕН!', { fontSize: '36px', color: '#2ecc71', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(102);
      this.add.image(W/2 - 60, H/2 - 50, 'icon_fuz').setDisplaySize(40, 40).setDepth(102);
      this.add.text(W/2 - 20, H/2 - 50, `+${this.reward}`, { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(102);

      // Подсказка о следующем уровне
      const nextTarget = 1500 + this.level * 100;
      this.add.text(W/2, H/2 + 10, `Дальше: Ур. ${this.level + 1} (${nextTarget} очков)`, { fontSize: '16px', color: '#aaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(102);

      const btn = this.add.container(W/2, H/2 + 80).setDepth(102);
      const bg = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(-150, -40, 300, 80, 30).lineStyle(6, 0xffffff, 1).strokeRoundedRect(-150, -40, 300, 80, 30);
      btn.add([bg, this.add.text(0, 0, 'ДАЛЬШЕ', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)]);
      btn.setSize(300, 80).setInteractive();
      btn.on('pointerup', () => { Effects.click(this); this.time.delayedCall(100, () => this.scene.restart({ level: this.level + 1 })); });

    } else if (this.movesLeft <= 0) {
      this.isGameOver = true;
      Effects.lose(this);
      this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85).setDepth(100);
      this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(W/2 - 200, H/2 - 200, 400, 400, 30).lineStyle(4, 0xe74c3c, 1).strokeRoundedRect(W/2 - 200, H/2 - 200, 400, 400, 30);

      this.add.text(W/2, H/2 - 120, 'НЕ ХВАТИЛО ОЧКОВ', { fontSize: '36px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(102);
      this.add.text(W/2, H/2 - 50, `Собрано: ${this.score} / ${this.targetScore}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102);

      const btnTry = this.add.container(W/2, H/2 + 50).setDepth(102);
      const bgTry = this.add.graphics().fillStyle(0x3498db, 1).fillRoundedRect(-120, -35, 240, 70, 25).lineStyle(4, 0xffffff, 1).strokeRoundedRect(-120, -35, 240, 70, 25);
      btnTry.add([bgTry, this.add.text(0, 0, 'ЗАНОВО', { fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5)]);
      btnTry.setSize(240, 70).setInteractive();
      btnTry.on('pointerup', () => { Effects.click(this); this.time.delayedCall(100, () => this.scene.restart({ level: this.level })); });

      const btnMenu = this.add.container(W/2, H/2 + 150).setDepth(102);
      const bgMenu = this.add.graphics().fillStyle(0x2c3e50, 1).fillRoundedRect(-120, -35, 240, 70, 25).lineStyle(4, 0xffffff, 1).strokeRoundedRect(-120, -35, 240, 70, 25);
      btnMenu.add([bgMenu, this.add.text(0, 0, 'В МЕНЮ', { fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5)]);
      btnMenu.setSize(240, 70).setInteractive();
      btnMenu.on('pointerup', () => { Effects.click(this); this.time.delayedCall(100, () => this.scene.start('HubScene')); });
    }
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 8, width, height, 20);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 20);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 15);
    const txt = this.add.text(0, 0, text, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 5; });
    container.on('pointerup', () => { container.y -= 5; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
