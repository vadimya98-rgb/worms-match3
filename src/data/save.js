const SAVE_KEY = 'match_wormiks_save_v1';

const defaultState = () => ({
  version: 1,
  player: {
    fuzz: 0,
    medkits: 0,
    antitoxins: 0, // НОВОЕ
    characters: {},
    lastDailyBonusDay: null,
    dailyStreak: 0,
  },
  bosses: {},
});

export const Save = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? JSON.parse(raw) : defaultState();
      // Защита для старых сохранений
      if (this.data.player.antitoxins === undefined) this.data.player.antitoxins = 0;
    } catch (e) {
      this.data = defaultState();
    }
    return this.data;
  },
  flush() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {}
  },
  reset() { this.data = defaultState(); this.flush(); },

  getFuzz() { return this.data.player.fuzz; },
  addFuzz(n) { this.data.player.fuzz += n; this.flush(); },
  spendFuzz(n) { if (this.data.player.fuzz < n) return false; this.data.player.fuzz -= n; this.flush(); return true; },

  getMedkits() { return this.data.player.medkits; },
  addMedkits(n) { this.data.player.medkits += n; this.flush(); },
  
  // НОВЫЕ МЕТОДЫ
  getAntitoxins() { return this.data.player.antitoxins; },
  addAntitoxins(n) { this.data.player.antitoxins += n; this.flush(); },

  getCharacter(id) { return this.data.player.characters[id] || { owned: false, level: 0 }; },
  ownCharacter(id) { this.data.player.characters[id] = { owned: true, level: 1 }; this.flush(); },
  upgradeCharacter(id) {
    const c = this.data.player.characters[id];
    if (!c || !c.owned) return false;
    c.level += 1; this.flush(); return true;
  },
  isDragonOwned() { return this.getCharacter('dragon').owned; },
};
