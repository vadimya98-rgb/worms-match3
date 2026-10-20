export const CHARACTERS = [
  {
    id: 'dragon', name: 'Дракон', description: 'Стартовая раса. Урон огнем.',
    baseHp: 500, hpPerLevel: 100, price: 0, isStarter: true,
    baseArmor: 20, armorPerLevel: 10,
    upgradeCosts: [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000], 
    armorUpgradeCosts: [0, 150, 350, 700, 1400, 2800, 5500, 10000, 20000]
  },
  {
    id: 'cat', name: 'Кот', description: 'Быстрый и наносит кровотечение.',
    baseHp: 550, hpPerLevel: 120, price: 1500, isStarter: false,
    baseArmor: 15, armorPerLevel: 15,
    upgradeCosts: [0, 150, 350, 700, 1400, 2800, 5500, 10000, 20000],
    armorUpgradeCosts: [0, 200, 450, 900, 1800, 3500, 7000, 13000, 25000]
  },
  {
    id: 'robot', name: 'Робот', description: 'Имеет ток и пропускает ход врага.',
    baseHp: 600, hpPerLevel: 130, price: 4000, isStarter: false,
    baseArmor: 30, armorPerLevel: 20,
    upgradeCosts: [0, 200, 450, 900, 1800, 3500, 7000, 13000, 25000],
    armorUpgradeCosts: [0, 250, 550, 1100, 2200, 4000, 8000, 15000, 28000]
  },
  {
    id: 'zombie', name: 'Зомби', description: 'Травит врага на 5 ходов.',
    baseHp: 650, hpPerLevel: 150, price: 8000, isStarter: false,
    baseArmor: 10, armorPerLevel: 10,
    upgradeCosts: [0, 250, 600, 1200, 2400, 4500, 9000, 16000, 30000],
    armorUpgradeCosts: [0, 300, 700, 1400, 2800, 5000, 10000, 18000, 32000]
  },
];

export function getCharacterData(id) { return CHARACTERS.find((c) => c.id === id); }
export function getCharacterMaxHp(id, level) {
  const c = getCharacterData(id);
  return c ? c.baseHp + (level - 1) * c.hpPerLevel : 0;
}
export function getCharacterMaxArmor(id, level) {
    const c = getCharacterData(id);
    // Если уровень 0, то брони нет. Формула: baseArmor + level * armorPerLevel
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
