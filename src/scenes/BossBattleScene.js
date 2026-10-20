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
    this.OFFSET_Y = 380; // Опустили сетку, чтобы было место для эффектов сверху

    this.bossHp = this.bossData.maxHp;
    this.bossArmor = this.bossData.armor;
    this.isBusy = false;
    this.isGameOver = false;
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
    // Генерируем текстуру для частиц (белый квадрат), чтобы делать взрывы
    if (!this.textures.exists('white_pixel')) {
      const g = this.make.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 8, 8);
      g.generateTexture('white_pixel', 8, 8);
      g.destroy();
    }

    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.4);

    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  buildUI() {
    // Подложка для верхней панели (босс)
    this.add.rectangle(360, 180, 700, 320, 0x000000, 0.5).setStrokeStyle(2, 0x444488);

    // Кнопка СДАТЬСЯ
    const surrenderBtn = this.add.text(680, 30, '🏳️', { fontSize: '32px' }).setOrigin(1, 0.5);
    surrenderBtn.setInteractive();
    surrenderBtn.on('pointerdown', () => {
      this.scene.start('BossListScene');
    });

    this.add.text(360, 30, this.bossData.name, { fontSize: '32px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
    
    // КРУПНЫЙ БОСС
    this.bossSprite = this.add.image(360, 200, 'boss' + this.bossIndex);
    this.bossSprite.setDisplaySize(180, 180);
    
    // Запоминаем изначальную позицию для анимации отдачи
    this.bossStartX = 360;

    // ВЕРТИКАЛЬНАЯ ПОЛОСКА HP СЛЕВА (С закруглением)
    this.add.rectangle(160, 200, 26, 180, 0x222222).setStrokeStyle(2, 0xffffff);
    this.bossHpBar = this.add.rectangle(160, 290, 22, 176, 0xff3333).setOrigin(0.5, 1);
    this.bossHpText = this.add.text(160, 300, `${this.bossHp}`, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);

    // ВЕРТИКАЛЬНАЯ ПОЛОСКА БРОНИ СПРАВА
    if (this.bossArmor > 0) {
      this.add.rectangle(560, 200, 16, 180, 0x222222).setStrokeStyle(2, 0xaaaaaa);
      this.bossArmorBar = this.add.rectangle(560, 290, 12, 176, 0x3399ff).setOrigin(0.5, 1);
      this.bossArmorText = this.add.text(560, 300, `${this.bossArmor}`, { fontSize: '16px', color: '#33ccff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);
    }

    this.debuffText = this.add.text(360, 320, '', { fontSize: '18px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

    this.charContainers = [];
    this.renderTeamUI();

    this.medkitText = this.add.text(30, 1180, `💊 x${Save.getMedkits()}`, { 
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 15, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.medkitText.setInteractive();
    this.medkitText.on('pointerdown', () => this.useMedkit());
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const isActive = (index === this.activeCharIndex);
      const x = isActive ? 360 : 150;
      const y = 1050; 
      
      const borderColor = isActive ? 0x33cc66 : 0x444488;
      
      const bgCircle = this.add.circle(x, y, 65, 0x222244, 0.9).setStrokeStyle(4, borderColor);
      
      if (isActive) {
        bgCircle.setInteractive();
        bgCircle.on('pointerdown', () => { this.useCounterAttack(); });
      } else if (char.hp > 0 && !this.isBusy && !this.isGameOver) {
        bgCircle.setInteractive();
        bgCircle.on('pointerdown', () => { this.activeCharIndex = index; this.renderTeamUI(); });
      }
      
      const charImg = this.add.image(x, y, char.id);
      charImg.setDisplaySize(110, 110);

      const name = this.add.text(x, y - 115, `${char.name}`, { fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

      const hpBarBg = this.add.rectangle(x - 55, y - 85, 110, 14, 0x333333).setOrigin(0, 0.5);
      const hpPercent = Math.max(0, char.hp / char.maxHp);
      const hpBarFill = this.add.rectangle(x - 55, y - 85, 110 * hpPercent, 14, 0x33cc66).setOrigin(0, 0.5);
      const hpText = this.add.text(x, y - 105, `${char.hp}/${char.maxHp}`, { fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);

      // Пульсирующий огонек контр-удара
      if (isActive && this.playerMovesCount >= 3 && !this.isBusy && !this.isGameOver) {
        const fireIcon = this.add.text(x + 45, y - 45, '🔥', { fontSize: '36px' }).setOrigin(0.5);
        this.tweens.add({ targets: fireIcon, scale: 1.3, duration: 400, yoyo: true, repeat: -1 });
        this.charContainers.push(fireIcon);
      }

      this.charContainers.push(bgCircle, charImg, name, hpBarBg, hpBarFill, hpText);
    });
  }

  createBoard() {
    // Подложка для сетки
    this.add.rectangle(360, this.OFFSET_Y + (this.ROWS * this.TILE_SIZE) / 2, this.COLS * this.TILE_SIZE + 20, this.ROWS * this.TILE_SIZE + 20, 0x000000, 0.6);

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
    const weaponId = tiles[0].colorIndex;
    const weapon = WEAPONS[weaponId];
    
    // ЗАПУСКАЕМ КРАСИВУЮ АНИМАЦИЮ
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
      this.tweens.add({ targets: tile, scale: 0, alpha: 0, duration: 150, onComplete: () => tile.destroy() });
    });

    this.playerMovesCount++;
    this.renderTeamUI();

    this.time.delayedCall(600, () => this.applyGravity()); // Даем время анимации долететь
  }

  // ==========================================
  // СОЧНЫЕ АНИМАЦИИ ОРУЖИЯ
  // ==========================================
  playWeaponAnimation(weaponId, startX, startY) {
    const endX = this.bossSprite.x;
    const endY = this.bossSprite.y;

    if (weaponId === 0) { 
      // БАЗУКА: Виляет по синусоиде
      let proj = this.add.circle(startX, startY, 10, 0xffaa00);
      let trail = this.add.particles(0, 0, 'white_pixel', { speed: 0, lifespan: 300, scale: {start: 1, end: 0}, alpha: {start: 0.8, end: 0}, tint: 0x888888 });
      
      this.tweens.addCounter({
        from: 0, to: 1, duration: 400, ease: 'Linear',
        onUpdate: (tween) => {
          let t = tween.getValue();
          let currentX = Phaser.Math.Linear(startX, endX, t) + Math.sin(t * Math.PI * 4) * 40; // Волна
          let currentY = Phaser.Math.Linear(startY, endY, t);
          proj.x = currentX; proj.y = currentY;
          trail.setPosition(currentX, currentY);
        },
        onComplete: () => {
          proj.destroy(); trail.destroy(); this.hitBoss();
        }
      });

    } else if (weaponId === 1) { 
      // ГРАНАТА: Летит по дуге
      let proj = this.add.circle(startX, startY, 12, 0x33cc66);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 400, ease: 'Linear',
        onUpdate: (tween) => {
          let t = tween.getValue();
          let currentX = Phaser.Math.Linear(startX, endX, t);
          let currentY = Phaser.Math.Linear(startY, endY, t) - Math.sin(t * Math.PI) * 150; // Дуга вверх
          proj.x = currentX; proj.y = currentY;
        },
        onComplete: () => {
          proj.destroy(); this.hitBoss();
        }
      });

    } else if (weaponId === 4 || weaponId === 5) { 
      // МИНА (обычная или ледяная): Появляется прямо под боссом
      const color = weaponId === 4 ? 0xff0000 : 0x33ccff;
      let mine = this.add.circle(endX, endY + 50, 15, color);
      this.time.delayedCall(200, () => { mine.destroy(); this.hitBoss(); });
      
    } else { 
      // ОСТАЛЬНЫЕ (Динамит, Сверлящая): Прямой быстрый выстрел
      let proj = this.add.circle(startX, startY, 10, 0xff00ff);
      this.tweens.add({
        targets: proj, x: endX, y: endY, duration: 250,
        onComplete: () => { proj.destroy(); this.hitBoss(); }
      });
    }
  }

  // Эффект попадания по боссу (Вспышка, Взрыв, Отдача)
  hitBoss() {
    // Тряска и отдача
    this.cameras.main.shake(150, 0.015);
    this.bossSprite.setTint(0xffffff);
    
    let flash = this.add.circle(this.bossSprite.x, this.bossSprite.y, 20, 0xffffff, 0.8);
    this.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    this.tweens.add({
      targets: this.bossSprite,
      x: this.bossStartX + 30, // Отлетает вправо
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
    if (this.playerMovesCount < 3 || this.isBusy || this.isGameOver) return;

    this.isBusy = true;
    this.playerMovesCount = 0;
    this.renderTeamUI();

    const activeChar = this.team[this.activeCharIndex];
    
    // Анимация контр-удара (мощная)
    this.cameras.main.shake(300, 0.03);
    
    let proj = this.add.circle(360, 1050, 20, 0xffaa00);
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
    if (this.isGameOver) return;

    if (this.bossSkipNextTurn) {
      this.bossSkipNextTurn = false;
      this.showFloatingText(360, 200, 'БОСС ОГЛУШЕН', '#ffff00');
      this.isBusy = false;
      return;
    }

    let debuffDamage = 0;
    if (this.poisonTurns > 0) {
      debuffDamage += 20;
      this.poisonTurns--;
    }
    if (this.bleedTurns > 0) {
      debuffDamage += 25;
      this.bleedTurns--;
    }

    if (debuffDamage > 0) {
      this.bossHp = Math.max(0, this.bossHp - debuffDamage);
      this.updateBossHpUI();
      this.updateDebuffUI();
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 30, `-${debuffDamage}`, '#ff00ff');
      this.hitBoss(); // Вспышка при уроне от яда/крови
      
      if (this.bossHp <= 0) {
        this.winGame();
        return;
      }
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

    // СОЧНАЯ АНИМАЦИЯ ВЫСТРЕЛА БОССА
    this.bossSprite.setTint(0xff0000); // Босс краснеет
    this.cameras.main.shake(200, 0.01);
    
    let proj = this.add.circle(this.bossSprite.x, this.bossSprite.y, 15, 0xff3333);
    this.tweens.add({
      targets: proj, x: 360, y: 1050, duration: 300, ease: 'Power2',
      onComplete: () => {
        proj.destroy();
        this.bossSprite.clearTint();
        this.cameras.main.shake(150, 0.015); // Тряска при получении урона
        
        if (bossWeapon.stun) {
          this.playerStunned = true;
          this.showFloatingText(360, 1050, 'ВЫ ЗАМОРОЖЕНЫ!', '#33ccff');
        }

        this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - bossWeapon.damage);
        this.showFloatingText(360, 1050, `-${bossWeapon.damage}`, '#ff3333');

        // Красная вспышка на персонаже
        this.charContainers.forEach(c => {
            if (c.type === 'Image' && c.texture.key === this.team[this.activeCharIndex].id) {
                c.setTint(0xff0000);
                this.time.delayedCall(200, () => c.clearTint());
            }
        });

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
    this.bossHpBar.height = 176 * hpPercent;
    this.bossHpText.setText(`${this.bossHp}`);

    if (this.bossArmorBar) {
      const armorPercent = Math.max(0, this.bossArmor / this.bossData.armor);
      this.bossArmorBar.height = 176 * armorPercent;
      this.bossArmorText.setText(`${this.bossArmor}`);
    }
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
    this.showFloatingText(360, 1050, `+100`, '#33ff66');
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
