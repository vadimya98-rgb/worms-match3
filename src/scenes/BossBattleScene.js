import { Save } from '../data/save.js';
import { BOSSES } from '../data/bosses.js';
import { WEAPONS } from '../data/weapons.js';
import { getCharacterData, getCharacterMaxHp, getCharacterMaxArmor } from '../data/characters.js';

export default class BossBattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BossBattleScene' }); }

  init(data) {
    this.bossData = BOSSES[data.bossIndex];
    this.bossIndex = data.bossIndex;
    
    this.COLS = 8; this.ROWS = 8;
    this.TILE_SIZE = 72; 
    this.GAP = 4;
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 350; 

    this.bossHp = this.bossData.maxHp;
    this.bossArmor = this.bossData.armor;
    this.isBusy = false; this.isGameOver = false; this.isPaused = false;
    this.playerMovesCount = 0;
    this.bossPoisonTurns = 0; 
    this.bossPoisonCloud = null; 
    
    // ФЛАГИ ОГРАНИЧЕНИЯ ПРЕДМЕТОВ (1 РАЗ ЗА БОЙ)
    this.medkitUsed = false;
    this.antitoxinUsed = false;
    
    const validTeam = data.team ? data.team.filter(id => id !== null) : [];
    
    this.team = validTeam.map(id => {
      const char = getCharacterData(id);
      const state = Save.getCharacter(id);
      if (!char) return null; 

      let maxHp = getCharacterMaxHp(id, state.level);
      let maxArmor = getCharacterMaxArmor(id, state.armorLevel);
      
      return { 
          id: id, name: char.name, 
          hp: maxHp, maxHp: maxHp,
          armor: maxArmor, maxArmor: maxArmor,
          antitoxinTurns: 0 
      };
    }).filter(c => c !== null);

    if (this.team.length === 0) {
        this.scene.start('BossListScene');
        return;
    }

    this.activeCharIndex = 0; this.selectedTile = null; this.grid = [];
    this.pool = [0, 1, 2, 3, 4, 5];
  }

  create() {
    if (!this.textures.exists('white_pixel')) {
      const g = this.make.graphics();
      g.fillStyle(0xffffff); g.fillRect(0, 0, 8, 8);
      g.generateTexture('white_pixel', 8, 8); g.destroy();
    }

    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.buildUI();
    this.createBoard();
    this.setupInput();
    
    this.showTurnBanner('ВАШ ХОД', 0x2ecc71);
  }

  buildUI() {
    const surrenderBtn = this.add.container(360, 40);
    const sBg = this.add.graphics().fillStyle(0xe74c3c, 1).fillRoundedRect(-90, -25, 180, 50, 15).lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(-90, -25, 180, 50, 15);
    surrenderBtn.add([sBg, this.add.text(0, 0, '🏳️ СДАТЬСЯ', { fontSize: '20px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5)]);
    surrenderBtn.setSize(180, 50).setInteractive().on('pointerdown', () => this.showSurrenderModal());

    this.add.text(360, 100, this.bossData.name, { fontSize: '36px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    
    this.bossSprite = this.add.image(360, 220, 'boss' + this.bossIndex).setDisplaySize(160, 160);
    this.bossStartX = 360; this.bossStartY = 220;

    this.podiumGraphics = this.add.graphics();
    this.drawPodium();

    this.add.rectangle(180, 220, 24, 140, 0x333333).setStrokeStyle(2, 0xffffff);
    this.bossHpBar = this.add.graphics();
    this.bossHpText = this.add.text(180, 300, `${this.bossHp}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);

    if (this.bossArmor > 0) {
        this.add.rectangle(540, 220, 16, 140, 0x333333).setStrokeStyle(2, 0xaaaaaa);
        this.bossArmorBar = this.add.graphics();
        this.bossArmorText = this.add.text(540, 300, `${this.bossArmor}`, { fontSize: '14px', color: '#33ccff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);
    }

    this.updateBossHpUI();

    this.debuffText = this.add.text(360, 310, '', { fontSize: '16px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    this.charContainers = [];
    this.renderTeamUI();
    
    let antiCount = Save.getAntitoxins ? Save.getAntitoxins() : 0;
    
    // АПТЕЧКА
    this.medkitBg = this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(20, 1080, 140, 60, 15).lineStyle(3, 0x3498db, 1).strokeRoundedRect(20, 1080, 140, 60, 15);
    this.add.image(50, 1110, 'icon_medkit').setDisplaySize(36, 36);
    this.medkitText = this.add.text(130, 1110, `x${Save.getMedkits()}`, { fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0.5);
    this.medkitZone = this.add.zone(90, 1110, 140, 60).setInteractive().on('pointerdown', () => this.useItem('medkit'));

    // АНТИТОКСИН
    this.antitoxinBg = this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(20, 1160, 140, 60, 15).lineStyle(3, 0x00f0ff, 1).strokeRoundedRect(20, 1160, 140, 60, 15);
    this.add.image(50, 1190, 'icon_antitoksin').setDisplaySize(36, 36);
    this.antitoxinText = this.add.text(130, 1190, `x${antiCount}`, { fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0.5);
    this.antitoxinZone = this.add.zone(90, 1190, 140, 60).setInteractive().on('pointerdown', () => this.useItem('antitoxin'));
  }

  drawPodium() {
    this.podiumGraphics.clear();
    this.podiumGraphics.fillStyle(0x333333, 1).fillRoundedRect(210, 290, 300, 40, 10);
    this.podiumGraphics.fillStyle(0x555555, 1).fillRoundedRect(200, 280, 320, 15, 10);
    const hpPct = this.bossHp / this.bossData.maxHp;
    this.podiumGraphics.lineStyle(4, 0x000000, 1);
    if (hpPct < 0.75) this.podiumGraphics.beginPath().moveTo(280, 285).lineTo(310, 305).lineTo(290, 330).strokePath();
    if (hpPct < 0.5) {
      this.podiumGraphics.beginPath().moveTo(450, 285).lineTo(420, 310).lineTo(450, 330).strokePath();
      this.podiumGraphics.fillStyle(0x222222, 1).fillTriangle(310, 310, 330, 330, 300, 330);
    }
    if (hpPct < 0.25) {
      this.podiumGraphics.beginPath().moveTo(360, 285).lineTo(340, 320).lineTo(380, 330).strokePath();
      this.podiumGraphics.fillTriangle(440, 300, 460, 330, 420, 330);
      this.podiumGraphics.fillTriangle(260, 300, 280, 330, 240, 330);
    }
  }

  renderTeamUI() {
    this.charContainers.forEach(c => c.destroy());
    this.charContainers = [];

    this.team.forEach((char, index) => {
      const isActive = (index === this.activeCharIndex);
      const x = isActive ? 360 : 580; 
      const y = 1060; 
      
      const bgCircle = this.add.graphics().fillStyle(0x2c3e50, 0.9).fillCircle(x, y, 65);
      let neonColor = isActive ? 0x2ecc71 : 0x555555;
      if (isActive && this.playerMovesCount >= 3) neonColor = 0xe74c3c;

      bgCircle.lineStyle(8, neonColor, 0.3).strokeCircle(x, y, 65);
      bgCircle.lineStyle(4, neonColor, 1).strokeCircle(x, y, 65);

      const charImg = this.add.image(x, y, char.id).setDisplaySize(110, 110);
      
      const nameBg = this.add.graphics().fillStyle(0x000000, 0.7).fillRoundedRect(x - 60, y + 70, 120, 25, 10);
      const nameText = this.add.text(x, y + 82, `${char.hp} / ${char.maxHp}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

      const hpBg = this.add.graphics().fillStyle(0x000000, 0.8).fillRoundedRect(x - 50, y - 95, 100, 16, 8);
      const hpFill = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(x - 50 + 2, y - 93, 96 * (char.hp/char.maxHp), 12, 6);

      if (char.maxArmor > 0) {
          const armorBg = this.add.graphics().fillStyle(0x000000, 0.8).fillRoundedRect(x - 50, y - 75, 100, 10, 5);
          const armorFill = this.add.graphics().fillStyle(0x3498db, 1).fillRoundedRect(x - 50 + 2, y - 73, 96 * (char.armor/char.maxArmor), 6, 3);
          this.charContainers.push(armorBg, armorFill);
      }

      if (char.antitoxinTurns > 0) {
          const antiIcon = this.add.image(x, y - 120, 'icon_antitoksin').setDisplaySize(25, 25);
          this.charContainers.push(antiIcon);
      }

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

      this.charContainers.push(bgCircle, charImg, nameBg, nameText, hpBg, hpFill, hitZone);
    });
  }

  createBoard() {
    const boardW = this.COLS * this.TILE_SIZE + 20;
    const boardH = this.ROWS * this.TILE_SIZE + 20;
    this.add.graphics().fillStyle(0x2c3e50, 0.9).fillRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25).lineStyle(4, 0x3498db, 1).strokeRoundedRect(this.OFFSET_X - 10, this.OFFSET_Y - 10, boardW, boardH, 25);

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
    const tileBg = this.add.graphics().fillStyle(0x34495e, 1).fillRoundedRect(-this.TILE_SIZE/2 + 4, -this.TILE_SIZE/2 + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8, 15);
    tileBg.setPosition(x, y);
    const tile = this.add.image(x, y, 'weapon' + colorIndex).setDisplaySize(this.TILE_SIZE - this.GAP - 10, this.TILE_SIZE - this.GAP - 10);
    tile.gridRow = row; tile.gridCol = col; tile.colorIndex = colorIndex; tile.bg = tileBg;
    tile.setInteractive();
    tile.on('pointerdown', () => {
      if (this.isBusy || this.isGameOver || this.isPaused) return;
      if (!this.selectedTile) { this.selectedTile = tile; tile.setTint(0xaaaaaa); }
      else if (this.selectedTile === tile) { this.selectedTile.clearTint(); this.selectedTile = null; }
      else { const first = this.selectedTile; first.clearTint(); this.selectedTile = null; if (this.areNeighbors(first, tile)) this.swapTiles(first, tile); }
    });
    return tile;
  }

  areNeighbors(t1, t2) { return (Math.abs(t1.gridRow - t2.gridRow) === 1 && t1.gridCol === t2.gridCol) || (Math.abs(t1.gridCol - t2.gridCol) === 1 && t1.gridRow === t2.gridRow); }

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
    this.tweens.add({ targets: [t1, t1.bg, t2, t2.bg], x: (t) => (t === t1) ? this.OFFSET_X + t1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_X + t2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2 : t.x), y: (t) => (t === t1) ? this.OFFSET_Y + t1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : (t === t2 ? this.OFFSET_Y + t2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2 : t.y), duration: 200, ease: 'Back.easeOut', onComplete: () => {
      const matches = this.findMatches();
      if (matches.length > 0) { t1.bg.destroy(); t2.bg.destroy(); this.removeTiles(matches); }
      else this.swapBack(t1, t2);
    }});
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
    const groups = {};
    tiles.forEach(t => {
        if (!groups[t.colorIndex]) groups[t.colorIndex] = [];
        groups[t.colorIndex].push(t);
    });

    tiles.forEach(t => { 
        this.grid[t.gridRow][t.gridCol] = null; 
        t.bg.destroy(); 
        t.destroy(); 
    });

    let delayCounter = 0;

    for (let colorIndex in groups) {
        const group = groups[colorIndex];
        const wId = parseInt(colorIndex); 
        const weapon = WEAPONS[wId];
        
        let comboMult = 1;
        if (group.length === 4) comboMult = 1.5;
        if (group.length >= 5) comboMult = 2;

        let delay = delayCounter * 300; 
        delayCounter++;

        this.time.delayedCall(delay, () => {
            this.shootProjectile(wId, group[0].x, group[0].y, this.bossSprite.x, this.bossSprite.y, () => {
                let dmgHp = Math.floor(weapon.damage * comboMult);
                let dmgArmor = 0;

                if (weapon.armorPierce > 0 && this.bossArmor > 0) { dmgArmor = weapon.armorPierce * comboMult; dmgHp = 0; }
                else if (this.bossArmor > 0) { dmgArmor = weapon.damage * comboMult; dmgHp = 0; }

                if (dmgArmor > 0) {
                    this.bossArmor = Math.max(0, this.bossArmor - dmgArmor);
                    this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, `-${dmgArmor} БР.`, '#3498db');
                }
                if (dmgHp > 0) {
                    this.bossHp = Math.max(0, this.bossHp - dmgHp);
                    this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, `-${dmgHp}`, '#ff3333');
                }
                
                this.updateBossHpUI();
                if (weapon.stun) { this.bossStunned = true; this.bossSprite.setTint(0x00ffff); this.time.delayedCall(2500, () => this.bossSprite.clearTint()); }
                this.hitBoss();
                this.spawnSparks(this.bossSprite.x, this.bossSprite.y, 0xffaa00);
            });
        });
    }

    this.playerMovesCount++; 
    this.renderTeamUI();
    
    this.time.delayedCall(3500 + (delayCounter * 300), () => this.applyGravity());
  }

  showTurnBanner(text, colorNum) {
    this.isBusy = true;
    const bannerBg = this.add.graphics().fillStyle(0x000000, 0.8).fillRoundedRect(160, 600, 400, 100, 30).lineStyle(4, colorNum, 1).strokeRoundedRect(160, 600, 400, 100, 30).setDepth(200);
    const txt = this.add.text(360, 650, text, { fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(201);
    
    bannerBg.setScale(0); txt.setScale(0);
    this.tweens.add({ targets: [bannerBg, txt], scale: 1, duration: 400, ease: 'Back.easeOut' });
    
    this.time.delayedCall(1500, () => {
        this.tweens.add({ targets: [bannerBg, txt], alpha: 0, scale: 0.5, duration: 300, onComplete: () => {
            bannerBg.destroy(); txt.destroy();
            this.isBusy = false;
            this.renderTeamUI();
        }});
    });
  }

  shootProjectile(wId, sx, sy, tx, ty, onComplete) {
    let proj;
    if (wId === 0) { 
      proj = this.add.image(sx, sy, 'weapon0').setDisplaySize(40, 40).setDepth(150);
      this.tweens.addCounter({ from: 0, to: 1, duration: 2000, ease: 'Linear', onUpdate: (tw) => { let t = tw.getValue(); let radius = 150 * (1 - t); proj.x = Phaser.Math.Linear(sx, tx, t) + Math.sin(t * Math.PI * 10) * radius; proj.y = Phaser.Math.Linear(sy, ty, t) + Math.cos(t * Math.PI * 10) * radius; proj.angle += 10; }, onComplete: () => { proj.destroy(); onComplete(); } });
    } else if (wId === 1) { 
      proj = this.add.image(sx, sy, 'weapon1').setDisplaySize(30, 30).setDepth(150);
      this.tweens.addCounter({ from: 0, to: 1, duration: 1500, ease: 'Linear', onUpdate: (tw) => { let t = tw.getValue(); proj.x = Phaser.Math.Linear(sx, tx, t); proj.y = Phaser.Math.Linear(sy, ty, t) - Math.sin(t * Math.PI) * 150; proj.angle += 10; }, onComplete: () => { proj.destroy(); onComplete(); } });
    } else if (wId === 2) {
      proj = this.add.image(tx + 50, ty + 50, 'weapon2').setDisplaySize(50, 50).setDepth(150).setAlpha(0);
      this.tweens.add({ targets: proj, alpha: 1, duration: 500, onComplete: () => { this.time.delayedCall(1000, () => { proj.destroy(); let targetSprite = (sx === this.bossSprite.x) ? this.bossSprite : this.charContainers.find(c=>c.type==='Image'); if(targetSprite && targetSprite.y) { this.tweens.add({ targets: targetSprite, y: targetSprite.y - 60, duration: 200, yoyo: true, ease: 'Quad.easeOut', onComplete: onComplete }); } else { onComplete(); } }); }});
    } else if (wId === 3) { 
      proj = this.add.image(sx, sy, 'weapon3').setDisplaySize(35, 35).setDepth(150);
      this.tweens.addCounter({ from: 0, to: 1, duration: 1800, ease: 'Linear', onUpdate: (tw) => { let t = tw.getValue(); proj.x = Phaser.Math.Linear(sx, tx, t) + Math.sin(t * Math.PI * 8) * 100; proj.y = Phaser.Math.Linear(sy, ty, t) - Math.cos(t * Math.PI * 8) * 100; proj.angle += 20; }, onComplete: () => { proj.destroy(); onComplete(); } });
    } else if (wId === 4) { 
      proj = this.add.image(tx - 50, ty + 50, 'weapon4').setDisplaySize(40, 40).setDepth(150).setAlpha(0);
      this.tweens.add({ targets: proj, alpha: 1, duration: 500, onComplete: () => { this.time.delayedCall(1000, () => { proj.destroy(); let targetSprite = (sx === this.bossSprite.x) ? this.bossSprite : this.charContainers.find(c=>c.type==='Image'); if(targetSprite && targetSprite.x) { this.tweens.add({ targets: targetSprite, x: targetSprite.x + 60, duration: 150, yoyo: true, ease: 'Quad.easeOut', onComplete: onComplete }); } else { onComplete(); } }); }});
    } else { 
      proj = this.add.image(tx + 50, ty + 50, 'weapon5').setDisplaySize(40, 40).setDepth(150).setAlpha(0);
      this.tweens.add({ targets: proj, alpha: 1, duration: 500, onComplete: () => { this.time.delayedCall(1000, () => { proj.destroy(); this.cameras.main.flash(500, 0, 255, 255); onComplete(); }); }});
    }
  }

  spawnSparks(x, y, color) {
    let emitter = this.add.particles(x, y, 'white_pixel', { 
        speed: { min: 150, max: 400 }, angle: { min: 0, max: 360 }, 
        scale: { start: 1.5, end: 0 }, lifespan: 1000, quantity: 20, 
        tint: color, blendMode: 'ADD' 
    }).setDepth(160);
    
    let blood = this.add.particles(x, y, 'white_pixel', { 
        speed: { min: 50, max: 150 }, angle: { min: 45, max: 135 }, 
        gravityY: 800, scale: { start: 0.8, end: 0.2 }, 
        alpha: { start: 1, end: 0 }, lifespan: 1500, quantity: 15, 
        tint: 0xff0000 
    }).setDepth(159);
    
    this.time.delayedCall(1500, () => { emitter.destroy(); blood.destroy(); });
  }

  hitBoss() {
    this.cameras.main.shake(200, 0.03);
    this.bossSprite.setTint(0xffffff);
    let flash = this.add.circle(this.bossSprite.x, this.bossSprite.y, 50, 0xffffff, 1).setDepth(160);
    this.tweens.add({ targets: flash, scale: 8, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
    this.time.delayedCall(300, () => this.bossSprite.clearTint());
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
      if (nm.length > 0) {
          this.removeTiles(nm);
      } else {
        if (this.bossHp <= 0) this.winGame();
        else if (this.bossStunned) { 
            this.bossStunned = false; 
            this.showTurnBanner('ХОД БОССА ПРОПУЩЕН', 0x00ffff);
            this.time.delayedCall(1500, () => this.showTurnBanner('ВАШ ХОД', 0x2ecc71));
        }
        else this.bossTurn();
      }
    });
  }

  useCounterAttack() {
    if (this.playerMovesCount < 3 || this.isBusy || this.isGameOver || this.isPaused) return;
    this.isBusy = true; 
    this.playerMovesCount = 0; 
    this.renderTeamUI();

    const activeChar = this.team[this.activeCharIndex];
    const ex = this.bossSprite.x;
    const ey = this.bossSprite.y;
    const sx = 360;
    const sy = 1060;

    if (activeChar.id === 'dragon') {
        this.bossHp = Math.max(0, this.bossHp - 150); 
        this.updateBossHpUI();
        this.showFloatingText(ex, ey - 50, `-150`, '#ffaa00');
        let fire = this.add.text(sx, sy, '🔥', { fontSize: '50px' }).setDepth(150);
        this.tweens.add({ targets: fire, x: ex, y: ey, duration: 1000, ease: 'Power2', onComplete: () => {
            fire.destroy(); this.hitBoss(); this.spawnSparks(ex, ey, 0xff5500); this.bossSprite.setTint(0xff5500);
            this.time.delayedCall(1000, () => { this.bossSprite.clearTint(); this.endCounterAttack(); });
        }});
    } else if (activeChar.id === 'cat') {
        this.bossHp = Math.max(0, this.bossHp - 150); 
        this.updateBossHpUI();
        this.showFloatingText(ex, ey - 50, `-150`, '#ffaa00');
        this.cameras.main.flash(200, 255, 255, 255);
        let scratch = this.add.graphics().setDepth(160);
        scratch.lineStyle(8, 0xff0000, 1);
        scratch.lineBetween(ex - 40, ey - 40, ex + 40, ey + 40);
        scratch.lineBetween(ex - 20, ey - 50, ex + 60, ey + 30);
        scratch.lineBetween(ex - 60, ey - 30, ex + 20, ey + 50);
        this.bossSprite.setTint(0xff0000);
        this.time.delayedCall(300, () => { this.hitBoss(); this.spawnSparks(ex, ey, 0xff0000); this.tweens.add({ targets: scratch, alpha: 0, duration: 1000, onComplete: () => { scratch.destroy(); this.bossSprite.clearTint(); this.endCounterAttack(); } }); });
    } else if (activeChar.id === 'robot') {
        this.bossHp = Math.max(0, this.bossHp - 150); 
        this.updateBossHpUI();
        this.showFloatingText(ex, ey - 50, `-150`, '#ffaa00');
        this.cameras.main.flash(300, 0, 255, 255);
        let lightning = this.add.graphics().setDepth(160);
        lightning.lineStyle(6, 0x00ffff, 1);
        lightning.beginPath();
        lightning.moveTo(sx, sy);
        for(let i=1; i<=6; i++) lightning.lineTo(Phaser.Math.Linear(sx, ex, i/6) + Phaser.Math.Between(-40, 40), Phaser.Math.Linear(sy, ey, i/6));
        lightning.strokePath();
        this.bossSprite.setTint(0x00ffff);
        this.time.delayedCall(400, () => { lightning.destroy(); this.hitBoss(); this.spawnSparks(ex, ey, 0x00ffff); this.tweens.add({ targets: this.bossSprite, alpha: 0.5, duration: 100, yoyo: true, repeat: 3, onComplete: () => { this.bossSprite.setAlpha(1); this.bossSprite.clearTint(); this.endCounterAttack(); } }); });
    } else if (activeChar.id === 'zombie') {
        this.bossHp = Math.max(0, this.bossHp - 40); 
        this.bossPoisonTurns = 5;
        this.updateBossHpUI();
        this.showFloatingText(ex, ey - 50, `-40`, '#00ff00');
        
        let poison = this.add.circle(ex, ey, 80, 0x00ff00, 0.6).setDepth(160);
        if (this.bossPoisonCloud) this.bossPoisonCloud.destroy();
        this.bossPoisonCloud = this.add.circle(ex, ey, 80, 0x00ff00, 0.4).setDepth(140);
        this.tweens.add({ targets: this.bossPoisonCloud, alpha: 0.1, yoyo: true, repeat: -1, duration: 500 });

        this.tweens.add({ targets: poison, alpha: 0.1, yoyo: true, repeat: 4, duration: 300, onComplete: () => { poison.destroy(); this.hitBoss(); this.spawnSparks(ex, ey, 0x00ff00); this.bossSprite.setTint(0x00ff00); this.time.delayedCall(1000, () => { this.bossSprite.clearTint(); this.endCounterAttack(); }); } });
    }
  }

  endCounterAttack() { this.time.delayedCall(1000, () => { if (this.bossHp <= 0) this.winGame(); else this.bossTurn(); }); }

  bossTurn() {
    if (this.isGameOver || this.isPaused) return;
    this.showTurnBanner('ХОД БОССА', 0xe74c3c);

    this.time.delayedCall(2000, () => {
        this.team.forEach(char => {
            if (char.hp > 0 && char.antitoxinTurns > 0) {
                let heal = 70; // ИСПРАВЛЕНО: Лечение антитоксином 70 хп
                char.hp = Math.min(char.maxHp, char.hp + heal);
                char.antitoxinTurns--;
                this.showFloatingText(360, 1060, `+${heal}`, '#00f0ff');
            }
        });
        this.renderTeamUI();

        const bossWeaponId = Phaser.Utils.Array.GetRandom(this.bossData.weapons);
        const bossWeapon = WEAPONS[bossWeaponId];
        let bossDamage = Math.floor(bossWeapon.damage * 1.5 + this.bossData.level * 10); 

        this.shootProjectile(bossWeaponId, this.bossSprite.x, this.bossSprite.y, 360, 1060, () => {
            this.cameras.main.shake(200, 0.03);
            this.spawnSparks(360, 1060, 0xff0000); 
            
            let char = this.team[this.activeCharIndex];
            if (char.armor > 0) {
                if (char.armor >= bossDamage) {
                    char.armor -= bossDamage;
                    this.showFloatingText(360, 1060, `-${bossDamage} БР.`, '#3498db');
                    bossDamage = 0;
                } else {
                    bossDamage -= char.armor;
                    this.showFloatingText(360, 1060, `Броня сломана!`, '#3498db');
                    char.armor = 0;
                }
            }
            
            if (bossDamage > 0) {
                char.hp = Math.max(0, char.hp - bossDamage);
                this.showFloatingText(360, 1060, `-${bossDamage}`, '#ff0000'); 
            }
            
            this.renderTeamUI();
            
            if (bossWeapon.stun) this.showFloatingText(360, 1060, 'ЗАМОРОЖЕН', '#00ffff');

            this.time.delayedCall(1000, () => { 
                if (char.hp <= 0) { this.loseGame(); return; }

                if (this.bossPoisonTurns > 0) {
                    this.bossHp = Math.max(0, this.bossHp - 40);
                    this.bossPoisonTurns--;
                    this.updateBossHpUI();
                    this.showFloatingText(this.bossSprite.x, this.bossSprite.y - 50, `-40 ЯД`, '#00ff00');
                    this.hitBoss();
                    
                    if (this.bossPoisonTurns === 0 && this.bossPoisonCloud) {
                        this.bossPoisonCloud.destroy();
                        this.bossPoisonCloud = null;
                    }
                    
                    if (this.bossHp <= 0) { this.winGame(); return; }
                }

                this.showTurnBanner('ВАШ ХОД', 0x2ecc71);
            });
        });
    });
  }

  updateBossHpUI() {
    const pct = Math.max(0, this.bossHp / this.bossData.maxHp);
    let color = 0x2ecc71; if (pct < 0.6) color = 0xf1c40f; if (pct < 0.3) color = 0xe74c3c;
    
    this.bossHpBar.clear();
    if (pct > 0) {
        this.bossHpBar.fillStyle(color, 1).fillRoundedRect(170, 290 - (136 * pct), 20, 136 * pct, 6);
        this.bossHpBar.fillStyle(0xffffff, 0.4).fillRoundedRect(170, 290 - (136 * pct), 8, 136 * pct, 4); 
    }
    this.bossHpText.setText(`${this.bossHp}`);

    if (this.bossArmorBar) {
        const armorPct = Math.max(0, this.bossArmor / this.bossData.armor);
        this.bossArmorBar.clear();
        if (armorPct > 0) {
            this.bossArmorBar.fillStyle(0x3399db, 1).fillRoundedRect(534, 290 - (136 * armorPct), 12, 136 * armorPct, 4);
        }
        this.bossArmorText.setText(`${this.bossArmor}`);
    }
    
    this.drawPodium();
  }

  useItem(type) {
    if (this.isBusy || this.isGameOver || this.isPaused) return;
    
    const target = this.team[this.activeCharIndex];
    if (target.hp <= 0 || target.hp >= target.maxHp) return;

    if (type === 'medkit') {
        if (Save.getMedkits() <= 0 || this.medkitUsed) return; // ПРОВЕРКА ФЛАГА
        this.medkitUsed = true;
        
        target.hp = Math.min(target.maxHp, target.hp + 200); // ИСПРАВЛЕНО: 200 ХП
        Save.data.player.medkits -= 1; Save.flush();
        
        this.medkitText.setText(`0`); // Показываем, что больше нельзя
        this.medkitBg.clear().fillStyle(0x333333, 0.5).fillRoundedRect(20, 1080, 140, 60, 15).lineStyle(3, 0x555555, 1).strokeRoundedRect(20, 1080, 140, 60, 15);
        
        this.showFloatingText(360, 1060, `+200`, '#2ecc71'); // ВЫВОД ТЕКСТА
    } else if (type === 'antitoxin') {
        if (!Save.getAntitoxins || Save.getAntitoxins() <= 0 || this.antitoxinUsed) return; // ПРОВЕРКА ФЛАГА
        this.antitoxinUsed = true;
        
        target.antitoxinTurns = 4; // ИСПРАВЛЕНО: 4 ХОДА
        Save.data.player.antitoxins -= 1; Save.flush();
        
        this.antitoxinText.setText(`0`);
        this.antitoxinBg.clear().fillStyle(0x333333, 0.5).fillRoundedRect(20, 1160, 140, 60, 15).lineStyle(3, 0x555555, 1).strokeRoundedRect(20, 1160, 140, 60, 15);
        
        this.showFloatingText(360, 1060, `Лечение 4 хода по 70хп`, '#00f0ff'); // ВЫВОД ТЕКСТА
    }
    this.renderTeamUI();
  }

  showSurrenderModal() {
    if (this.isPaused) return; this.isPaused = true;
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.9).setDepth(300);
    const panel = this.add.graphics().setDepth(301).fillStyle(0x2c3e50, 1).fillRoundedRect(160, 500, 400, 280, 25).lineStyle(4, 0xe74c3c, 1).strokeRoundedRect(160, 500, 400, 280, 25);
    this.add.text(360, 560, 'ВЫ УВЕРЕНЫ?', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(302);
    const yesBtn = this.add.container(260, 680).setDepth(302);
    const yBg = this.add.graphics().fillStyle(0xe74c3c, 1).fillRoundedRect(-60, -30, 120, 60, 15).lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(-60, -30, 120, 60, 15);
    yesBtn.add([yBg, this.add.text(0, 0, 'ДА', { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    yesBtn.setSize(120, 60).setInteractive().on('pointerdown', () => this.scene.start('BossListScene'));
    const noBtn = this.add.container(460, 680).setDepth(302);
    const nBg = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(-60, -30, 120, 60, 15).lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(-60, -30, 120, 60, 15);
    noBtn.add([nBg, this.add.text(0, 0, 'НЕТ', { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    noBtn.setSize(120, 60).setInteractive().on('pointerdown', () => { overlay.destroy(); panel.destroy(); this.children.list.filter(c=>c.depth>=300).forEach(c=>c.destroy()); this.isPaused = false; });
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-10, 10), text, { 
        fontSize: '36px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 6 
    }).setOrigin(0.5).setDepth(250);
    this.tweens.add({ targets: txt, y: y - 100, alpha: 0, scale: 1.2, duration: 1500, onComplete: () => txt.destroy() });
  }

  winGame() {
    if (this.isGameOver) return; this.isGameOver = true;
    Save.data.bosses[this.bossData.id] = 'defeated'; Save.addFuzz(this.bossData.reward);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
    this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(160, 440, 400, 400, 30).lineStyle(4, 0x2ecc71, 1).strokeRoundedRect(160, 440, 400, 400, 30);
    this.add.text(360, 520, 'ПОБЕДА!', { fontSize: '56px', color: '#2ecc71', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(102);
    this.add.image(290, 620, 'icon_fuz').setDisplaySize(40, 40).setDepth(102);
    this.add.text(340, 620, `+${this.bossData.reward}`, { fontSize: '32px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(102);
    const btn = this.add.container(360, 740).setDepth(102);
    const bg = this.add.graphics().fillStyle(0x2ecc71, 1).fillRoundedRect(-150, -40, 300, 80, 30).lineStyle(6, 0xffffff, 1).strokeRoundedRect(-150, -40, 300, 80, 30);
    btn.add([bg, this.add.text(0, 0, 'ЗАБРАТЬ', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)]);
    btn.setSize(300, 80).setInteractive(); btn.on('pointerup', () => this.time.delayedCall(100, () => this.scene.start('BossListScene')));
  }

  loseGame() {
    if (this.isGameOver) return; this.isGameOver = true;
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.85).setDepth(100);
    this.add.graphics().setDepth(101).fillStyle(0x2c3e50, 0.95).fillRoundedRect(160, 440, 400, 400, 30).lineStyle(4, 0xe74c3c, 1).strokeRoundedRect(160, 440, 400, 400, 30);
    this.add.text(360, 520, 'ПОРАЖЕНИЕ', { fontSize: '56px', color: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(102);
    this.add.text(360, 620, `Босс оказался сильнее...`, { fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(102);
    const btn = this.add.container(360, 740).setDepth(102);
    const bg = this.add.graphics().fillStyle(0x3498db, 1).fillRoundedRect(-150, -40, 300, 80, 30).lineStyle(6, 0xffffff, 1).strokeRoundedRect(-150, -40, 300, 80, 30);
    btn.add([bg, this.add.text(0, 0, 'В МЕНЮ', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)]);
    btn.setSize(300, 80).setInteractive(); btn.on('pointerup', () => this.time.delayedCall(100, () => this.scene.start('BossListScene')));
  }
}
