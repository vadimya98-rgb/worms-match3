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
    this.OFFSET_Y = 580;

    this.bossHp = this.bossData.maxHp;
    this.bossArmor = this.bossData.armor;
    this.isBusy = false;
    this.isGameOver = false;
    this.playerStunned = false; 
    this.bossStunned = false;
    this.bossSkipNextTurn = false; // Для робота
    
    // Эффекты дебаффов на боссе
    this.bleedTurns = 0;
    this.poisonTurns = 0;

    // Счетчик ходов для контр-удара (раз в 3 хода)
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
    this.pool = this.bossData.weapons;
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  buildUI() {
    this.add.text(360, 40, this.bossData.name, { fontSize: '32px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
    
    this.add.rectangle(360, 80, 500, 30, 0x333333).setStrokeStyle(2, 0xffffff);
    this.bossHpBar = this.add.rectangle(110, 80, 500, 30, 0xff3333).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(360, 80, `${this.bossHp}/${this.bossData.maxHp}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

    if (this.bossArmor > 0) {
      this.add.rectangle(360, 115, 500, 15, 0x333333).setStrokeStyle(2, 0xaaaaaa);
      this.bossArmorBar = this.add.rectangle(110, 115, 500, 15, 0x3399ff).setOrigin(0, 0.5);
      this.bossArmorText = this.add.text(360, 115, `Броня: ${this.bossArmor}`, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    }

    // Иконки дебаффов
    this.debuffText = this.add.text(360, 150, '', { fontSize: '20px', color: '#ff3333', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

    this.bossSprite = this.add.image(360, 240, 'boss' + this.bossIndex);
    this.bossSprite.setDisplaySize(160, 160);

    this.charContainers = [];
    this.renderTeamUI();

    this.medkitText = this.add.text(690, 520, `💊 x${Save.getMedkits()}`, { 
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 15, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(1, 0.5);
    this.medkitText.setInteractive();
    this.medkitText.on('pointerdown', () => this.useMedkit());

    // Кнопка КОНТР-УДАРА (пока неактивна)
    this.ultBtn = this.add.text(30, 520, '🔥\nУДАР', { 
      fontSize: '22px', color: '#888888', backgroundColor: '#222222', align: 'center', padding: { x: 10, y: 10 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0, 0.5);
    this.ultBtn.setInteractive();
    this.ultBtn.on('pointerdown', () => this.useCounterAttack());
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const x = index === 0 ? 200 : 520;
      const y = 420;
      const isActive = (index === this.activeCharIndex);
      const borderColor = isActive ? 0x33cc66 : 0x444488;
      
      const bg = this.add.rectangle(x, y, 280, 120, 0x222244, 0.9).setStrokeStyle(4, borderColor);
      
      const charImg = this.add.image(x - 90, y, char.id);
      charImg.setDisplaySize(70, 70);

      const name = this.add.text(x + 10, y - 30, `${char.name} ${isActive ? '(ХОД)' : ''}`, { 
        fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 
      }).setOrigin(0.5);
      
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

  updateUltButton() {
    // Активируется каждый 3-й ход
    if (this.playerMovesCount >= 3) {
      this.ultBtn.setColor('#ffffff');
      this.ultBtn.setBackgroundColor('#ff6600');
    } else {
      this.ultBtn.setColor('#888888');
      this.ultBtn.setBackgroundColor('#222222');
    }
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
    const weaponId = tiles[0].colorIndex;
    const weapon = WEAPONS[weaponId];
    
    this.shootProjectile(tiles[0].x, tiles[0].y, this.bossSprite.x, this.bossSprite.y, 0x33cc66);
    
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

    // Увеличиваем счетчик ходов для контр-удара
    this.playerMovesCount++;
    this.updateUltButton();

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

  // ==========================================
  // КОНТР-УДАР
  // ==========================================
  useCounterAttack() {
    // Если кнопка неактивна или идет анимация - игнорируем
    if (this.playerMovesCount < 3 || this.isBusy || this.isGameOver) return;

    this.isBusy = true;
    this.playerMovesCount = 0;
    this.updateUltButton();

    const activeChar = this.team[this.activeCharIndex];
    
    // Анимация выстрела от персонажа к боссу
    this.shootProjectile(activeChar.x || 360, 420, this.bossSprite.x, this.bossSprite.y, 0xffaa00);

    // Применяем эффекты в зависимости от расы
    let ultDamage = 0;
    if (activeChar.id === 'dragon') {
      ultDamage = 70;
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 40, 'ОГОНЬ!', '#ff5500');
    } else if (activeChar.id === 'cat') {
      ultDamage = 40;
      this.bleedTurns += 2; // 2 хода кровотечения
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 40, 'КРОВОТЕЧЕНИЕ!', '#ff0000');
    } else if (activeChar.id === 'robot') {
      ultDamage = 80;
      this.bossSkipNextTurn = true; // Босс пропустит ход
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 40, 'ЭЛЕКТРОШОК!', '#ffff00');
    } else if (activeChar.id === 'zombie') {
      ultDamage = 25;
      this.poisonTurns += 5; // 5 ходов яда
      this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 40, 'ЯД!', '#00ff00');
    }

    this.bossHp = Math.max(0, this.bossHp - ultDamage);
    this.updateBossHpUI();
    this.updateDebuffUI();

    // После контр-удара ход переходит к боссу
    this.time.delayedCall(600, () => {
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

  // ==========================================
  // ХОД БОССА
  // ==========================================
  bossTurn() {
    if (this.isGameOver) return;

    // Проверяем, не пропускает ли босс ход (от робота)
    if (this.bossSkipNextTurn) {
      this.bossSkipNextTurn = false;
      this.showFloatingText(360, 200, 'БОСС ОГЛУШЕН', '#ffff00');
      this.isBusy = false;
      return;
    }

    // Применяем дебаффы (яд и кровь) ПЕРЕД ходом босса
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

    this.shootProjectile(this.bossSprite.x, this.bossSprite.y, 360, 420, 0xff3333);
    
    if (bossWeapon.stun) {
      this.playerStunned = true;
      this.showFloatingText(360, 420, 'ВЫ ЗАМОРОЖЕНЫ!', '#33ccff');
    }

    this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - bossWeapon.damage);
    this.showFloatingText(360, 420, `-${bossWeapon.damage}`, '#ff3333');

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

  shootProjectile(fromX, fromY, toX, toY, color) {
    const proj = this.add.circle(fromX, fromY, 15, color);
    this.tweens.add({ targets: proj, x: toX, y: toY, duration: 300, onComplete: () => proj.destroy() });
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, { fontSize: '24px', color: color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  updateBossHpUI() {
    const percent = Math.max(0, this.bossHp / this.bossData.maxHp);
    this.bossHpBar.width = 500 * percent;
    this.bossHpText.setText(`${this.bossHp}/${this.bossData.maxHp}`);

    if (this.bossArmorBar) {
      const armorPercent = Math.max(0, this.bossArmor / this.bossData.armor);
      this.bossArmorBar.width = 500 * armorPercent;
      this.bossArmorText.setText(`Броня: ${this.bossArmor}`);
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
    this.shootProjectile(690, 520, 360, 420, 0x33ff66);
    this.showFloatingText(360, 420, `+100`, '#33ff66');
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
