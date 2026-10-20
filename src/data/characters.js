// Каталог всех персонажей. В сохранении храним только owned/level,
// а характеристики (HP, цены) берём отсюда — их нельзя "потерять" или сломать.
export const CHARACTERS = [
  {
    id: 'dragon',
    name: 'Дракон',
    description: 'Стартовый червь. Огненное дыхание.',
    baseHp: 200,
    hpPerLevel: 50,
    price: 0,
    isStarter: true,
    // upgradeCosts[level] = стоимость перехода С этого уровня на следующий.
    // [1] = 300 → апгрейд с 1 на 2 уровень стоит 300 фузов.
    upgradeCosts: [0, 300, 600, 1000, 1500, 2200],
  },
  {
    id: 'mage',
    name: 'Маг',
    description: 'Хрупкий, но сильный. Стреляет магией.',
    baseHp: 250,
    hpPerLevel: 40,
    price: 500,
    isStarter: false,
    upgradeCosts: [0, 400, 800, 1300, 2000, 3000],
  },
  {
    id: 'warrior',
    name: 'Воин',
    description: 'Сбалансированный боец ближнего боя.',
    baseHp: 300,
    hpPerLevel: 50,
    price: 700,
    isStarter: false,
    upgradeCosts: [0, 500, 900, 1500, 2300, 3400],
  },
  {
    id: 'tank',
    name: 'Танк',
    description: 'Много HP, но медленный.',
    baseHp: 400,
    hpPerLevel: 60,
    price: 1000,
    isStarter: false,
    upgradeCosts: [0, 600, 1100, 1800, 2700, 4000],
  },
];

// Поиск персонажа по id.
export function getCharacterData(id) {
  return CHARACTERS.find((c) => c.id === id);
}

// Считает текущий максимум HP с учётом уровня.
// Формула: базовое HP + (уровень − 1) × прибавка за уровень.
export function getCharacterMaxHp(id, level) {
  const c = getCharacterData(id);
  if (!c) return 0;
  return c.baseHp + (level - 1) * c.hpPerLevel;
}

// Возвращает стоимость апгрейда с текущего уровня или Infinity (если достигнут максимум).
export function getUpgradeCost(id, currentLevel) {
  const c = getCharacterData(id);
  if (!c) return Infinity;
  return c.upgradeCosts[currentLevel] ?? Infinity;
}
