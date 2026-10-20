import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { getCharacterData, getCharacterMaxHp } from '../data/characters.js';

export default class BossBattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossBattleScene' });
  }

  init(data) {
    this.bossData = BOSSES[data.bossIndex];
    this.bossIndex = data.bossIndex;
    
    this.COLS = 6;
    this.ROWS = 6;
    this.TILE_SIZE = 85; 
    this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 580;

    this.bossHp = this.bossData.maxHp;
    this.isBusy = false;
    this.isGameOver = false;
    
    this.team = data.team.map(id => {
      const char = getCharacterData(id);
      const state = Save.getCharacter(id);
      const maxHp = getCharacterMaxHp(id, state.level);
      return { id: id, name: char.name, hp: maxHp, maxHp: maxHp };
    });

    this.activeCharIndex = 0; 
    this.selectedTile = null;
    this.grid = [];

    // Наш пул из 6 оружий
    this.pool = [0, 1, 2, 3, 4, 5];
  }

  create() {
    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  buildUI() {
    this.add.text(360, 40, this.bossData.name, { fontSize: '32px', color: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5);
    
    this.add.rectangle(360, 80, 500, 30, 0x333333).setStrokeStyle(2, 0xffffff);
    this.bossHpBar = this.add.rectangle(110, 80, 500, 30, 0xff3333).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(360, 80, `${this.bossHp}/${this.bossData.maxHp}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

    // ВРЕМЕННАЯ ЗАГЛУШКА БОССА (КРАСНЫЙ КРУГ)
    this.bossSprite = this.add.circle(360, 190, 70, 0xaa2222).setStrokeStyle(4, 0xffffff);

    this.charContainers = [];
    this.renderTeamUI();

    this.medkitText = this.add.text(690, 520, `💊 x${Save.getMedkits()}`, { 
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 15, y: 10 }
    }).setOrigin(1, 0.5);
    
    this.medkitText.setInteractive();
    this.medkitText.on('pointerdown', () => this.useMedkit());
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const x = index === 0 ? 200 : 520;
      const y = 380;
      const isActive = (index === this.activeCharIndex);
      const borderColor = isActive ? 0x33cc66 : 0x444488;
      
      const bg = this.add.rectangle(x, y, 280, 120, 0x222244).setStrokeStyle(4, borderColor);
      
      // ВРЕМЕННАЯ ЗАГЛУШКА ПЕРСОНАЖА (СИНИЙ КРУГ)
      const charImg = this.add.circle(x - 90, y, 30, 0x4444aa).setStrokeStyle(2, 0xffffff);

      const name = this.add.text(x + 10, y - 30, `${char.name} ${isActive ? '(ХОД)' : ''}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
      
      const hpBarBg = this.add.rectangle(x - 110, y + 25, 220, 15, 0x333333).setOrigin(0, 0.5);
      const hpPercent = Math.max(0, char.hp / char.maxHp);
      const hpBarFill = this.add.rectangle(x - 110, y + 25, 220 * hpPercent, 15, 0x33cc66).setOrigin(0, 0.5);
      const hpText = this.add.text(x + 10, y + 25, `${char.hp}/${char.maxHp}`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

      if (char.hp > 0 && !this.isBusy && !this.isGameOver && !isActive) {
        bg.setInteractive();
        bg.on('pointerdown', () => { this.activeCharIndex = index; this.renderTeamUI(); });
      }

      this.charContainers.push(bg, charImg, name, hpBarBg, hpBarFill, hpText);
    });
  }

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
        if (matches.length > 0) this.removeTiles(matches);
        else this.swapBack(tile1, tile2);
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
    this.shootProjectile(tiles[0].x, tiles[0].y, this.bossSprite.x, this.bossSprite.y, 0x33cc66);
    const damage = tiles.length * 10;
    this.bossHp = Math.max(0, this.bossHp - damage);
    this.updateBossHpUI();

    tiles.forEach(tile => {
      this.grid[tile.gridRow][tile.gridCol] = null;
      this.tweens.add({ targets: tile, scale: 0, alpha: 0, duration: 150, onComplete: () => tile.destroy() });
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
            this.tweens.add({ targets: tile, y: this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
          }
          emptyRow--;
        }
      }
      for (let row = emptyRow; row >= 0; row--) {
        const colorIndex = Phaser.Utils.Array.GetRandom(this.pool);
        const tile = this.createTile(row, col, colorIndex);
        tile.y = this.OFFSET_Y - (emptyRow - row + 1) * this.TILE_SIZE;
        this.grid[row][col] = tile;
        this.tweens.add({ targets: tile, y: this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
      }
    }

    this.time.delayedCall(350, () => {
      const newMatches = this.findMatches();
      if (newMatches.length > 0) this.removeTiles(newMatches);
      else {
        if (this.bossHp <= 0) this.winGame();
        else this.bossTurn();
      }
    });
  }

  bossTurn() {
    const target = this.team[this.activeCharIndex];
    if (target.hp <= 0) {
      const aliveIndex = this.team.findIndex(c => c.hp > 0);
      if (aliveIndex === -1) return;
      this.activeCharIndex = aliveIndex;
      this.renderTeamUI();
      return this.bossTurn();
    }

    this.shootProjectile(this.bossSprite.x, this.bossSprite.y, 360, 380, 0xff3333);
    const bossDamage = 40;
    this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - bossDamage);
    
    this.time.delayedCall(400, () => {
      this.renderTeamUI();
      const aliveChars = this.team.filter(c => c.hp > 0);
      if (aliveChars.length === 0) this.loseGame();
      else {
        if (this.team[this.activeCharIndex].hp <= 0) {
          this.activeCharIndex = this.team.findIndex(c => c.hp > 0);
          this.renderTeamUI();
        }
        this.isBusy = false;
      }
    });
  }

  shootProjectile(fromX, fromY, toX, toY, color) {
    const proj = this.add.circle(fromX, fromY, 15, color);
    this.tweens.add({ targets: proj, x: toX, y: toY, duration: 300, onComplete: () => proj.destroy() });
  }

  updateBossHpUI() {
    const percent = Math.max(0, this.bossHp / this.bossData.maxHp);
    this.bossHpBar.width = 500 * percent;
    this.bossHpText.setText(`${this.bossHp}/${this.bossData.maxHp}`);
  }

  useMedkit() {
    if (this.isBusy || this.isGameOver) return;
    const target = this.team[this.activeCharIndex];
    if (Save.getMedkits() <= 0 || target.hp <= 0 || target.hp >= target.maxHp) return;

    target.hp = Math.min(target.maxHp, target.hp + 100);
    Save.data.player.medkits -= 1;
    Save.flush();

    this.medkitText.setText(`💊 x${Save.getMedkits()}`);
    this.renderTeamUI();
    this.shootProjectile(690, 520, 360, 380, 0x33ff66);
  }

  winGame() {
    this.isGameOver = true;
    Save.data.bosses[this.bossData.id] = 'defeated';
    Save.addFuzz(this.bossData.reward);

    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(100);
    this.add.rectangle(360, 640, 560, 400, 0x222244).setDepth(101).setStrokeStyle(4, 0x33cc66);
    this.add.text(360, 520, 'ПОБЕДА!', { fontSize: '56px', color: '#33cc66', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Награда: ${this.bossData.reward} Фузов`, { fontSize: '32px', color: '#ffcc66' }).setOrigin(0.5).setDepth(102);

    const btn = this.add.text(360, 740, 'ЗАБРАТЬ', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 50, y: 20 } }).setOrigin(0.5).setDepth(102);
    btn.setInteractive();
    btn.on('pointerdown', () => this.scene.start('BossListScene'));
  }

  loseGame() {
    this.isGameOver = true;
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(100);
    this.add.rectangle(360, 640, 560, 400, 0x222244).setDepth(101).setStrokeStyle(4, 0xff3333);
    this.add.text(360, 520, 'ПОРАЖЕНИЕ', { fontSize: '56px', color: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Босс оказался сильнее...`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(102);

    const btn = this.add.text(360, 740, 'В МЕНЮ', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 50, y: 20 } }).setOrigin(0.5).setDepth(102);
    btn.setInteractive();
    btn.on('pointerdown', () => this.scene.start('BossListScene'));
  }
}
