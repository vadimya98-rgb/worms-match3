import { Save } from '../data/save.js';
import { CHARACTERS, getCharacterMaxHp, getUpgradeCost } from '../data/characters.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    // Фон
    this.add.image(360, 640, 'bg').setDisplaySize(720, 1280);

    this.currentTab = 'characters';
    this.container = this.add.container(0, 0);
    this.buildHeader();
    this.buildTabs();
    this.refreshContent();
  }

  buildHeader() {
    this.add.rectangle(360, 60, 720, 100, 0x000022, 0.8);
    this.fuzzText = this.add.text(30, 60, `Фузы: ${Save.getFuzz()}`, {
      fontSize: '32px', color: '#ffcc66', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0, 0.5);

    const backBtn = this.add.text(690, 60, '← НАЗАД', {
      fontSize: '28px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(1, 0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));
  }

  buildTabs() {
    this.tabCharsBtn = this.add.text(200, 160, 'ПЕРСОНАЖИ', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#444488', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();
    
    this.tabCharsBtn.on('pointerdown', () => {
      if (this.currentTab !== 'characters') { this.currentTab = 'characters'; this.refreshContent(); }
    });

    this.tabBoostsBtn = this.add.text(520, 160, 'БУСТЫ', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 20, y: 10 },
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();
    
    this.tabBoostsBtn.on('pointerdown', () => {
      if (this.currentTab !== 'boosts') { this.currentTab = 'boosts'; this.refreshContent(); }
    });
  }

  updateFuzzUI() {
    this.fuzzText.setText(`Фузы: ${Save.getFuzz()}`);
  }

  refreshContent() {
    this.container.removeAll(true);
    this.tabCharsBtn.setBackgroundColor(this.currentTab === 'characters' ? '#444488' : '#333366');
    this.tabBoostsBtn.setBackgroundColor(this.currentTab === 'boosts' ? '#444488' : '#333366');

    if (this.currentTab === 'characters') this.renderCharacters();
    else this.renderBoosts();
  }

  renderCharacters() {
    const startY = 280;
    const spacing = 180;

    CHARACTERS.forEach((char, index) => {
      const y = startY + index * spacing;
      const state = Save.getCharacter(char.id);
      
      const bg = this.add.rectangle(360, y, 680, 160, 0x222244).setStrokeStyle(2, 0x6666aa);
      this.container.add(bg);

      const titleStr = state.owned ? `${char.name} (Ур. ${state.level})` : char.name;
      const nameText = this.add.text(60, y - 40, titleStr, {
        fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
      });
      this.container.add(nameText);

      if (state.owned) {
        const hp = getCharacterMaxHp(char.id, state.level);
        const hpText = this.add.text(60, y + 10, `Макс. HP: ${hp}`, { fontSize: '24px', color: '#aaaaaa' });
        this.container.add(hpText);
      } else {
        const descText = this.add.text(60, y + 10, char.description, { fontSize: '20px', color: '#aaaaaa' });
        this.container.add(descText);
      }

      this.createCharacterButton(560, y, char, state);
    });
  }

  createCharacterButton(x, y, char, state) {
    if (!state.owned) {
      const canAfford = Save.getFuzz() >= char.price;
      const btnColor = canAfford ? '#22aa44' : '#555555';
      
      const btn = this.add.text(x, y, `КУПИТЬ\n${char.price}Ф`, {
        fontSize: '24px', color: '#ffffff', backgroundColor: btnColor, align: 'center', padding: { x: 10, y: 10 }
      }).setOrigin(0.5).setInteractive();

      btn.on('pointerdown', () => {
        if (Save.spendFuzz(char.price)) {
          Save.ownCharacter(char.id);
          this.updateFuzzUI();
          this.refreshContent();
        }
      });
      this.container.add(btn);
    } else {
      const cost = getUpgradeCost(char.id, state.level);

      if (cost === Infinity) {
        const btn = this.add.text(x, y, `MAX`, {
          fontSize: '24px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 10, y: 10 }
        }).setOrigin(0.5);
        this.container.add(btn);
      } else {
        const canAfford = Save.getFuzz() >= cost;
        const btnColor = canAfford ? '#22aa44' : '#555555';
        
        const btn = this.add.text(x, y, `УЛУЧШИТЬ\n${cost}Ф`, {
          fontSize: '24px', color: '#ffffff', backgroundColor: btnColor, align: 'center', padding: { x: 10, y: 10 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
          if (Save.spendFuzz(cost)) {
            Save.upgradeCharacter(char.id);
            this.updateFuzzUI();
            this.refreshContent();
          }
        });
        this.container.add(btn);
      }
    }
  }

  renderBoosts() {
    const y = 280;
    const medkitPrice = 100;

    const bg = this.add.rectangle(360, y, 680, 160, 0x222244).setStrokeStyle(2, 0x6666aa);
    this.container.add(bg);

    const nameText = this.add.text(60, y - 40, 'Аптечка', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
    });
    this.container.add(nameText);

    const countText = this.add.text(60, y + 10, `В наличии: x${Save.getMedkits()}`, {
      fontSize: '24px', color: '#ffcc66'
    });
    this.container.add(countText);

    const canAfford = Save.getFuzz() >= medkitPrice;
    const btnColor = canAfford ? '#22aa44' : '#555555';
    
    const btn = this.add.text(560, y, `КУПИТЬ\n${medkitPrice}Ф`, {
      fontSize: '24px', color: '#ffffff', backgroundColor: btnColor, align: 'center', padding: { x: 10, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerdown', () => {
      if (Save.spendFuzz(medkitPrice)) {
        Save.addMedkits(1);
        this.updateFuzzUI();
        this.refreshContent();
      }
    });
    this.container.add(btn);
  }
}
