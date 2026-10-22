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

  exportCode() {
    try {
      const json = JSON.stringify(this.data);
      const bytes = new TextEncoder().encode(json);
      const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
      const b64 = btoa(binString);
      return 'WORMIX1:' + b64;
    } catch (e) {
      return null;
    }
  },

  importCode(code) {
    try {
      code = (code || '').trim();
      if (!code.startsWith('WORMIX1:')) {
        return { ok: false, error: 'Неверный формат кода' };
      }
      const b64 = code.substring(8);
      const binString = atob(b64);
      const bytes = Uint8Array.from(binString, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(json);

      if (!parsed || !parsed.player || !parsed.player.characters) {
        return { ok: false, error: 'Повреждённый код' };
      }

      if (parsed.player.antitoxins === undefined) parsed.player.antitoxins = 0;
      if (parsed.player.dailyStreak === undefined) parsed.player.dailyStreak = 0;
      if (parsed.player.lastDailyBonusDay === undefined) parsed.player.lastDailyBonusDay = null;
      if (!parsed.bosses) parsed.bosses = {};

      this.data = parsed;
      this.flush();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Не удалось прочитать код' };
    }
  },
};
