import { Save } from '../data/save.js';

export default class FarmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmScene' });
  }

  create() {
    this.COLS = 6;
    this.ROWS = 6;
    this.TILE_SIZE = 100;
    this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 280;

    this.grid = [];
    this.isBusy = false;
    this.isGameOver = false;
    this.selectedTile = null;
    this.movesLeft = 15;
    this.fuzzEarned = 0;

    // Так как оружий всего 6, мы используем их все
    this.pool = [0, 1, 2, 3, 4, 5];

    this.buildHUD();
    this.createBoard();

    const backBtn = this.add.text(360, 1180, 'ЗАВЕРШИТЬ', {
      fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 40, y: 20 }
    }).setOrigin(0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver) return;
      this.endGame();
    });

    this.setupInput();
  }

  buildHUD() {
    this.add.rectangle(360, 60, 720, 100, 0x000022);
    this.movesText = this.add.text(30, 60, `Ходы: ${this.movesLeft}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0, 0.5);
    this.fuzzText = this.add.text(690, 60, `Фузы: ${this.fuzzEarned}`, { fontSize: '32px', color: '#ffcc66' }).setOrigin(1, 0.5);
    this.add.text(360, 150, 'РЕЖИМ ФАРМ', { fontSize: '36px', color: '#8888aa' }).setOrigin(0.5);
  }

  updateMovesUI() { this.movesText.setText(`Ходы: ${this.movesLeft}`); }
  updateFuzzUI() { this.fuzzText.setText(`Фузы: ${this.fuzzEarned}`); }

  createBoard() {
    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        let colorIndex;
        let isMatch;
        do {
          isMatch = false;
          colorIndex = Phaser.Utils.Array.GetRandom(this.pool);
          
          if (col >= 2 && this.grid[row][col - 1].colorIndex === colorIndex && this.grid[row][col - 2].colorIndex === colorIndex) isMatch = true;
          if (row >= 2 && this.grid[row - 1][col].colorIndex === colorIndex && this.grid[row - 2][col].colorIndex === colorIndex) isMatch = true;
        } while (isMatch);

        this.grid[row][col] = this.createTile(row, col, colorIndex);
      }
    }
  }

  createTile(row, col, colorIndex) {
    const x = this.OFFSET_X + col * this.TILE_SIZE + this.TILE_SIZE / 2;
    const y = this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2;

    const tile = this.add.image(x, y, 'weapon' + colorIndex);
    tile.setDisplaySize(this.TILE_SIZE - this.GAP, this.TILE_SIZE - this.GAP);

    tile.gridRow = row;
    tile.gridCol = col;
    tile.colorIndex = colorIndex;

    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver) return;
      if (!this.selectedTile) {
        this.selectedTile = tile;
        tile.setScale(0.9);
      } else if (this.selectedTile === tile) {
        this.selectedTile.setScale(1);
        this.selectedTile = null;
      } else {
        const firstTile = this.selectedTile;
        this.selectedTile.setScale(1);
        this.selectedTile = null;
        if (this.areNeighbors(firstTile, tile)) this.swapTiles(firstTile, tile);
      }
    });
    return tile;
  }

  areNeighbors(t1, t2) {
    const rowDiff = Math.abs(t1.gridRow - t2.gridRow);
    const colDiff = Math.abs(t1.gridCol - t2.gridCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  setupInput() {
    let startX = 0, startY = 0, startTile = null;
    this.input.on('pointerdown', (pointer) => {
      if (this.isBusy || this.isGameOver) return;
      startX = pointer.x; startY = pointer.y;
      const col = Math.floor((pointer.x - this.OFFSET_X) / this.TILE_SIZE);
      const row = Math.floor((pointer.y - this.OFFSET_Y) / this.TILE_SIZE);
      if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) startTile = this.grid[row][col];
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isBusy || this.isGameOver || !startTile) return;
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;
      let targetRow = startTile.gridRow, targetCol = startTile.gridCol;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) targetCol += (dx > 0) ? 1 : -1;
      else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) targetRow += (dy > 0) ? 1 : -1;
      else { startTile = null; return; }

      if (targetRow >= 0 && targetRow < this.ROWS && targetCol >= 0 && targetCol < this.COLS) {
        this.swapTiles(startTile, this.grid[targetRow][targetCol]);
      }
      startTile = null;
    });
  }

  swapTiles(tile1, tile2) {
    this.isBusy = true;
    this.grid[tile1.gridRow][tile1.gridCol] = tile2;
    this.grid[tile2.gridRow][tile2.gridCol] = tile1;
    const tRow = tile1.gridRow; tile1.gridRow = tile2.gridRow; tile2.gridRow = tRow;
    const tCol = tile1.gridCol; tile1.gridCol = tile2.gridCol; tile2.gridCol = tCol;

    this.tweens.add({ targets: [tile1, tile2], 
      x: (target) => this.OFFSET_X + target.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: (target) => this.OFFSET_Y + target.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2,
      duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) {
          this.movesLeft--;
          this.updateMovesUI();
          this.removeTiles(matches);
        } else {
          this.swapBack(tile1, tile2);
        }
      }
    });
  }

  swapBack(tile1, tile2) {
    this.grid[tile1.gridRow][tile1.gridCol] = tile2;
    this.grid[tile2.gridRow][tile2.gridCol] = tile1;
    const tRow = tile1.gridRow; tile1.gridRow = tile2.gridRow; tile2.gridRow = tRow;
    const tCol = tile1.gridCol; tile1.gridCol = tile2.gridCol; tile2.gridCol = tCol;

    this.tweens.add({ targets: [tile1, tile2], 
      x: (target) => this.OFFSET_X + target.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: (target) => this.OFFSET_Y + target.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2,
      duration: 200, ease: 'Back.easeIn',
      onComplete: () => { this.isBusy = false; }
    });
  }

  findMatches() {
    const matches = [];
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS - 2; col++) {
        const t1 = this.grid[row][col], t2 = this.grid[row][col + 1], t3 = this.grid[row][col + 2];
        if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t2.colorIndex === t3.colorIndex) {
          if (!matches.includes(t1)) matches.push(t1);
          if (!matches.includes(t2)) matches.push(t2);
          if (!matches.includes(t3)) matches.push(t3);
        }
      }
    }
    for (let col = 0; col < this.COLS; col++) {
      for (let row = 0; row < this.ROWS - 2; row++) {
        const t1 = this.grid[row][col], t2 = this.grid[row + 1][col], t3 = this.grid[row + 2][col];
        if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t2.colorIndex === t3.colorIndex) {
          if (!matches.includes(t1)) matches.push(t1);
          if (!matches.includes(t2)) matches.push(t2);
          if (!matches.includes(t3)) matches.push(t3);
        }
      }
    }
    return matches;
  }

  removeTiles(tiles) {
    this.fuzzEarned += tiles.length * 10;
    this.updateFuzzUI();
    tiles.forEach(tile => {
      this.grid[tile.gridRow][tile.gridCol] = null;
      this.tweens.add({ targets: tile, scale: 0, alpha: 0, duration: 200, onComplete: () => tile.destroy() });
    });
    this.time.delayedCall(200, () => this.applyGravity());
  }

  applyGravity() {
    for (let col = 0; col < this.COLS; col++) {
      let emptyRow = this.ROWS - 1;
      for (let row = this.ROWS - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          if (row !== emptyRow) {
            const tile = this.grid[row][col];
            this.grid[emptyRow][col] = tile;
            this.grid[row][col] = null;
            tile.gridRow = emptyRow;
            this.tweens.add({ targets: tile, y: this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 300, ease: 'Bounce.easeOut' });
          }
          emptyRow--;
        }
      }
      for (let row = emptyRow; row >= 0; row--) {
        const colorIndex = Phaser.Utils.Array.GetRandom(this.pool);
        const tile = this.createTile(row, col, colorIndex);
        tile.y = this.OFFSET_Y - (emptyRow - row + 1) * this.TILE_SIZE;
        this.grid[row][col] = tile;
        this.tweens.add({ targets: tile, y: this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 300, ease: 'Bounce.easeOut' });
      }
    }
    this.time.delayedCall(400, () => {
      const newMatches = this.findMatches();
      if (newMatches.length > 0) this.removeTiles(newMatches);
      else {
        this.isBusy = false;
        if (this.movesLeft <= 0) this.endGame();
      }
    });
  }

  endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    Save.addFuzz(this.fuzzEarned);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(100);
    this.add.rectangle(360, 640, 560, 400, 0x222244).setDepth(101).setStrokeStyle(4, 0x6666aa);
    this.add.text(360, 520, 'ИГРА ОКОНЧЕНА', { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Вы собрали фузов:\n${this.fuzzEarned}`, { fontSize: '36px', color: '#ffcc66', align: 'center' }).setOrigin(0.5).setDepth(102);
    const collectBtn = this.add.text(360, 760, 'ЗАБРАТЬ', { fontSize: '44px', color: '#ffffff', backgroundColor: '#22aa44', padding: { x: 60, y: 20 } }).setOrigin(0.5).setDepth(102);
    collectBtn.setInteractive();
    collectBtn.on('pointerdown', () => this.scene.start('HubScene'));
  }
}
