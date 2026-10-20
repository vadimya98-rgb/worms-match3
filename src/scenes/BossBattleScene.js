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
    
    // Настройки поля (сдвинуты вниз, чтобы сверху поместились босс и персонажи)
    this.COLS = 6;
    this.ROWS = 6;
    this.TILE_SIZE = 85; // Чуть уменьшили, чтобы влезло
    this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 580;

    this.COLORS = [0xff3344, 0xaa44ff, 0xff9933, 0x33cc66, 0x3399ff, 0xbb8844];

    // Стейт боя
    this.bossHp = this.bossData.maxHp;
    this.isBusy = false; // Блокировка кликов во время анимаций
    this.isGameOver = false;
    
    // Формируем команду игрока
    this.team = data.team.map(id => {
      const char = getCharacterData(id);
      const state = Save.getCharacter(id);
      const maxHp = getCharacterMaxHp(id, state.level);
      return { id: id, name: char.name, hp: maxHp, maxHp: maxHp };
    });

    // Индекс активного персонажа (кто сейчас ходит)
    this.activeCharIndex = 0; 
    
    this.selectedTile = null;
    this.grid = [];
  }

  create() {
    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  // ==========================================
  // ИНТЕРФЕЙС (БОСС, ПЕРСОНАЖИ, АПТЕЧКА)
  // ==========================================

  buildUI() {
    // --- БОСС ---
    this.add.text(360, 40, this.bossData.name, { fontSize: '32px', color: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5);
    
    // Полоска HP Босса
    this.add.rectangle(360, 80, 500, 30, 0x333333).setStrokeStyle(2, 0xffffff);
    this.bossHpBar = this.add.rectangle(110, 80, 500, 30, 0xff3333).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(360, 80, `${this.bossHp}/${this.bossData.maxHp}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

    // Заглушка босса (круг)
    this.bossSprite = this.add.circle(360, 180, 60, 0xaa2222).setStrokeStyle(4, 0xffffff);

    // --- ПЕРСОНАЖИ ИГРОКА ---
    this.charContainers = [];
    this.renderTeamUI();

    // --- КНОПКА АПТЕЧКИ ---
    this.medkitText = this.add.text(690, 520, `💊 x${Save.getMedkits()}`, { 
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 15, y: 10 }
    }).setOrigin(1, 0.5);
    
    this.medkitText.setInteractive();
    this.medkitText.on('pointerdown', () => this.useMedkit());
  }

  // Отрисовка карточек персонажей
  renderTeamUI() {
    // Удаляем старую отрисовку, если есть
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const x = index === 0 ? 200 : 520;
      const y = 380;

      // Рамка (подсвечивается, если это активный персонаж)
      const isActive = (index === this.activeCharIndex);
      const borderColor = isActive ? 0x33cc66 : 0x444488;
      
      const bg = this.add.rectangle(x, y, 280, 120, 0x222244).setStrokeStyle(4, borderColor);
      
      const name = this.add.text(x, y - 30, `${char.name} ${isActive ? '(ХОД)' : ''}`, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
      
      // HP бар
      const hpBarBg = this.add.rectangle(x - 110, y + 20, 220, 15, 0x333333).setOrigin(0, 0.5);
      const hpPercent = Math.max(0, char.hp / char.maxHp);
      const hpBarFill = this.add.rectangle(x - 110, y + 20, 220 * hpPercent, 15, 0x33cc66).setOrigin(0, 0.5);
      
      const hpText = this.add.text(x, y + 20, `${char.hp}/${char.maxHp}`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

      // Клик по карточке для смены активного персонажа (если он жив и сейчас не анимация)
      if (char.hp > 0 && !this.isBusy && !this.isGameOver && !isActive) {
        bg.setInteractive();
        bg.on('pointerdown', () => {
          this.activeCharIndex = index;
          this.renderTeamUI(); // Перерисовываем интерфейс
        });
      }

      this.charContainers.push(bg, name, hpBarBg, hpBarFill, hpText);
    });
  }

  // ==========================================
  // ЛОГИКА ПОЛЯ (КАК В ФАРМЕ, НО С УРОНОМ)
  // ==========================================

  createBoard() {
    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        let colorIndex;
        let isMatch;
        do {
          isMatch = false;
          colorIndex = Phaser.Math.Between(0, this.COLORS.length - 1);
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
    const tile = this.add.rectangle(x, y, this.TILE_SIZE - this.GAP, this.TILE_SIZE - this.GAP, this.COLORS[colorIndex]);
    
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

  // ==========================================
  // МЕХАНИКА ОБМЕНА И СОВПАДЕНИЙ
  // ==========================================

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
    // Анимация выстрела игрока (снаряд летит от фишек к боссу)
    this.shootProjectile(tiles[0].x, tiles[0].y, this.bossSprite.x, this.bossSprite.y, 0x33cc66);

    // Наносим урон (10 урона за каждую фишку)
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
        const colorIndex = Phaser.Math.Between(0, this.COLORS.length - 1);
        const tile = this.createTile(row, col, colorIndex);
        tile.y = this.OFFSET_Y - (emptyRow - row + 1) * this.TILE_SIZE;
        this.grid[row][col] = tile;
        this.tweens.add({ targets: tile, y: this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
      }
    }

    this.time.delayedCall(350, () => {
      const newMatches = this.findMatches();
      if (newMatches.length > 0) {
        this.removeTiles(newMatches); // Каскадный урон
      } else {
        // Проверяем, не умер ли босс
        if (this.bossHp <= 0) {
          this.winGame();
        } else {
          // Если босс жив, наступает ЕГО ход
          this.bossTurn();
        }
      }
    });
  }

  // ==========================================
  // ХОД БОССА И СПОСОБНОСТИ
  // ==========================================

  bossTurn() {
    // Босс бьет того, кто ходил последним (активного персонажа)
    const target = this.team[this.activeCharIndex];
    
    // Если вдруг активный персонаж мертв, ищем живого
    if (target.hp <= 0) {
      const aliveIndex = this.team.findIndex(c => c.hp > 0);
      if (aliveIndex === -1) return; // Все мертвы
      this.activeCharIndex = aliveIndex;
      this.renderTeamUI();
      return this.bossTurn();
    }

    // Анимация выстрела босса
    this.shootProjectile(this.bossSprite.x, this.bossSprite.y, 360, 380, 0xff3333);

    // Урон босса (например, 40 урона)
    const bossDamage = 40;
    this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - bossDamage);
    
    this.time.delayedCall(400, () => {
      this.renderTeamUI(); // Обновляем ХП персонажей

      // Проверяем, не проиграл ли игрок
      const aliveChars = this.team.filter(c => c.hp > 0);
      if (aliveChars.length === 0) {
        this.loseGame();
      } else {
        // Если активный умер, переключаемся на живого
        if (this.team[this.activeCharIndex].hp <= 0) {
          this.activeCharIndex = this.team.findIndex(c => c.hp > 0);
          this.renderTeamUI();
        }
        this.isBusy = false; // Возвращаем ход игроку
      }
    });
  }

  // Универсальная функция полета снаряда
  shootProjectile(fromX, fromY, toX, toY, color) {
    const proj = this.add.circle(fromX, fromY, 15, color);
    this.tweens.add({
      targets: proj,
      x: toX, y: toY,
      duration: 300,
      onComplete: () => proj.destroy()
    });
  }

  updateBossHpUI() {
    const percent = Math.max(0, this.bossHp / this.bossData.maxHp);
    this.bossHpBar.width = 500 * percent;
    this.bossHpText.setText(`${this.bossHp}/${this.bossData.maxHp}`);
  }

  // ==========================================
  // АПТЕЧКА
  // ==========================================

  useMedkit() {
    if (this.isBusy || this.isGameOver) return;
    
    const target = this.team[this.activeCharIndex];
    
    // Проверяем: есть ли аптечки, жив ли персонаж, не фулл ли у него ХП
    if (Save.getMedkits() <= 0) return;
    if (target.hp <= 0) return;
    if (target.hp >= target.maxHp) return;

    // Лечим (например, на 100 ХП)
    const healAmount = 100;
    target.hp = Math.min(target.maxHp, target.hp + healAmount);
    
    // Списываем аптечку
    Save.data.player.medkits -= 1;
    Save.flush();

    // Обновляем интерфейс
    this.medkitText.setText(`💊 x${Save.getMedkits()}`);
    this.renderTeamUI();
    
    // Визуальный эффект лечения
    this.shootProjectile(690, 520, 360, 380, 0x33ff66);
  }

  // ==========================================
  // КОНЕЦ ИГРЫ
  // ==========================================

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
