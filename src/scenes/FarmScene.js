import { Save } from '../data/save.js';

export default class FarmScene extends Phaser.Scene {
  constructor() { super({ key: 'FarmScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5);

    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.6).strokeRect(8, 8, 704, 1264);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.9).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    this.COLS = 6; this.ROWS = 6; this.TILE_SIZE = 85; this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 400;

    this.grid = []; this.isBusy = false; this.isGameOver = false;
    this.selectedTile = null; this.movesLeft = 15; this.fuzzEarned = 0;
    this.pool = [0, 1, 2, 3, 4, 5];

    this.buildHUD();
    this.createBoard();
    this.setupInput();

    // Кнопка ЗАВЕРШИТЬ (Неоновая)
    const endBtn = this.add.container(360, 1180);
    const eBg = this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(-150, -35, 300, 70, 25).lineStyle(3, 0x00f0ff, 1).strokeRoundedRect(-150, -35, 300, 70, 25);
    endBtn.add([eBg, this.add.text(0, 0, 'ЗАВЕРШИТЬ', { fontSize: '32px', color: '#00f0ff', fontStyle: 'bold' }).setOrigin(0.5)]);
    endBtn.setSize(300, 70).setInteractive();
    endBtn.on('pointerdown', () => { if (!this.isBusy && !this.isGameOver) this.endGame(); });
  }

  buildHUD() {
    // Рамка Ходы (Слева)
    this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(20, 40, 180, 60, 20).lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(20, 40, 180, 60, 20);
    this.movesText = this.add.text(110, 70, `Ходы: ${this.movesLeft}`, { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Рамка Фузы (Справа)
    this.add.graphics().fillStyle(0x1a1a2e, 0.9).fillRoundedRect(520, 40, 180, 60, 20).lineStyle(3, 0xffcc00, 1).strokeRoundedRect(520, 40, 180, 60, 20);
    this.add.text(550, 70, '💰', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.fuzzText = this.add.text(600, 70, `${this.fuzzEarned}`, { fontSize: '24px', color: '#ffcc00', fontStyle: 'bold' }).setOrigin(0, 0.5);
  }

  updateMovesUI() { this.movesText.setText(`Ходы: ${this.movesLeft}`); }
  updateFuzzUI() { this.fuzzText.setText(`${this.fuzzEarned}`); }

  createBoard() {
    const boardW = this.COLS * this.TILE_SIZE + 20;
    const boardH = this.ROWS * this.TILE_SIZE + 20;
    this.add.graphics().fillStyle(0x1a1a2e, 0.8).fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25).lineStyle(4, 0x00f0ff, 0.6).strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);

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
    
    const tileBg = this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(-this.TILE_SIZE/2 + 2, -this.TILE_SIZE/2 + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4, 12);
    tileBg.setPosition(x, y);

    const tile = this.add.image(x, y, 'weapon' + colorIndex).setDisplaySize(this.TILE_SIZE - this.GAP - 10, this.TILE_SIZE - this.GAP - 10);
    
    tile.gridRow = row; tile.gridCol = col; tile.colorIndex = colorIndex; tile.bg = tileBg;
    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver) return;
      if (!this.selectedTile) { this.selectedTile = tile; tile.setTint(0xaaaaaa); }
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
    this.grid[t1.gridRow][t1.gridCol] = t2; this.grid[t2.gridRow][t2.gridCol] = t1;
    const tr = t1.gridRow; t1.gridRow = t2.gridRow; t2.gridRow = tr;
    const tc = t1.gridCol; t1.gridCol = t2.gridCol; t2.gridCol = tc;

    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg], x: (t) => (t === t1) ? this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : t.x), y: (t) => (t === t1) ? this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : t.y), duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) { this.movesLeft--; this.updateMovesUI(); t1.bg.destroy(); t2.bg.destroy(); this.removeTiles(matches); }
        else this.swapBack(t1, t2);
      }
    });
  }

  swapBack(t1, t2) {
    this.grid[t1.gridRow][t1.gridCol] = t2; this.grid[t2.gridRow][t2.gridCol] = t1;
    const tr = t1.gridRow; t1.gridRow = t2.gridRow; t2.gridRow = tr;
    const tc = t1.gridCol; t1.gridCol = t2.gridCol; t2.gridCol = tc;
    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg], x: (t) => (t === t1) ? this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : t.x), y: (t) => (t === t1) ? this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : t.y), duration: 200, ease: 'Back.easeIn', onComplete: () => { this.isBusy = false; } });
  }

  findMatches() {
    const m = [];
    for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS - 2; c++) {
      const a=this.grid[r][c], b=this.grid[r][c+1], d=this.grid[r][c+2];
      if (a&&b&&d&&a.colorIndex===b.colorIndex&&b.colorIndex===d.colorIndex) { if(!m.includes(a))m.push(a); if(!m.includes(b))m.push(b); if(!m.includes(d))m.push(d); }
    }
    for (let c = 0; c < this.COLS; c++) for (let r = 0; r < this.ROWS - 2; r++) {
      const a=this.grid[r][c], b=this.grid[r+1][c], d=this.grid[r+2][c];
      if (a&&b&&d&&a.colorIndex===b.colorIndex&&b.colorIndex===d.colorIndex) { if(!m.includes(a))m.push(a); if(!m.includes(b))m.push(b); if(!m.includes(d))m.push(d); }
    }
    return m;
  }

  removeTiles(tiles) {
    this.fuzzEarned += tiles.length * 10; this.updateFuzzUI();
    tiles.forEach(t => { this.grid[t.gridRow][t.gridCol] = null; t.bg.destroy(); this.tweens.add({ targets: t, scale: 0, alpha: 0, duration: 200, onComplete: () => t.destroy() }); });
    this.time.delayedCall(200, () => this.applyGravity());
  }

  applyGravity() {
    for (let c = 0; c < this.COLS; c++) {
      let emptyRow = this.ROWS - 1;
      for (let r = this.ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (r !== emptyRow) {
            const t = this.grid[r][c]; this.grid[emptyRow][c] = t; this.grid[r][c] = null; t.gridRow = emptyRow;
            const targetY = this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2;
            this.tweens.add({ targets: [t, t.bg], y: targetY, duration: 250, ease: 'Bounce.easeOut' });
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
      else { this.isBusy = false; if (this.movesLeft <= 0) this.endGame(); }
    });
  }

  endGame() {
    if (this.isGameOver) return; this.isGameOver = true; Save.addFuzz(this.fuzzEarned);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
    
    const panel = this.add.graphics().setDepth(101).fillStyle(0x1a1a2e, 0.95).fillRoundedRect(160, 440, 400, 400, 30).lineStyle(4, 0x00ff9d, 1).strokeRoundedRect(160, 440, 400, 400, 30);
    this.add.text(360, 520, 'ИГРА ОКОНЧЕНА', { fontSize: '40px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Собрано фузов:\n${this.fuzzEarned}`, { fontSize: '32px', color: '#ffcc00', align: 'center' }).setOrigin(0.5).setDepth(102);

    // Закругленная кнопка ЗАБРАТЬ
    const btn = this.add.container(360, 740).setDepth(102);
    const bg = this.add.graphics().fillStyle(0x00ff9d, 0.9).fillRoundedRect(-120, -30, 240, 60, 20);
    btn.add([bg, this.add.text(0, 0, 'ЗАБРАТЬ', { fontSize: '32px', color: '#1a1a2e', fontStyle: 'bold' }).setOrigin(0.5)]);
    btn.setSize(240, 60).setInteractive();
    btn.on('pointerdown', () => this.scene.start('HubScene'));
  }
}
