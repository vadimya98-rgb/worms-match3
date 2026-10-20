import { Save } from '../data/save.js';
import { CHARACTERS, getCharacterMaxHp, getUpgradeCost } from '../data/characters.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.6);

    // Рамка
    this.borderGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.borderGraphics.clear();
        let c = Phaser.Display.Color.HSVToRGB((this.time.now / 3000) % 1, 1, 1).color;
        this.borderGraphics.lineStyle(8, c, 0.4).strokeRect(8, 8, 704, 1264);
      }, loop: true
    });

    this.currentTab = 'characters';
    this.container = this.add.container(0, 0);
    
    this.buildHeader();
    this.buildTabs();
    this.refreshContent();
  }

  buildHeader() {
    // Кнопка Назад (Слева)
    const backBtn = this.add.container(100, 50);
    const bBg = this.add.graphics().fillStyle(0x333366, 0.8).fillRoundedRect(-70, -25, 140, 50, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -25, 140, 50, 15);
    backBtn.add([bBg, this.add.text(0, 0, '← НАЗАД', { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    backBtn.setSize(140, 50).setInteractive().on('pointerdown', () => this.scene.start('HubScene'));

    // Фузы (Справа, с иконкой)
    const g2 = this.add.graphics().fillStyle(0x000000, 0.6).fillRoundedRect(520, 25, 180, 50, 15).lineStyle(2, 0xffcc66, 0.8).strokeRoundedRect(520, 25, 180, 50, 15);
    this.add.text(545, 50, '💰', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.fuzzText = this.add.text(590, 50, `${Save.getFuzz()}`, { fontSize: '24px', color: '#ffcc66', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0, 0.5);
  }

  buildTabs() {
    this.tabCharsBtn = this.add.text(200, 150, 'ПЕРСОНАЖИ', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#444488', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();
    this.tabCharsBtn.on('pointerdown', () => { if (this.currentTab !== 'characters') { this.currentTab = 'characters'; this.refreshContent(); } });

    this.tabBoostsBtn = this.add.text(520, 150, 'БУСТЫ', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();
    this.tabBoostsBtn.on('pointerdown', () => { if (this.currentTab !== 'boosts') { this.currentTab = 'boosts'; this.refreshContent(); } });
  }

  updateFuzzUI() { this.fuzzText.setText(`${Save.getFuzz()}`); }

  refreshContent() {
    this.container.removeAll(true);
    this.tabCharsBtn.setBackgroundColor(this.currentTab === 'characters' ? '#444488' : '#333366');
    this.tabBoostsBtn.setBackgroundColor(this.currentTab === 'boosts' ? '#444488' : '#333366');

    if (this.currentTab === 'characters') this.renderCharacters();
    else this.renderBoosts();
  }

  renderCharacters() {
    let y = 260;
    CHARACTERS.forEach((char) => {
      const state = Save.getCharacter(char.id);
      
      const bg = this.add.graphics().fillStyle(0x222244, 0.8).fillRoundedRect(40, y, 640, 140, 20);
      bg.lineStyle(3, 0x444488, 1).strokeRoundedRect(40, y, 640, 140, 20);
      this.container.add(bg);

      const charImg = this.add.image(110, y + 70, char.id).setDisplaySize(80, 80);
      this.container.add(charImg);

      this.container.add(this.add.text(170, y + 30, state.owned ? `${char.name} (Ур. ${state.level})` : char.name, { fontSize: '28px', color: '#fff', fontStyle: 'bold' }));
      
      if (state.owned) {
        this.container.add(this.add.text(170, y + 75, `HP: ${getCharacterMaxHp(char.id, state.level)}`, { fontSize: '20px', color: '#aaa' }));
      } else {
        this.container.add(this.add.text(170, y + 75, char.description, { fontSize: '16px', color: '#aaa', wordWrap: { width: 300 } }));
      }

      this.createCharButton(600, y + 70, char, state);
      y += 160;
    });
  }

  createCharButton(x, y, char, state) {
    let label, cost, canAfford;
    
    if (!state.owned) {
      label = 'КУПИТЬ'; cost = char.price; canAfford = Save.getFuzz() >= cost;
    } else {
      cost = getUpgradeCost(char.id, state.level);
      if (cost === Infinity) { label = 'MAX'; } 
      else { label = 'УЛУЧШИТЬ'; canAfford = Save.getFuzz() >= cost; }
    }

    const btnColor = label === 'MAX' ? 0x555555 : (canAfford ? 0x22aa44 : 0xaa2222);

    const btn = this.add.container(x, y);
    const bBg = this.add.graphics().fillStyle(btnColor, 0.8).fillRoundedRect(-70, -35, 140, 70, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -35, 140, 70, 15);
    
    btn.add([bBg, this.add.text(0, -10, label, { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)]);
    if (label !== 'MAX') btn.add(this.add.text(0, 15, `${cost}💰`, { fontSize: '18px', color: '#ffcc66', fontStyle: 'bold' }).setOrigin(0.5));

    btn.setSize(140, 70);
    if (label !== 'MAX' && canAfford) {
      btn.setInteractive();
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
    const bg = this.add.rectangle(360, y + 70, 640, 140, 0x222244).setStrokeStyle(3, 0x6666aa);
    this.container.add(bg);

    this.container.add(this.add.text(80, y + 40, 'Аптечка', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }));
    this.container.add(this.add.text(80, y + 90, `В наличии: x${Save.getMedkits()}`, { fontSize: '24px', color: '#ffcc66' }));

    const canAfford = Save.getFuzz() >= medkitPrice;
    const btnColor = canAfford ? 0x22aa44 : 0xaa2222;
    
    const btn = this.add.container(600, y + 70);
    const bBg = this.add.graphics().fillStyle(btnColor, 0.8).fillRoundedRect(-70, -35, 140, 70, 15).lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(-70, -35, 140, 70, 15);
    btn.add([bBg, this.add.text(0, -10, 'КУПИТЬ', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5), this.add.text(0, 15, `${medkitPrice}💰`, { fontSize: '18px', color: '#ffcc66', fontStyle: 'bold' }).setOrigin(0.5)]);
    
    btn.setSize(140, 70);
    if (canAfford) btn.setInteractive().on('pointerdown', () => { if (Save.spendFuzz(medkitPrice)) { Save.addMedkits(1); this.updateFuzzUI(); this.refreshContent(); } });
    this.container.add(btn);
  }
}
