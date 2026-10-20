// Ключ, под которым состояние игры лежит в localStorage.
// Версия в имени (v1) — чтобы при будущих правках формата старые сохранения не ломали игру.
const SAVE_KEY = 'match_wormiks_save_v1';

// Фабрика начального состояния. Функция, а не объект — чтобы каждый reset получал чистую копию.
const defaultState = () => ({
  version: 1,
  player: {
    fuzz: 0,                    // валюта
    medkits: 0,                 // количество аптечек
    characters: {},             // { dragon: { owned: true, level: 1 }, mage: {...} }
    lastDailyBonusDay: null,    // 'YYYY-MM-DD' последнего полученного бонуса
    dailyStreak: 0,             // подряд дней бонуса
  },
  bosses: {},                   // { bossId: 'locked' | 'available' | 'defeated' }
});

// Синглтон — единственный экземпляр на всю игру.
// Импортируется как { Save } и работает со своим полем data.
export const Save = {
  data: null,

  // Загружает состояние из localStorage или создаёт новое.
  // Вызывается ОДИН раз при старте (в BootScene).
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.data = raw ? JSON.parse(raw) : defaultState();
    } catch (e) {
      // Битый JSON или отсутствие localStorage — начинаем с чистого листа
      console.warn('[Save] Не удалось прочитать сохранение, создаём новое', e);
      this.data = defaultState();
    }
    return this.data;
  },

  // Записывает текущее состояние в localStorage.
  // Вызывается после каждого изменения (через хелперы ниже).
  flush() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[Save] Не удалось сохранить', e);
    }
  },

  // Полный сброс — удобно для отладки.
  reset() {
    this.data = defaultState();
    this.flush();
  },

  // ===== Хелперы валюты =====
  getFuzz() {
    return this.data.player.fuzz;
  },

  addFuzz(n) {
    this.data.player.fuzz += n;
    this.flush();
  },

  // Списывает сумму, если хватает. Возвращает true/false — удобно для проверки в магазине.
  spendFuzz(n) {
    if (this.data.player.fuzz < n) return false;
    this.data.player.fuzz -= n;
    this.flush();
    return true;
  },

  // ===== Хелперы аптечек =====
  getMedkits() {
    return this.data.player.medkits;
  },

  addMedkits(n) {
    this.data.player.medkits += n;
    this.flush();
  },

  // ===== Хелперы персонажей =====
  // Возвращает { owned: bool, level: number } для любого id.
  // Даже если персонажа нет в сохранении — возвращает "не куплен, уровень 0".
  getCharacter(id) {
    return this.data.player.characters[id] || { owned: false, level: 0 };
  },

  // Отмечает персонажа как купленного, уровень 1.
  ownCharacter(id) {
    this.data.player.characters[id] = { owned: true, level: 1 };
    this.flush();
  },

  // Повышает уровень на 1. Возвращает false, если не куплен.
  upgradeCharacter(id) {
    const c = this.data.player.characters[id];
    if (!c || !c.owned) return false;
    c.level += 1;
    this.flush();
    return true;
  },

  // Быстрая проверка — выдавали ли Дракона (для решения Splash → Starter или Splash → Hub).
  isDragonOwned() {
    return this.getCharacter('dragon').owned;
  },
};
