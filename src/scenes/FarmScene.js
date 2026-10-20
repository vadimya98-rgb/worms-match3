import { Save } from '../data/save.js';

export default class FarmScene extends Phaser.Scene {
  constructor() { super({ key: 'FarmScene' }); }

  init(data) {
    this.level = data?.level || 1;
    this.score = 0;
    this.targetScore = 1500 + (this.level - 1) * 500; 
    this.movesLeft = 20;
    
    this.COLS = 8; this.ROWS = 8; 
    this.TILE_SIZE = 78; this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 350;
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.grid = []; this.isBusy = false; this.isGameOver = false;
    this.selectedTile = null; this.pool = [0, 1, 2, 3, 4, 5];

    this.buildHUD();
    this.createBoard();
    this.setupInput();

    this.createCandyButton(100, 50, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));
  }

  buildHUD() {
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(20, 120, 180, 60, 15).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(20, 120, 180, 60, 15);
    this.levelText = this.add.text(110, 150, `Уровень ${this.level}`, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(520, 120, 180, 60, 15).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(520, 120, 180, 60, 15);
    this.movesText = this.add.text(610, 150, `Ходы: ${this.movesLeft}`, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(160, 200, 400, 60, 15).lineStyle(3, 0xffcc00, 0.8).strokeRoundedRect(160, 200, 400, 60, 15);
    this.scoreText = this.add.text(360, 230, `Очки: 0 / ${this.targetScore}`, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
  }

  updateHUD() {
    this.movesText.setText(`Ходы: ${this.movesLeft}`);
    this.scoreText.setText(`Очки: ${this.score} / ${this.targetScore}`);
  }

  createBoard() {
    const boardW = this.COLS * this.TILE_SIZE + 20;
    const boardH = this.ROWS * this.TILE_SIZE + 20;
    this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25).lineStyle(4, 0x3498db, 1).strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);

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
    const tileBg = this.add.graphics().fillStyle(0x34495e, 1).fillRoundedRect(-this.TILE_SIZE/2 + 2, -this.TILE_SIZE/2 + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4, 12);
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

    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg], 
      x: (t) => (t === t1) ? this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : t.x), 
      y: (t) => (t === t1) ? this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : t.y), 
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
      x: (t) => (t === t1) ? this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : t.x), 
      y: (t) => (t === t1) ? this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : t.y), 
      duration: 200, ease: 'Back.easeIn', onComplete: () => { this.isBusy = false; } 
    });
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
    this.score += tiles.length * 50;
    if (tiles.length === 4) this.score += 100;
    if (tiles.length >= 5) this.score += 250;
    this.updateHUD();

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
    if (this.score >= this.targetScore) {
      this.isGameOver = true;
      Save.addFuzz(30); 
      this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
      this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(160, 440, 400, 400, 30).lineStyle(4, 0x2ecc71, 1).strokeRoundedRect(160, 440, 400, 400, 30);
      
      this.add.text(360, 520, 'УРОВЕНЬ ПРОЙДЕН!', { fontSize: '36px', color: '#2ecc71', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(102);
      
      // Иконка фузов вместо надписи
      this.add.image(330, 590, 'icon_fuz').setDisplaySize(40, 40).setDepth(102);
      this.add.text(370, 590, `+30`, { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(102);

      const btn = this.add.container(360, 720).setDepth(102);
      const bg = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(-150, -40, 300, 80, 30).lineStyle(6, 0xffffff, 1).strokeRoundedRect(-150, -40, 300, 80, 30);
      btn.add([bg, this.add.text(0, 0, 'ДАЛЬШЕ', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)]);
      btn.setSize(300, 80).setInteractive();
      btn.on('pointerup', () => this.scene.restart({ level: this.level + 1 }));
      
    } else if (this.movesLeft <= 0) {
      this.isGameOver = true;
      this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
      this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(160, 440, 400, 400, 30).lineStyle(4, 0xe74c3c, 1).strokeRoundedRect(160, 440, 400, 400, 30);
      
      this.add.text(360, 520, 'НЕ ХВАТИЛО ОЧКОВ', { fontSize: '36px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(102);
      this.add.text(360, 590, `Собрано: ${this.score} / ${this.targetScore}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102);

      const btnTry = this.add.container(360, 700).setDepth(102);
      const bgTry = this.add.graphics().fillStyle(0x3498db, 1).fillRoundedRect(-120, -35, 240, 70, 25).lineStyle(4, 0xffffff, 1).strokeRoundedRect(-120, -35, 240, 70, 25);
      btnTry.add([bgTry, this.add.text(0, 0, 'ЗАНОВО', { fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5)]);
      btnTry.setSize(240, 70).setInteractive();
      btnTry.on('pointerup', () => this.scene.restart({ level: this.level }));

      const btnMenu = this.add.container(360, 800).setDepth(102);
      const bgMenu = this.add.graphics().fillStyle(0x2c3e50, 1).fillRoundedRect(-120, -35, 240, 70, 25).lineStyle(4, 0xffffff, 1).strokeRoundedRect(-120, -35, 240, 70, 25);
      btnMenu.add([bgMenu, this.add.text(0, 0, 'В МЕНЮ', { fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5)]);
      btnMenu.setSize(240, 70).setInteractive();
      btnMenu.on('pointerup', () => this.scene.start('HubScene'));
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
    container.on('pointerup', () => { container.y -= 5; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
