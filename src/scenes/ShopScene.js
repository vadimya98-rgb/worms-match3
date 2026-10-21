import { Save } from '../data/save.js';
import { CHARACTERS, getCharacterMaxHp, getCharacterMaxArmor, getUpgradeCost, getArmorUpgradeCost } from '../data/characters.js';
import { Effects } from '../utils/effects.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.image(W/2, H/2, 'bg').setDisplaySize(W, H);
    this.add.rectangle(W/2, H/2, W, H, 0x1e3799, 0.6);

    this.currentTab = 'characters';
    this.container = this.add.container(0, H * 0.15);
    this.adminClickCount = 0;
    
    this.buildHeader(W, H);
    this.buildTabs(W, H);
    this.refreshContent();
    this.setupScroll(W, H);
  }

  buildHeader(W, H) {
    this.createCandyButton(100, H * 0.05, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));
    
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(W - 200, H * 0.03, 180, 50, 15).lineStyle(2, 0xffcc00, 0.8).strokeRoundedRect(W - 200, H * 0.03, 180, 50, 15);
    this.add.image(W - 175, H * 0.03 + 25, 'icon_fuz').setDisplaySize(25, 25);
    
    this.fuzzText = this.add.text(W - 140, H * 0.03 + 25, `${Save.getFuzz()}`, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
    
    this.fuzzText.setInteractive();
    this.fuzzText.on('pointerdown', () => {
      if (this.currentTab === 'boosts') {
        this.adminClickCount++;
        if (this.adminClickCount >= 5) {
          this.adminClickCount = 0;
          Effects.click(this);
          this.scene.start('AdminScene');
        }
      }
    });
  }

  buildTabs(W, H) {
    this.tabCharsBtn = this.add.text(W/2 - 160, H * 0.11, 'ПЕРСОНАЖИ', { fontSize: '24px', color: '#fff', backgroundColor: '#2ecc71', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive();
    this.tabCharsBtn.on('pointerdown', () => { 
        if (this.currentTab !== 'characters') { 
            Effects.click(this); 
            this.currentTab = 'characters'; 
            this.adminClickCount = 0; 
            this.refreshContent(true); 
        } 
    });

    this.tabBoostsBtn = this.add.text(W/2 + 160, H * 0.11, 'ПРЕДМЕТЫ', { fontSize: '24px', color: '#fff', backgroundColor: '#2c3e50', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive();
    this.tabBoostsBtn.on('pointerdown', () => { 
        if (this.currentTab !== 'boosts') { 
            Effects.click(this); 
            this.currentTab = 'boosts'; 
            this.adminClickCount = 0; 
            this.refreshContent(true); 
        } 
    });
  }

  updateFuzzUI() { this.fuzzText.setText(`${Save.getFuzz()}`); }

  refreshContent(resetScroll = false) {
    const H = this.scale.height;
    let savedY = resetScroll ? H * 0.15 : this.container.y; 
    
    this.container.removeAll(true);
    
    this.tabCharsBtn.setBackgroundColor(this.currentTab === 'characters' ? '#2ecc71' : '#2c3e50');
    this.tabBoostsBtn.setBackgroundColor(this.currentTab === 'boosts' ? '#2ecc71' : '#2c3e50');

    if (this.currentTab === 'characters') this.renderCharacters();
    else this.renderBoosts();

    this.container.y = savedY; 
  }

  renderCharacters() {
    const W = this.scale.width;
    let y = 0; 
    const isArmorUnlocked = Save.data.bosses['boss2'] === 'defeated';

    CHARACTERS.forEach((char) => {
      const state = Save.getCharacter(char.id);
      
      const bg = this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(W/2 - 320, y, 640, 190, 20).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(W/2 - 320, y, 640, 190, 20);
      this.container.add(bg);

      const charImg = this.add.image(W/2 - 260, y + 60, char.id).setDisplaySize(70, 70);
      this.container.add(charImg);

      this.container.add(this.add.text(W/2 - 210, y + 20, state.owned ? `${char.name} (Ур. ${state.level})` : char.name, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
      
      if (state.owned) {
        this.container.add(this.add.text(W/2 - 210, y + 55, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '16px', color: '#2ecc71', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
        let armorVal = getCharacterMaxArmor(char.id, state.armorLevel);
        this.container.add(this.add.text(W/2 - 210, y + 80, `Броня: ${armorVal}`, { fontSize: '16px', color: '#3498db', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
      }

      const descBg = this.add.graphics().fillStyle(0x000000, 0.4).fillRoundedRect(W/2 - 300, y + 110, 380, 65, 10).lineStyle(1, 0xffffff, 0.2).strokeRoundedRect(W/2 - 300, y + 110, 380, 65, 10);
      this.container.add(descBg);
      
      this.container.add(this.add.text(W/2 - 290, y + 120, char.description, { 
          fontSize: '14px', color: '#ddd', wordWrap: { width: 360 }, fontStyle: 'italic' 
      }));

      if (!state.owned) {
          this.createCharButton(W/2 + 240, y + 95, 'КУПИТЬ', char.price, Save.getFuzz() >= char.price, () => {
              if (Save.spendFuzz(char.price)) { 
                  Effects.buy(this);
                  Save.ownCharacter(char.id); 
                  this.updateFuzzUI(); this.refreshContent(); 
              } else {
                  Effects.error(this);
              }
          });
      } else {
          const hpCost = getUpgradeCost(char.id, state.level);
          this.createCharButton(W/2 + 240, y + 50, hpCost === Infinity ? 'HP MAX' : 'УЛУЧШИТЬ ХП', hpCost, hpCost !== Infinity && Save.getFuzz() >= hpCost, () => {
              if (hpCost !== Infinity) {
                  if (Save.spendFuzz(hpCost)) { 
                      Effects.buy(this);
                      Save.upgradeCharacter(char.id); 
                      this.updateFuzzUI(); this.refreshContent(); 
                  } else {
                      Effects.error(this);
                  }
              }
          });

          if (isArmorUnlocked) {
              const armorCost = getArmorUpgradeCost(char.id, state.armorLevel);
              this.createCharButton(W/2 + 240, y + 130, armorCost === Infinity ? 'БРОНЯ MAX' : 'УЛУЧШИТЬ БР.', armorCost, armorCost !== Infinity && Save.getFuzz() >= armorCost, () => {
                  if (armorCost !== Infinity) {
                      if (Save.spendFuzz(armorCost)) { 
                          Effects.buy(this);
                          Save.upgradeArmor(char.id); 
                          this.updateFuzzUI(); this.refreshContent(); 
                      } else {
                          Effects.error(this);
                      }
                  }
              }, 0x3498db);
          } else {
              const btn = this.add.container(W/2 + 240, y + 130);
              const bBg = this.add.graphics().fillStyle(0x333333, 1).fillRoundedRect(-80, -20, 160, 45, 12);
              const bMain = this.add.graphics().fillStyle(0x555555, 1).fillRoundedRect(-80, -25, 160, 45, 12);
              btn.add([bBg, bMain, this.add.text(0, -10, '🔒 ЗАКРЫТО', { fontSize: '14px', color: '#888', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5)]);
              this.container.add(btn);
          }
      }
      y += 210; 
    });
  }

  createCharButton(x, y, label, cost, canAfford, onClick, baseColor = 0x2ecc71) {
    const btnColor = cost === Infinity ? 0x7f8c8d : (canAfford ? baseColor : 0xe74c3c);
    const btn = this.add.container(x, y);
    const bBg = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(btnColor).darken(20).color, 1).fillRoundedRect(-80, -20, 160, 45, 12);
    const bMain = this.add.graphics().fillStyle(btnColor, 1).fillRoundedRect(-80, -25, 160, 45, 12);
    
    btn.add([bBg, bMain, this.add.text(0, -10, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5)]);
    
    if (cost !== Infinity) {
        btn.add(this.add.image(-15, 10, 'icon_fuz').setDisplaySize(16, 16));
        btn.add(this.add.text(10, 10, `${cost}`, { fontSize: '14px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5));
    }

    btn.setSize(160, 45);
    if (canAfford && cost !== Infinity) {
      btn.setInteractive({ useHandCursor: true });
      let startX = 0, startY = 0;
      btn.on('pointerdown', (p) => { startX = p.x; startY = p.y; });
      btn.on('pointerup', (p) => {
          let dist = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
          if (dist < 15) onClick();
      });
    }
    this.container.add(btn);
  }

  renderBoosts() {
    const W = this.scale.width;
    let y = 0;
    const medkitPrice = 150;
    const antitoxinPrice = 200;

    this.container.add(this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(W/2 - 320, y, 640, 130, 20).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(W/2 - 320, y, 640, 130, 20));
    this.container.add(this.add.image(W/2 - 290, y + 40, 'icon_medkit').setDisplaySize(40, 40));
    this.container.add(this.add.text(W/2 - 250, y + 30, 'Аптечка', { fontSize: '26px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
    this.container.add(this.add.text(W/2 - 290, y + 85, `В наличии: x${Save.getMedkits()} | Лечит 200 ХП`, { fontSize: '16px', color: '#2ecc71', fontStyle: 'bold' }));
    this.createItemButton(W/2 + 240, y + 65, medkitPrice, Save.getFuzz() >= medkitPrice, () => {
        if (Save.spendFuzz(medkitPrice)) { 
            Effects.buy(this);
            Save.addMedkits(1); 
            this.updateFuzzUI(); this.refreshContent(); 
        } else {
            Effects.error(this);
        }
    });
    y += 150;

    let antiCount = Save.getAntitoxins ? Save.getAntitoxins() : 0;
    this.container.add(this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(W/2 - 320, y, 640, 130, 20).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(W/2 - 320, y, 640, 130, 20));
    this.container.add(this.add.image(W/2 - 290, y + 40, 'icon_antitoksin').setDisplaySize(40, 40));
    this.container.add(this.add.text(W/2 - 250, y + 30, 'Антитоксин', { fontSize: '26px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
    this.container.add(this.add.text(W/2 - 290, y + 85, `В наличии: x${antiCount} | Лечит 70 ХП (4 хода)`, { fontSize: '16px', color: '#00f0ff', fontStyle: 'bold' }));
    this.createItemButton(W/2 + 240, y + 65, antitoxinPrice, Save.getFuzz() >= antitoxinPrice, () => {
        if (Save.spendFuzz(antitoxinPrice)) { 
            Effects.buy(this);
            Save.addAntitoxins(1); 
            this.updateFuzzUI(); this.refreshContent(); 
        } else {
            Effects.error(this);
        }
    });
  }

  createItemButton(x, y, price, canAfford, onClick) {
    const btnColor = canAfford ? 0x2ecc71 : 0xe74c3c;
    const btn = this.add.container(x, y);
    const bBg = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(btnColor).darken(20).color, 1).fillRoundedRect(-70, -25, 140, 60, 15);
    const bMain = this.add.graphics().fillStyle(btnColor, 1).fillRoundedRect(-70, -30, 140, 60, 15);
    btn.add([bBg, bMain, this.add.text(0, -12, 'КУПИТЬ', { fontSize: '16px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5)]);
    btn.add(this.add.image(-15, 10, 'icon_fuz').setDisplaySize(18, 18));
    btn.add(this.add.text(10, 10, `${price}`, { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5));
    btn.setSize(140, 60);
    if (canAfford) {
        btn.setInteractive({ useHandCursor: true });
        let startX = 0, startY = 0;
        btn.on('pointerdown', (p) => { startX = p.x; startY = p.y; });
        btn.on('pointerup', (p) => {
            let dist = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
            if (dist < 15) onClick();
        });
    }
    this.container.add(btn);
  }

  createCandyButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(30).color, 1).fillRoundedRect(-width/2, -height/2 + 6, width, height, 15);
    const bg = this.add.graphics().fillStyle(color, 1).fillRoundedRect(-width/2, -height/2, width, height, 15);
    const highlight = this.add.graphics().fillStyle(0xffffff, 0.3).fillRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height / 2, 10);
    const txt = this.add.text(0, 0, text, { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    container.add([shadow, bg, highlight, txt]);
    container.setSize(width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => { container.y += 4; });
    container.on('pointerup', () => { container.y -= 4; Effects.click(this); onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }

  setupScroll(W, H) {
    let startY = 0;
    let startMapY = 0;
    let isDragging = false;
    let threshold = 10;
    let moved = false;

    const maskShape = this.make.graphics();
    maskShape.fillRect(0, H * 0.15, W, H * 0.85); 
    const mask = maskShape.createGeometryMask();
    this.container.setMask(mask);

    this.input.on('pointerdown', (p) => {
      if (p.y < H * 0.15) return;
      startY = p.y;
      startMapY = this.container.y;
      isDragging = true;
      moved = false;
    });

    this.input.on('pointermove', (p) => {
      if (isDragging) {
        let diff = p.y - startY;
        if (Math.abs(diff) > threshold) moved = true;
        
        if (moved) {
          let newY = startMapY + diff;
          let contentHeight = this.currentTab === 'characters' ? CHARACTERS.length * 210 : 300;
          let minScroll = -(contentHeight - (H * 0.8)); 
          
          if (newY > H * 0.15) newY = H * 0.15; 
          if (newY < minScroll) newY = minScroll;
          this.container.y = newY;
        }
      }
    });

    this.input.on('pointerup', () => { isDragging = false; });
  }
}
