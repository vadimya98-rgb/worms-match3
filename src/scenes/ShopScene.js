import { Save } from '../data/save.js';
import { CHARACTERS, getCharacterMaxHp, getUpgradeCost } from '../data/characters.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x1e3799, 0.6);

    this.currentTab = 'characters';
    this.container = this.add.container(0, 0);
    
    this.buildHeader();
    this.buildTabs();
    this.refreshContent();
  }

  buildHeader() {
    // Кнопка Назад
    this.createCandyButton(100, 50, 140, 50, '←', 0x3498db, () => this.scene.start('HubScene'));

    // Фузы (Стекло)
    this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(520, 25, 180, 50, 15).lineStyle(2, 0xffcc00, 0.8).strokeRoundedRect(520, 25, 180, 50, 15);
    this.add.text(545, 50, '💰', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.fuzzText = this.add.text(590, 50, `${Save.getFuzz()}`, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  buildTabs() {
    this.tabCharsBtn = this.add.text(200, 150, 'ПЕРСОНАЖИ', { fontSize: '24px', color: '#fff', backgroundColor: '#2ecc71', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive();
    this.tabCharsBtn.on('pointerdown', () => { if (this.currentTab !== 'characters') { this.currentTab = 'characters'; this.refreshContent(); } });

    this.tabBoostsBtn = this.add.text(520, 150, 'БУСТЫ', { fontSize: '24px', color: '#fff', backgroundColor: '#2c3e50', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive();
    this.tabBoostsBtn.on('pointerdown', () => { if (this.currentTab !== 'boosts') { this.currentTab = 'boosts'; this.refreshContent(); } });
  }

  updateFuzzUI() { this.fuzzText.setText(`${Save.getFuzz()}`); }

  refreshContent() {
    this.container.removeAll(true);
    this.tabCharsBtn.setBackgroundColor(this.currentTab === 'characters' ? '#2ecc71' : '#2c3e50');
    this.tabBoostsBtn.setBackgroundColor(this.currentTab === 'boosts' ? '#2ecc71' : '#2c3e50');

    if (this.currentTab === 'characters') this.renderCharacters();
    else this.renderBoosts();
  }

  renderCharacters() {
    let y = 260;
    CHARACTERS.forEach((char) => {
      const state = Save.getCharacter(char.id);
      
      // Стеклянная карточка
      const bg = this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(40, y, 640, 140, 20).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(40, y, 640, 140, 20);
      this.container.add(bg);

      const charImg = this.add.image(110, y + 70, char.id).setDisplaySize(80, 80);
      this.container.add(charImg);

      this.container.add(this.add.text(170, y + 30, state.owned ? `${char.name} (Ур. ${state.level})` : char.name, { fontSize: '26px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
      
      if (state.owned) {
        this.container.add(this.add.text(170, y + 75, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: '#2ecc71', fontStyle: 'bold' }));
      } else {
        this.container.add(this.add.text(170, y + 75, char.description, { fontSize: '16px', color: '#ccc', wordWrap: { width: 300 } }));
      }

      this.createCharButton(600, y + 70, char, state);
      y += 160;
    });
  }

  createCharButton(x, y, char, state) {
    const isOwned = state.owned || char.isStarter;
    let label, cost, canAfford;
    
    if (!isOwned) {
      label = 'КУПИТЬ'; cost = char.price; canAfford = Save.getFuzz() >= cost;
    } else {
      cost = getUpgradeCost(char.id, state.level);
      if (cost === Infinity) { label = 'MAX'; } 
      else { label = 'УЛУЧШИТЬ'; canAfford = Save.getFuzz() >= cost; }
    }

    const btnColor = label === 'MAX' ? 0x7f8c8d : (canAfford ? 0x2ecc71 : 0xe74c3c);

    const btn = this.add.container(x, y);
    const bBg = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(btnColor).darken(20).color, 1).fillRoundedRect(-70, -30, 140, 70, 15);
    const bMain = this.add.graphics().fillStyle(btnColor, 1).fillRoundedRect(-70, -35, 140, 70, 15);
    const bGlow = this.add.graphics().fillStyle(0xffffff, 0.2).fillRoundedRect(-65, -30, 130, 30, 10);
    
    btn.add([bBg, bMain, bGlow, this.add.text(0, -15, label, { fontSize: '16px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5)]);
    if (label !== 'MAX') btn.add(this.add.text(0, 10, `${cost}💰`, { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5));

    btn.setSize(140, 70);
    if (label !== 'MAX' && canAfford) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (Save.spendFuzz(cost)) {
          if (label === 'КУПИТЬ') Save.ownCharacter(char.id);
          else Save.upgradeCharacter(char.id);
          this.updateFuzzUI(); this.refreshContent();
        }
      });
    }
    this.container.add(btn);
  }

  renderBoosts() {
    const y = 260, medkitPrice = 100;
    this.container.add(this.add.graphics().fillStyle(0xffffff, 0.1).fillRoundedRect(40, y, 640, 140, 20).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(40, y, 640, 140, 20));

    this.container.add(this.add.text(80, y + 40, 'Аптечка', { fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }));
    this.container.add(this.add.text(80, y + 90, `В наличии: x${Save.getMedkits()}`, { fontSize: '24px', color: '#f1c40f', fontStyle: 'bold' }));

    const canAfford = Save.getFuzz() >= medkitPrice;
    const btnColor = canAfford ? 0x2ecc71 : 0xe74c3c;
    
    const btn = this.add.container(600, y + 70);
    const bBg = this.add.graphics().fillStyle(Phaser.Display.Color.IntegerToColor(btnColor).darken(20).color, 1).fillRoundedRect(-70, -30, 140, 70, 15);
    const bMain = this.add.graphics().fillStyle(btnColor, 1).fillRoundedRect(-70, -35, 140, 70, 15);
    
    btn.add([bBg, bMain, this.add.text(0, -15, 'КУПИТЬ', { fontSize: '16px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5), this.add.text(0, 10, `${medkitPrice}💰`, { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5)]);
    
    btn.setSize(140, 70);
    if (canAfford) btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (Save.spendFuzz(medkitPrice)) { Save.addMedkits(1); this.updateFuzzUI(); this.refreshContent(); } });
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
    container.on('pointerup', () => { container.y -= 4; onClick(); });
    container.on('pointerout', () => { container.y = y; });
  }
}
