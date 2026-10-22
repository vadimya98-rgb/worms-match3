export const CHARACTERS = [
  {
    id: 'dragon', name: 'Дракон', description: 'Сжигает врага огнем на 150 урона.',
    baseHp: 500, hpPerLevel: 57, price: 0, isStarter: true,
    baseArmor: 0, armorPerLevel: 6,
    upgradeCosts: [0, 50, 100, 180, 300, 480, 750, 1100, 1600, 2300, 3300, 4600, 6300, 8500, 11500],
    armorUpgradeCosts: [0, 60, 110, 190, 300, 460, 680, 950, 1300, 1750, 2300, 3000]
  },
  {
    id: 'cat', name: 'Кот', description: 'Быстрый и кусачий. Наносит 150 урона и вызывает кровотечение.',
    baseHp: 550, hpPerLevel: 68, price: 1500, isStarter: false,
    baseArmor: 0, armorPerLevel: 6,
    upgradeCosts: [0, 60, 120, 220, 380, 620, 950, 1400, 2000, 2900, 4100, 5700, 7800, 10500, 14000],
    armorUpgradeCosts: [0, 70, 130, 230, 370, 570, 830, 1150, 1550, 2050, 2650, 3400]
  },
  {
    id: 'robot', name: 'Робот', description: 'Бьет током на 150 урона и пропускает ход врага.',
    baseHp: 600, hpPerLevel: 74, price: 3000, isStarter: false,
    baseArmor: 0, armorPerLevel: 6,
    upgradeCosts: [0, 70, 150, 280, 470, 760, 1150, 1700, 2400, 3400, 4900, 6800, 9300, 12500, 16700],
    armorUpgradeCosts: [0, 80, 150, 270, 430, 660, 960, 1350, 1800, 2350, 3000, 3800]
  },
  {
    id: 'zombie', name: 'Зомби', description: 'Травит врага на 5 ходов. Наносит 40 урона и 40 яда за ход.',
    baseHp: 650, hpPerLevel: 86, price: 5500, isStarter: false,
    baseArmor: 0, armorPerLevel: 6,
    upgradeCosts: [0, 80, 170, 320, 540, 880, 1350, 1950, 2800, 4000, 5800, 8000, 11000, 14700, 19500],
    armorUpgradeCosts: [0, 90, 170, 300, 480, 740, 1080, 1500, 2000, 2650, 3400, 4300]
  },
  {
    // ⭐ Вернулся на своё место — между зомби и демоном.
    // Статы: низкое HP, но САМАЯ ВЫСОКАЯ броня в игре (99) + стан на 1 ход.
    // Продаёт его теперь описание, а не цена.
    id: 'rabit', name: 'Кролик',
    description: '«Не смотри на мои хрупкие плечи — разнесу, как пить дать!» Оглушает босса на 1 ход и бьёт на 100. Носит самую крепкую броню в игре.',
    baseHp: 500, hpPerLevel: 55, price: 7000, isStarter: false,
    baseArmor: 0, armorPerLevel: 9,
    upgradeCosts: [0, 60, 130, 240, 400, 640, 980, 1450, 2050, 2900, 4200, 5800, 7900, 10600, 14200],
    armorUpgradeCosts: [0, 60, 110, 190, 310, 480, 700, 960, 1300, 1700, 2200, 2800]
  },
  {
    id: 'demon', name: 'Демон', description: 'Наносит 200 урона и лечит себя на 100 ХП.',
    baseHp: 700, hpPerLevel: 91, price: 10000, isStarter: false,
    baseArmor: 0, armorPerLevel: 11,
    upgradeCosts: [0, 100, 200, 380, 640, 1050, 1600, 2350, 3300, 4700, 6800, 9400, 12900, 17200, 23000],
    armorUpgradeCosts: [0, 100, 190, 330, 540, 830, 1200, 1650, 2200, 2900, 3700, 4700]
  }
];

export function getCharacterData(id) { return CHARACTERS.find((c) => c.id === id); }
export function getCharacterMaxHp(id, level) {
  const c = getCharacterData(id);
  return c ? c.baseHp + (level - 1) * c.hpPerLevel : 0;
}
export function getCharacterMaxArmor(id, level) {
  const c = getCharacterData(id);
  return c ? c.baseArmor + level * c.armorPerLevel : 0;
}
export function getUpgradeCost(id, currentLevel) {
  const c = getCharacterData(id);
  return c ? (c.upgradeCosts[currentLevel] ?? Infinity) : Infinity;
}
export function getArmorUpgradeCost(id, currentArmorLevel) {
  const c = getCharacterData(id);
  return c ? (c.armorUpgradeCosts[currentArmorLevel + 1] ?? Infinity) : Infinity;
}
