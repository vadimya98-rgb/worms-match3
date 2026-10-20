import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { WEAPONS } from '../data/weapons.js';
import { getCharacterData, getCharacterMaxHp } from '../data/characters.js';

export default class BossBattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BossBattleScene' }); }

  init(data) {
    this.bossData = BOSSES[data.bossIndex];
    this.bossIndex = data.bossIndex;
    
    this.COLS = 6; this.ROWS = 6; this.TILE_SIZE = 85; this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 400;

    this.bossHp = this.bossData.maxHp;
    this.bossArmor = this.bossData.armor;
    this.isBusy = false; this.isGameOver = false; this.isPaused = false;
    this.playerMovesCount = 0;
    this.bleedTurns = 0; this.poisonTurns = 0;
    
    this.team = data.team.map(id => {
      const char = getCharacterData(id);
      const state = Save.getCharacter(id);
      return { id: id, name: char.name, hp: getCharacterMaxHp(id, state.level), maxHp: getCharacterMaxHp(id, state.level) };
    });

    this.activeCharIndex = 0; this.selectedTile = null; this.grid = [];
    this.pool = [0, 1, 2, 3, 4, 5];
  }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.6);

    // Радужная рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.4).strokeRect(8, 8, 704, 1264);
        this.borderGraphics.lineStyle(2, 0xffffff, 0.8).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    this.buildUI();
    this.createBoard();
    this.setupInput();
  }

  buildUI() {
    // Кнопка СДАТЬСЯ
    const surrenderBtn = this.add.container(360, 40);
    const sBg = this.add.graphics().fillStyle(0x222244, 0.8).fillRoundedRect(-80, -25, 160, 50, 15).lineStyle(2, 0xff3333, 0.8).strokeRoundedRect(-80, -25, 160, 50, 15);
    surrenderBtn.add([sBg, this.add.text(0, 0, '🏳️ СДАТЬСЯ', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    surrenderBtn.setSize(160, 50).setInteractive().on('pointerdown', () => this.showSurrenderModal());

    this.add.text(360, 100, this.bossData.name, { fontSize: '40px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    
    // УВЕЛИЧЕННЫЙ БОСС
    this.bossSprite = this.add.image(360, 230, 'boss' + this.bossIndex).setDisplaySize(200, 200);
    this.bossStartX = 360;

    // РАЗРУШАЕМЫЙ ПОДИУМ
    this.podiumGraphics = this.add.graphics();
    this.drawPodium();

    // Неоновая полоса HP
    this.bossHpBarBg = this.add.graphics().lineStyle(6, 0x000000, 0.8).strokeRoundedRect(110, 340, 500, 30, 15);
    this.bossHpBar = this.add.graphics();
    this.bossHpText = this.add.text(360, 355, `${this.bossHp}`, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    this.updateBossHpUI();

    this.debuffText = this.add.text(360, 385, '', { fontSize: '18px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.charContainers = [];
    this.renderTeamUI();
    this.createMedkitBtn();
  }

  drawPodium() {
    this.podiumGraphics.clear();
    this.podiumGraphics.fillStyle(0x333333, 1).fillRoundedRect(210, 320, 300, 40, 10);
    this.podiumGraphics.fillStyle(0x555555, 1).fillRoundedRect(200, 310, 320, 15, 10);

    const hpPct = this.bossHp / this.bossData.maxHp;
    this.podiumGraphics.lineStyle(4, 0x000000, 1);

    // Трещины в зависимости от HP
    if (hpPct < 0.75) {
      this.podiumGraphics.beginPath().moveTo(280, 315).lineTo(310, 335).lineTo(290, 360).strokePath();
    }
    if (hpPct < 0.5) {
      this.podiumGraphics.beginPath().moveTo(450, 315).lineTo(420, 340).lineTo(450, 360).strokePath();
      this.podiumGraphics.fillStyle(0x222222, 1).fillTriangle(310, 340, 330, 360, 300, 360);
    }
    if (hpPct < 0.25) {
      this.podiumGraphics.beginPath().moveTo(360, 315).lineTo(340, 350).lineTo(380, 360).strokePath();
      this.podiumGraphics.fillTriangle(440, 330, 460, 360, 420, 360);
      this.podiumGraphics.fillTriangle(260, 330, 280, 360, 240, 360);
    }
  }

  createMedkitBtn() {
    const g = this.add.graphics().fillStyle(0x000000, 0.6).fillRoundedRect(20, 1160, 140, 60, 15);
    this.add.text(40, 1190, '💊', { fontSize: '30px' }).setOrigin(0, 0.5);
    this.medkitText = this.add.text(90, 1190, `x${Save.getMedkits()}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.zone(90, 1190, 140, 60).setInteractive().on('pointerdown', () => this.useMedkit());
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const isActive = (index === this.activeCharIndex);
      const x = isActive ? 360 : 150;
      const y = 1060; 
      
      const bgCircle = this.add.graphics().fillStyle(0x000000, 0.5).fillCircle(x, y, 65);
      let neonColor = isActive ? 0x33cc66 : 0x444488;
      if (isActive && this.playerMovesCount >= 3) neonColor = 0xff0000; // Ярко-красный неон

      bgCircle.lineStyle(8, neonColor, 0.4).strokeCircle(x, y, 65);
      bgCircle.lineStyle(3, neonColor, 1).strokeCircle(x, y, 65);

      const charImg = this.add.image(x, y, char.id).setDisplaySize(110, 110);
      const nameEng = char.id.charAt(0).toUpperCase() + char.id.slice(1);
      const name = this.add.text(x, y + 85, nameEng, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

      const hpBg = this.add.graphics().fillStyle(0x000000, 0.8).fillRoundedRect(x - 50, y - 95, 100, 16, 8);
      const hpFill = this.add.graphics().fillStyle(0x33ff66, 1).fillRoundedRect(x - 50 + 2, y - 93, 96 * (char.hp/char.maxHp), 12, 6);
      const hpText = this.add.text(x, y - 87, `${char.hp}`, { fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

      if (isActive && this.playerMovesCount >= 3 && !this.isBusy && !this.isGameOver) {
        const fireIcon = this.add.text(x + 50, y - 50, '🔥', { fontSize: '36px' }).setOrigin(0.5);
        this.tweens.add({ targets: fireIcon, scale: 1.4, duration: 300, yoyo: true, repeat: -1 });
        this.charContainers.push(fireIcon);
      }

      const hitZone = this.add.zone(x, y, 130, 130).setInteractive();
      hitZone.on('pointerdown', () => { 
        if (isActive) { if(this.playerMovesCount >= 3) this.useCounterAttack(); }
        else if (char.hp > 0 && !this.isBusy) { this.activeCharIndex = index; this.renderTeamUI(); }
      });

      this.charContainers.push(bgCircle, charImg, name, hpBg, hpFill, hpText, hitZone);
    });
  }

  createBoard() {
    const boardW = this.COLS * this.TILE_SIZE + 20;
    const boardH = this.ROWS * this.TILE_SIZE + 20;
    
    this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25).lineStyle(4, 0x444488, 0.8).strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);

    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        let colorIndex, isMatch;
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
    
    const tileBg = this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(x - this.TILE_SIZE/2 + 2, y - this.TILE_SIZE/2 + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4, 12);
    const tile = this.add.image(x, y, 'weapon' + colorIndex).setDisplaySize(this.TILE_SIZE - this.GAP - 10, this.TILE_SIZE - this.GAP - 10);
    tile.gridRow = row; tile.gridCol = col; tile.colorIndex = colorIndex; tile.bg = tileBg;

    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver || this.isPaused) return;
      if (!this.selectedTile) { this.selectedTile = tile; tile.setTint(0xaaaaaa); }
      else if (this.selectedTile === tile) { this.selectedTile.clearTint(); this.selectedTile = null; }
      else {
        const firstTile = this.selectedTile; firstTile.clearTint(); this.selectedTile = null;
        if (this.areNeighbors(firstTile, tile)) this.swapTiles(firstTile, tile);
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
      if (this.isBusy || this.isGameOver || this.isPaused) return;
      startX = p.x; startY = p.y;
      const c = Math.floor((p.x - this.OFFSET_X) / this.TILE_SIZE);
      const r = Math.floor((p.y - this.OFFSET_Y) / this.TILE_SIZE);
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) startTile = this.grid[r][c];
    });

    this.input.on('pointerup', (p) => {
      if (this.isBusy || this.isGameOver || this.isPaused || !startTile) return;
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
        if (matches.length > 0) { t1.bg.destroy(); t2.bg.destroy(); this.removeTiles(matches); }
        else this.swapBack(t1, t2);
      }
    });
  }

  swapBack(t1, t2) {
    this.grid[t1.gridRow][t1.gridCol] = t2; this.grid[t2.gridRow][t2.gridCol] = t1;
    const tr = t1.gridRow; t1.gridRow = t2.gridRow; t2.gridRow = tr;
    const tc = t1.gridCol; t1.gridCol = t2.gridCol; t2.gridCol = tc;
    this.tweens.add({ targets: [t1, t2], x: (t) => this.OFFSET_X + t.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2, y: (t) => this.OFFSET_Y + t.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 200, ease: 'Back.easeIn', onComplete: () => { this.isBusy = false; } });
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
    const weapon = WEAPONS[tiles[0].colorIndex];
    this.playWeaponAnimation(tiles[0].colorIndex, tiles[0].x, tiles[0].y);

    let dmgHp = weapon.damage, dmgArmor = 0;
    if (weapon.armorPierce > 0 && this.bossArmor > 0) { dmgArmor = weapon.armorPierce; dmgHp = 0; }
    else if (this.bossArmor > 0) { dmgArmor = weapon.damage; dmgHp = 0; }

    if (dmgArmor > 0) this.bossArmor = Math.max(0, this.bossArmor - dmgArmor);
    if (dmgHp > 0) this.bossHp = Math.max(0, this.bossHp - dmgHp);

    this.updateBossHpUI();
    tiles.forEach(t => { this.grid[t.gridRow][t.gridCol] = null; t.bg.destroy(); t.destroy(); });
    this.playerMovesCount++; this.renderTeamUI();
    this.time.delayedCall(600, () => this.applyGravity());
  }

  // ==========================================
  // МЕДЛЕННЫЕ И ЗРЕЛИЩНЫЕ СНАРЯДЫ
  // ==========================================
  playWeaponAnimation(wId, sx, sy) {
    const ex = this.bossSprite.x, ey = this.bossSprite.y;
    let proj;

    if (wId === 0) { // БАЗУКА (Кружит по экрану)
      proj = this.add.circle(sx, sy, 12, 0xffaa00).setDepth(50);
      let trail = this.add.particles(0, 0, 'white_pixel', { speed: 0, lifespan: 500, scale: {start: 1.5, end: 0}, alpha: {start: 0.8, end: 0}, tint: 0xffaa00 }).setDepth(49);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 1800, ease: 'Sine.easeInOut',
        onUpdate: (tween) => {
          let t = tween.getValue();
          // Траектория "восьмерка"
          let cx = Phaser.Math.Linear(sx, ex, t) + Math.sin(t * Math.PI * 2) * 150;
          let cy = Phaser.Math.Linear(sy, ey, t) - Math.cos(t * Math.PI * 4) * 100;
          proj.x = cx; proj.y = cy; trail.setPosition(cx, cy);
        },
        onComplete: () => { proj.destroy(); trail.destroy(); this.hitBoss(); }
      });
    } else if (wId === 1) { // ГРАНАТА (Высокая дуга)
      proj = this.add.circle(sx, sy, 15, 0x33cc66).setDepth(50);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 1200, ease: 'Linear',
        onUpdate: (tween) => {
          let t = tween.getValue();
          proj.x = Phaser.Math.Linear(sx, ex, t);
          proj.y = Phaser.Math.Linear(sy, ey, t) - Math.sin(t * Math.PI) * 250;
        },
        onComplete: () => { proj.destroy(); this.hitBoss(); }
      });
    } else if (wId === 3) { // СВЕРЛЯЩАЯ (Вращается и летит)
      proj = this.add.star(sx, sy, 4, 5, 15, 0xff00ff).setDepth(50);
      this.tweens.add({ targets: proj, angle: 720, duration: 1000 });
      this.tweens.add({ targets: proj, x: ex, y: ey, duration: 1000, ease: 'Power1', onComplete: () => { proj.destroy(); this.hitBoss(); } });
    } else { // МИНЫ (Подрыв прямо под боссом)
      proj = this.add.circle(ex, ey + 80, 20, wId===4?0xff0000:0x33ccff).setDepth(50);
      this.tweens.add({ targets: proj, y: ey, alpha: 0, duration: 600, delay: 200, onComplete: () => { proj.destroy(); this.hitBoss(); } });
    }
  }

  hitBoss() {
    this.cameras.main.shake(200, 0.02);
    this.bossSprite.setTint(0xffffff);
    
    // Взрыв
    let flash = this.add.circle(this.bossSprite.x, this.bossSprite.y, 30, 0xffffff, 1).setDepth(51);
    this.tweens.add({ targets: flash, scale: 6, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Отдача
    this.tweens.add({ targets: this.bossSprite, x: this.bossStartX + 40, duration: 50, yoyo: true, onComplete: () => { this.bossSprite.clearTint(); this.bossSprite.x = this.bossStartX; } });
  }

  applyGravity() {
    for (let c = 0; c < this.COLS; c++) {
      let emptyRow = this.ROWS - 1;
      for (let r = this.ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (r !== emptyRow) {
            const t = this.grid[r][c]; this.grid[emptyRow][c] = t; this.grid[r][c] = null; t.gridRow = emptyRow;
            this.tweens.add({ targets: t, y: this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
          }
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        const ci = Phaser.Utils.Array.GetRandom(this.pool);
        const t = this.createTile(r, c, ci);
        t.y = this.OFFSET_Y - (emptyRow - r + 1) * this.TILE_SIZE;
        this.grid[r][c] = t;
        this.tweens.add({ targets: t, y: this.OFFSET_Y + r * this.TILE_SIZE + this.TILE_SIZE / 2, duration: 250, ease: 'Bounce.easeOut' });
      }
    }
    this.time.delayedCall(350, () => {
      const nm = this.findMatches();
      if (nm.length > 0) this.removeTiles(nm);
      else {
        if (this.bossHp <= 0) this.winGame();
        else if (this.bossStunned) { this.bossStunned = false; this.isBusy = false; }
        else this.bossTurn();
      }
    });
  }

  useCounterAttack() {
    if (this.playerMovesCount < 3 || this.isBusy || this.isGameOver || this.isPaused) return;
    this.isBusy = true; this.playerMovesCount = 0; this.renderTeamUI();
    
    this.cameras.main.shake(300, 0.03);
    let proj = this.add.circle(360, 1060, 30, 0xffaa00).setDepth(50);
    this.tweens.add({ targets: proj, x: this.bossSprite.x, y: this.bossSprite.y, duration: 600, ease: 'Power2', onComplete: () => { proj.destroy(); this.hitBoss(); } });

    let dmg = 70; // Пример для дракона
    this.bossHp = Math.max(0, this.bossHp - dmg); this.updateBossHpUI();
    this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, 'УДАР!', '#ff5500');

    this.time.delayedCall(1000, () => { if (this.bossHp <= 0) this.winGame(); else this.bossTurn(); });
  }

  bossTurn() {
    if (this.isGameOver || this.isPaused) return;
    
    // Дебаффы (упрощенно для примера)
    if (this.poisonTurns > 0) { this.bossHp = Math.max(0, this.bossHp - 20); this.poisonTurns--; this.updateBossHpUI(); this.hitBoss(); }

    this.bossSprite.setTint(0xff0000);
    let proj = this.add.circle(this.bossSprite.x, this.bossSprite.y, 20, 0xff3333).setDepth(50);
    
    // Снаряд босса летит по дуге вниз
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1000, ease: 'Linear',
      onUpdate: (tween) => {
        let t = tween.getValue();
        proj.x = Phaser.Math.Linear(this.bossSprite.x, 360, t);
        proj.y = Phaser.Math.Linear(this.bossSprite.y, 1060, t) - Math.sin(t * Math.PI) * 150;
      },
      onComplete: () => {
        proj.destroy(); this.bossSprite.clearTint(); this.cameras.main.shake(200, 0.02);
        this.team[this.activeCharIndex].hp = Math.max(0, this.team[this.activeCharIndex].hp - 40); // Пример урона
        this.renderTeamUI();
        this.time.delayedCall(500, () => { if (this.team[this.activeCharIndex].hp <= 0) this.loseGame(); else this.isBusy = false; });
      }
    });
  }

  updateBossHpUI() {
    const pct = Math.max(0, this.bossHp / this.bossData.maxHp);
    let color = 0x33ff66; if (pct < 0.6) color = 0xffcc00; if (pct < 0.3) color = 0xff3333;
    this.bossHpBar.clear().fillStyle(color, 1).fillRoundedRect(113, 343, 494 * pct, 24, 12);
    this.bossHpBar.fillStyle(0xffffff, 0.4).fillRoundedRect(113, 343, 494 * pct, 8, 4); // Блик
    this.bossHpText.setText(`${this.bossHp}`);
    this.drawPodium();
  }

  useMedkit() { /* Логика аптечки */ }
  
  showSurrenderModal() {
    if (this.isPaused) return; this.isPaused = true;
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
    const panel = this.add.graphics().setDepth(101).fillStyle(0x222244, 1).fillRoundedRect(160, 500, 400, 280, 25).lineStyle(4, 0xff3333, 1).strokeRoundedRect(160, 500, 400, 280, 25);
    this.add.text(360, 560, 'ВЫ УВЕРЕНЫ?', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    
    const yes = this.add.text(260, 680, 'ДА', { fontSize: '32px', color: '#fff', backgroundColor: '#aa2222', padding: {x:30, y:10} }).setOrigin(0.5).setDepth(102).setInteractive();
    yes.on('pointerdown', () => this.scene.start('BossListScene'));

    const no = this.add.text(460, 680, 'НЕТ', { fontSize: '32px', color: '#fff', backgroundColor: '#22aa44', padding: {x:30, y:10} }).setOrigin(0.5).setDepth(102).setInteractive();
    no.on('pointerdown', () => { overlay.destroy(); panel.destroy(); this.children.list.filter(c=>c.depth>=102).forEach(c=>c.destroy()); this.isPaused = false; });
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, { fontSize: '32px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: txt, y: y - 80, alpha: 0, duration: 1200, onComplete: () => txt.destroy() });
  }

  winGame() { /* Логика победы */ }
  loseGame() { /* Логика поражения */ }
}
