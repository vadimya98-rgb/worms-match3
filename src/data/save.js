const SAVE_KEY = 'match_wormiks_save_v1';

const defaultState = () => ({
  version: 1,
  player: {
    fuzz: 0, medkits: 0, antitoxins: 0,
    characters: {}, lastDailyBonusDay: null, dailyStreak: 0,
  },
  bosses: {},
});

export const Save = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? JSON.parse(raw) : defaultState();
      if (this.data.player.antitoxins === undefined) this.data.player.antitoxins = 0;
    } catch (e) { this.data = defaultState(); }
    return this.data;
  },
  flush() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data = defaultState(); this.flush(); },

  getFuzz() { return this.data.player.fuzz; },
  addFuzz(n) { this.data.player.fuzz += n; this.flush(); },
  spendFuzz(n) { if (this.data.player.fuzz < n) return false; this.data.player.fuzz -= n; this.flush(); return true; },

  getMedkits() { return this.data.player.medkits; },
  addMedkits(n) { this.data.player.medkits += n; this.flush(); },
  
  getAntitoxins() { return this.data.player.antitoxins; },
  addAntitoxins(n) { this.data.player.antitoxins += n; this.flush(); },

  getCharacter(id) { 
      const c = this.data.player.characters[id];
      if (!c) return { owned: false, level: 0, armorLevel: 0 };
      return { owned: c.owned, level: c.level, armorLevel: c.armorLevel || 0 };
  },
  ownCharacter(id) { this.data.player.characters[id] = { owned: true, level: 1, armorLevel: 0 }; this.flush(); },
  upgradeCharacter(id) {
    const c = this.data.player.characters[id];
    if (!c || !c.owned) return false;
    c.level += 1; this.flush(); return true;
  },
  upgradeArmor(id) {
    const c = this.data.player.characters[id];
    if (!c || !c.owned) return false;
    c.armorLevel = (c.armorLevel || 0) + 1; this.flush(); return true;
  },
  isDragonOwned() { return this.getCharacter('dragon').owned; },
};
