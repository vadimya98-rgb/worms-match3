import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { WEAPONS } from '../data/weapons.js';
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
    this.OFFSET_Y = 380;

    this.bossHp = this.bossData.maxHp;
    this.bossArmor = this.bossData.armor;
    this.isBusy = false;
    this.isGameOver = false;
    this.isPaused = false; // Для окна сдачи
    
    this.playerStunned = false; 
    this.bossStunned = false;
    this.bossSkipNextTurn = false; 
    
    this.bleedTurns = 0;
    this.poisonTurns = 0;
    this.playerMovesCount = 0;
    
    this.team = data.team.map(id => {
      const char = getCharacterData(id);
      const state = Save.getCharacter(id);
      const maxHp = getCharacterMaxHp(id, state.level);
      return { id: id, name: char.name, hp: maxHp, maxHp: maxHp };
    });

    this.activeCharIndex = 0; 
    this.selectedTile = null;
    this.grid = [];
    this.pool = [0, 1, 2, 3, 4, 5];
  }

  create() {
    // Текстура для частиц
    if (!this.textures.exists('white_pixel')) {
      const g = this.make.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 8, 8);
      g.generateTexture('white_pixel', 8, 8);
      g.destroy();
    }

    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.5);

    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  buildUI() {
    // 1. КНОПКА СДАТЬСЯ (Сверху по центру)
    this.createSurrenderBtn();

    // 2. ЗОНА БОССА
    this.add.text(360, 100, this.bossData.name, { fontSize: '36px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    
    // Подиум (Рисуем графикой)
    this.podiumGraphics = this.add.graphics();
    this.drawPodium();

    // Босс
    this.bossSprite = this.add.image(360, 230, 'boss' + this.bossIndex);
    this.bossSprite.setDisplaySize(160, 160);
    this.bossStartX = 360;

    // 3. НЕОНОВАЯ ПОЛОСКА HP БОССА
    this.bossHpBarBg = this.add.graphics();
    this.bossHpBarBg.lineStyle(6, 0x000000, 0.8);
    this.bossHpBarBg.strokeRoundedRect(110, 330, 500, 30, 15);
    
    this.bossHpBar = this.add.graphics();
    this.bossHpText = this.add.text(360, 345, `${this.bossHp}`, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // Иконки дебаффов
    this.debuffText = this.add.text(360, 300, '', { fontSize: '18px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // 4. ПЕРСОНАЖИ ИГРОКА
    this.charContainers = [];
    this.renderTeamUI();

    // Аптечка (слева внизу)
    this.createMedkitBtn();

    this.updateBossHpUI();
  }

  createSurrenderBtn() {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x000000, 0.6);
    btnBg.fillRoundedRect(260, 20, 200, 50, 15);
    btnBg.lineStyle(2, 0xffffff, 0.5);
    btnBg.strokeRoundedRect(260, 20, 200, 50, 15);

    const txt = this.add.text(360, 45, '🏳️ СДАТЬСЯ', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    const btnZone = this.add.zone(360, 45, 200, 50).setInteractive();
    btnZone.on('pointerdown', () => this.showSurrenderModal());
  }

  showSurrenderModal() {
    if (this.isPaused) return;
    this.isPaused = true;

    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(200);
    const panel = this.add.graphics().setDepth(201);
    panel.fillStyle(0x222244, 1);
    panel.fillRoundedRect(160, 500, 400, 280, 20);
    panel.lineStyle(4, 0xff3333, 1);
    panel.strokeRoundedRect(160, 500, 400, 280, 20);

    const title = this.add.text(360, 560, 'ВЫ УВЕРЕНЫ?', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);
    const sub = this.add.text(360, 610, 'Прогресс боя будет потерян', { fontSize: '18px', color: '#aaa' }).setOrigin(0.5).setDepth(202);

    // Кнопка ДА (Красная)
    const yesBtn = this.add.text(260, 700, 'ДА', { fontSize: '32px', color: '#fff', backgroundColor: '#aa2222', padding: {x:30, y:10} }).setOrigin(0.5).setDepth(202).setInteractive();
    yesBtn.on('pointerdown', () => this.scene.start('BossListScene'));

    // Кнопка НЕТ (Зеленая)
    const noBtn = this.add.text(460, 700, 'НЕТ', { fontSize: '32px', color: '#fff', backgroundColor: '#22aa44', padding: {x:30, y:10} }).setOrigin(0.5).setDepth(202).setInteractive();
    noBtn.on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); title.destroy(); sub.destroy(); yesBtn.destroy(); noBtn.destroy();
      this.isPaused = false;
    });
  }

  drawPodium() {
    this.podiumGraphics.clear();
    // Основание
    this.podiumGraphics.fillStyle(0x333333, 1);
    this.podiumGraphics.fillRoundedRect(240, 300, 240, 40, 10);
    this.podiumGraphics.fillStyle(0x555555, 1);
    this.podiumGraphics.fillRoundedRect(230, 290, 260, 15, 10);
    
    // Трещины в зависимости от HP
    const hpPercent = this.bossHp / this.bossData.maxHp;
    this.podiumGraphics.lineStyle(3, 0x000000, 0.8);
    
    if (hpPercent < 0.7) {
      // Первая трещина
      this.podiumGraphics.beginPath();
      this.podiumGraphics.moveTo(300, 295);
      this.podiumGraphics.lineTo(320, 310);
      this.podiumGraphics.lineTo(310, 330);
      this.podiumGraphics.strokePath();
    }
    if (hpPercent < 0.4) {
      // Вторая трещина
      this.podiumGraphics.beginPath();
      this.podiumGraphics.moveTo(420, 295);
      this.podiumGraphics.lineTo(400, 315);
      this.podiumGraphics.lineTo(430, 340);
      this.podiumGraphics.strokePath();
    }
    if (hpPercent < 0.15) {
      // Осколки
      this.podiumGraphics.fillStyle(0x222222, 1);
      this.podiumGraphics.fillTriangle(280, 340, 300, 350, 290, 360);
      this.podiumGraphics.fillTriangle(440, 340, 450, 360, 430, 350);
    }
  }

  createMedkitBtn() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(20, 1160, 140, 60, 15);
    
    this.add.text(40, 1190, '💊', { fontSize: '30px' }).setOrigin(0, 0.5);
    this.medkitText = this.add.text(90, 1190, `x${Save.getMedkits()}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);

    const zone = this.add.zone(90, 1190, 140, 60).setInteractive();
    zone.on('pointerdown', () => this.useMedkit());
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const isActive = (index === this.activeCharIndex);
      const x = isActive ? 360 : 150;
      const y = 1060; 
      
      // Полупрозрачный круг
      const bgCircle = this.add.graphics();
      bgCircle.fillStyle(0x000000, 0.5);
      bgCircle.fillCircle(x, y, 65);
      
      // Неоновое свечение
      let neonColor = 0x444488; // Обычный
      if (isActive) neonColor = 0x33cc66; // Активный зеленый
      if (isActive && this.playerMovesCount >= 3) neonColor = 0xff0000; // Готов удар - КРАСНЫЙ

      bgCircle.lineStyle(6, neonColor, 1);
      bgCircle.strokeCircle(x, y, 65);
      bgCircle.lineStyle(2, 0xffffff, 0.8); // Внутренний блик
      bgCircle.strokeCircle(x, y, 60);
      
      const charImg = this.add.image(x, y, char.id);
      charImg.setDisplaySize(110, 110);

      // Имя под персонажем (на английском)
      const nameEng = char.id.charAt(0).toUpperCase() + char.id.slice(1);
      const name = this.add.text(x, y + 85, nameEng, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);

      // Неоновая полоска HP над персонажем
      const barW = 100;
      const hpPercent = Math.max(0, char.hp / char.maxHp);
      
      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x000000, 0.8);
      hpBg.fillRoundedRect(x - barW/2, y - 95, barW, 16, 8);
      
      const hpFill = this.add.graphics();
      hpFill.fillStyle(0x33ff66, 1);
      hpFill.fillRoundedRect(x - barW/2 + 2, y - 93, (barW - 4) * hpPercent, 12, 6);

      const hpText = this.add.text(x, y - 87, `${char.hp}`, { fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

      // Огонек удара
      if (isActive && this.playerMovesCount >= 3 && !this.isBusy && !this.isGameOver) {
        const fireIcon = this.add.text(x + 50, y - 50, '🔥', { fontSize: '36px' }).setOrigin(0.5);
        this.tweens.add({ targets: fireIcon, scale: 1.4, duration: 300, yoyo: true, repeat: -1 });
        this.charContainers.push(fireIcon);
      }

      // Интерактивность
      if (isActive) {
        const hitZone = this.add.zone(x, y, 130, 130).setInteractive();
        hitZone.on('pointerdown', () => { if(this.playerMovesCount >= 3) this.useCounterAttack(); });
        this.charContainers.push(hitZone);
      } else if (char.hp > 0 && !this.isBusy && !this.isGameOver) {
        const hitZone = this.add.zone(x, y, 130, 130).setInteractive();
        hitZone.on('pointerdown', () => { this.activeCharIndex = index; this.renderTeamUI(); });
        this.charContainers.push(hitZone);
      }

      this.charContainers.push(bgCircle, charImg, name, hpBg, hpFill, hpText);
    });
  }

  createBoard() {
    // КРАСИВАЯ ПОДЛОЖКА СЕТКИ
    const boardW = this.COLS * this.TILE_SIZE + 20;
    const boardH = this.ROWS * this.TILE_SIZE + 20;
    
    const boardBg = this.add.graphics();
    boardBg.fillStyle(0x000000, 0.5);
    boardBg.fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);
    boardBg.lineStyle(4, 0x444488, 0.8);
    boardBg.strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);

    // СЕТКА (линии)
    const gridLines = this.add.graphics();
    gridLines.lineStyle(2, 0xffffff, 0.1);
    for(let i=1; i<this.COLS; i++) {
        gridLines.lineBetween(this.OFFSET_X + i*this.TILE_SIZE, this.OFFSET_Y, this.OFFSET_X + i*this.TILE_SIZE, this.OFFSET_Y + boardH - 20);
    }
    for(let i=1; i<this.ROWS; i++) {
        gridLines.lineBetween(this.OFFSET_X, this.OFFSET_Y + i*this.TILE_SIZE, this.OFFSET_X + boardW - 20, this.OFFSET_Y + i*this.TILE_SIZE);
    }

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
    
    // Подложка для каждого оружия
    const tileBg = this.add.graphics();
    tileBg.fillStyle(0xffffff, 0.1);
    tileBg.fillRoundedRect(x - this.TILE_SIZE/2 + 2, y - this.TILE_SIZE/2 + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4, 12);

    const tile = this.add.image(x, y, 'weapon' + colorIndex);
    tile.setDisplaySize(this.TILE_SIZE - this.GAP - 10, this.TILE_SIZE - this.GAP - 10);
    
    tile.gridRow = row;
    tile.gridCol = col;
    tile.colorIndex = colorIndex;
    tile.bg = tileBg; // Привязываем фон, чтобы удалять вместе

    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver || this.isPaused) return;
      if (!this.selectedTile) {
        this.selectedTile = tile;
        tile.setTint(0xaaaaaa);
      } else if (this.selectedTile === tile) {
        this.selectedTile.clearTint();
        this.selectedTile = null;
      } else {
        const firstTile = this.selectedTile;
        firstTile.clearTint();
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
      if (this.isBusy || this.isGameOver || this.isPaused) return;
      startX = pointer.x; startY = pointer.y;
      const col = Math.floor((pointer.x - this.OFFSET_X) / this.TILE_SIZE);
      const row = Math.floor((pointer.y - this.OFFSET_Y) / this.TILE_SIZE);
      if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) startTile = this.grid[row][col];
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isBusy || this.isGameOver || this.isPaused || !startTile) return;
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

    // Двигаем и картинку, и её подложку
    this.tweens.add({ 
      targets: [tile1, tile1.bg, tile2, tile2.bg], 
      x: (target) => {
        if (target === tile1) return this.OFFSET_X + tile1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
        if (target === tile2) return this.OFFSET_X + tile2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2;
        return target.x; // Для подложек не двигаем X, мы их просто удалим и пересоздадим ниже
      },
      y: (target) => {
        if (target === tile1) return this.OFFSET_Y + tile1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
        if (target === tile2) return this.OFFSET_Y + tile2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2;
        return target.y;
      },
      duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) {
            // Уничтожаем старые подложки
            tile1.bg.destroy(); tile2.bg.destroy();
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
    const weaponId = tiles[0].colorIndex;
    const weapon = WEAPONS[weaponId];
    
    this.playWeaponAnimation(weaponId, tiles[0].x, tiles[0].y);

    let damageToHp = weapon.damage;
    let damageToArmor = 0;

    if (weapon.armorPierce > 0 && this.bossArmor > 0) {
      damageToArmor = weapon.armorPierce; 
      damageToHp = 0;                     
    } else if (this.bossArmor > 0) {
      damageToArmor = weapon.damage;      
      damageToHp = 0;
    }

    if (damageToArmor > 0) this.bossArmor = Math.max(0, this.bossArmor - damageToArmor);
    if (damageToHp > 0) this.bossHp = Math.max(0, this.bossHp - damageToHp);

    if (weapon.stun) {
      this.bossStunned = true;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'ЗАМОРОЖЕН!', '#33ccff');
    }

    this.updateBossHpUI();

    tiles.forEach(tile => {
      this.grid[tile.gridRow][tile.gridCol] = null;
      tile.bg.destroy(); // Удаляем подложку
      this.tweens.add({ targets: tile, scale: 0, alpha: 0, duration: 150, onComplete: () => tile.destroy() });
    });

    this.playerMovesCount++;
    this.renderTeamUI();

    this.time.delayedCall(600, () => this.applyGravity()); 
  }

  playWeaponAnimation(weaponId, startX, startY) {
    const endX = this.bossSprite.x;
    const endY = this.bossSprite.y;
    let proj;

    if (weaponId === 0) { 
      // БАЗУКА
      proj = this.add.circle(startX, startY, 10, 0xffaa00);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 400, ease: 'Linear',
        onUpdate: (tween) => {
          let t = tween.getValue();
          proj.x = Phaser.Math.Linear(startX, endX, t) + Math.sin(t * Math.PI * 4) * 40;
          proj.y = Phaser.Math.Linear(startY, endY, t);
        },
        onComplete: () => { proj.destroy(); this.hitBoss(); }
      });
    } else if (weaponId === 1) { 
      // ГРАНАТА
      proj = this.add.circle(startX, startY, 12, 0x33cc66);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 400, ease: 'Linear',
        onUpdate: (tween) => {
          let t = tween.getValue();
          proj.x = Phaser.Math.Linear(startX, endX, t);
          proj.y = Phaser.Math.Linear(startY, endY, t) - Math.sin(t * Math.PI) * 150;
        },
        onComplete: () => { proj.destroy(); this.hitBoss(); }
      });
    } else if (weaponId === 4 || weaponId === 5) { 
      // МИНА
      const color = weaponId === 4 ? 0xff0000 : 0x33ccff;
      proj = this.add.circle(endX, endY + 50, 15, color);
      this.time.delayedCall(200, () => { proj.destroy(); this.hitBoss(); });
    } else { 
      // ПРЯМОЙ ВЫСТРЕЛ
      proj = this.add.circle(startX, startY, 10, 0xff00ff);
      this.tweens.add({
        targets: proj, x: endX, y: endY, duration: 250,
        onComplete: () => { proj.destroy(); this.hitBoss(); }
      });
    }
  }

  hitBoss() {
    this.cameras.main.shake(150, 0.015);
    this.bossSprite.setTint(0xffffff);
    
    let flash = this.add.circle(this.bossSprite.x, this.bossSprite.y, 20, 0xffffff, 0.8);
    this.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    this.tweens.add({
      targets: this.bossSprite,
      x: this.bossStartX + 30,
      duration: 50,
      yoyo: true,
      onComplete: () => { this.bossSprite.clearTint(); this.bossSprite.x = this.bossStartX; }
    });
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
            // Двигаем картинку
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
        else {
          if (this.bossStunned) {
            this.bossStunned = false;
            this.showFloatingText(360, 200, 'ХОД БОССА ПРОПУЩЕН', '#33ccff');
            this.isBusy = false;
          } else {
            this.bossTurn();
          }
        }
      }
    });
  }

  useCounterAttack() {
    if (this.playerMovesCount < 3 || this.isBusy || this.isGameOver || this.isPaused) return;

    this.isBusy = true;
    this.playerMovesCount = 0;
    this.renderTeamUI();

    const activeChar = this.team[this.activeCharIndex];
    
    this.cameras.main.shake(300, 0.03);
    
    let proj = this.add.circle(360, 1060, 25, 0xffaa00);
    this.tweens.add({
      targets: proj, x: this.bossSprite.x, y: this.bossSprite.y, duration: 300, ease: 'Power2',
      onComplete: () => { proj.destroy(); this.hitBoss(); }
    });

    let ultDamage = 0;
    if (activeChar.id === 'dragon') {
      ultDamage = 70;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'ОГОНЬ!', '#ff5500');
    } else if (activeChar.id === 'cat') {
      ultDamage = 40;
      this.bleedTurns += 2;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'КРОВОТЕЧЕНИЕ!', '#ff0000');
    } else if (activeChar.id === 'robot') {
      ultDamage = 80;
      this.bossSkipNextTurn = true;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'ЭЛЕКТРОШОК!', '#ffff00');
    } else if (activeChar.id === 'zombie') {
      ultDamage = 25;
      this.poisonTurns += 5;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'ЯД!', '#00ff00');
    }

    this.bossHp = Math.max(0, this.bossHp - ultDamage);
    this.updateBossHpUI();
    this.updateDebuffUI();

    this.time.delayedCall(800, () => {
      if (this.bossHp <= 0) this.winGame();
      else this.bossTurn();
    });
  }

  updateDebuffUI() {
    let text = '';
    if (this.poisonTurns > 0) text += `☠️ Яд: ${this.poisonTurns} х.  `;
    if (this.bleedTurns > 0) text += `🩸 Кровь: ${this.bleedTurns} х.`;
    this.debuffText.setText(text);
  }

  bossTurn() {
    if (this.isGameOver || this.isPaused) return;

    if (this.bossSkipNextTurn) {
      this.bossSkipNextTurn = false;
      this.showFloatingText(360, 200, 'БОСС ОГЛУШЕН', '#ffff00');
      this.isBusy = false;
      return;
    }

    let debuffDamage = 0;
    if (this.poisonTurns > 0) { debuffDamage += 20; this.poisonTurns--; }
    if (this.bleedTurns > 0) { debuffDamage += 25; this.bleedTurns--; }

    if (debuffDamage > 0) {
      this.bossHp = Math.max(0, this.bossHp - debuffDamage);
      this.updateBossHpUI();
      this.updateDebuffUI();
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 30, `-${debuffDamage}`, '#ff00ff');
      this.hitBoss();
      
      if (this.bossHp <= 0) { this.winGame(); return; }
    }

    const target = this.team[this.activeCharIndex];
    if (target.hp <= 0) {
      const aliveIndex = this.team.findIndex(c => c.hp > 0);
      if (aliveIndex === -1) return;
      this.activeCharIndex = aliveIndex;
      this.renderTeamUI();
      return this.bossTurn();
    }

    const bossWeaponId = Phaser.Utils.Array.GetRandom(this.bossData.weapons);
    const bossWeapon = WEAPONS[bossWeaponId];

    this.bossSprite.setTint(0xff0000);
    this.cameras.main.shake(200, 0.01);
    
    let proj = this.add.circle(this.bossSprite.x, this.bossSprite.y, 15, 0xff3333);
    this.tweens.add({
      targets: proj, x: 360, y: 1060, duration: 300, ease: 'Power2',
      onComplete: () => {
        proj.destroy();
        this.bossSprite.clearTint();
        this.cameras.main.shake(150, 0.015);
        
        if (bossWeapon.stun) {
          this.playerStunned = true;
          this.showFloatingText(360, 1060, 'ВЫ ЗАМОРОЖЕНЫ!', '#33ccff');
        }

        this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - bossWeapon.damage);
        this.showFloatingText(360, 1060, `-${bossWeapon.damage}`, '#ff3333');

        this.time.delayedCall(400, () => {
          this.renderTeamUI();
          const aliveChars = this.team.filter(c => c.hp > 0);
          if (aliveChars.length === 0) this.loseGame();
          else {
            if (this.team[this.activeCharIndex].hp <= 0) {
              this.activeCharIndex = this.team.findIndex(c => c.hp > 0);
              this.renderTeamUI();
            }
            
            if (this.playerStunned) {
              this.playerStunned = false;
              this.time.delayedCall(800, () => this.bossTurn()); 
            } else {
              this.isBusy = false;
            }
          }
        });
      }
    });
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, { fontSize: '32px', color: color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 80, alpha: 0, duration: 1200, onComplete: () => txt.destroy() });
  }

  updateBossHpUI() {
    const hpPercent = Math.max(0, this.bossHp / this.bossData.maxHp);
    
    // Меняем цвет (от зеленого к красному)
    let color = 0x33ff66; // Зеленый
    if (hpPercent < 0.6) color = 0xffcc00; // Желтый
    if (hpPercent < 0.3) color = 0xff3333; // Красный

    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(color, 1);
    this.bossHpBar.fillRoundedRect(113, 333, 494 * hpPercent, 24, 12);
    
    // Блик для неона
    this.bossHpBar.fillStyle(0xffffff, 0.3);
    this.bossHpBar.fillRoundedRect(113, 333, 494 * hpPercent, 10, 6);

    this.bossHpText.setText(`${this.bossHp}`);
    this.drawPodium(); // Перерисовываем подиум (появляются трещины)
  }

  useMedkit() {
    if (this.isBusy || this.isGameOver || this.isPaused) return;
    const target = this.team[this.activeCharIndex];
    if (Save.getMedkits() <= 0 || target.hp <= 0 || target.hp >= target.maxHp) return;

    target.hp = Math.min(target.maxHp, target.hp + 100);
    Save.data.player.medkits -= 1;
    Save.flush();

    this.medkitText.setText(`x${Save.getMedkits()}`);
    this.renderTeamUI();
    this.showFloatingText(360, 1060, `+100`, '#33ff66');
  }

  winGame() {
    this.isGameOver = true;
    Save.data.bosses[this.bossData.id] = 'defeated';
    Save.addFuzz(this.bossData.reward);

    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(100);
    
    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x222244, 1);
    panel.fillRoundedRect(160, 440, 400, 400, 20);
    panel.lineStyle(4, 0x33cc66, 1);
    panel.strokeRoundedRect(160, 440, 400, 400, 20);

    this.add.text(360, 520, 'ПОБЕДА!', { fontSize: '56px', color: '#33cc66', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Награда: ${this.bossData.reward} Фузов`, { fontSize: '32px', color: '#ffcc66' }).setOrigin(0.5).setDepth(102);

    const btn = this.add.text(360, 740, 'ЗАБРАТЬ', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 50, y: 20 } }).setOrigin(0.5).setDepth(102).setInteractive();
    btn.on('pointerdown', () => this.scene.start('BossListScene'));
  }

  loseGame() {
    this.isGameOver = true;
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.8).setDepth(100);
    
    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x222244, 1);
    panel.fillRoundedRect(160, 440, 400, 400, 20);
    panel.lineStyle(4, 0xff3333, 1);
    panel.strokeRoundedRect(160, 440, 400, 400, 20);

    this.add.text(360, 520, 'ПОРАЖЕНИЕ', { fontSize: '56px', color: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Босс оказался сильнее...`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(102);

    const btn = this.add.text(360, 740, 'В МЕНЮ', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 50, y: 20 } }).setOrigin(0.5).setDepth(102).setInteractive();
    btn.on('pointerdown', () => this.scene.start('BossListScene'));
  }
}
