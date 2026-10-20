export const CHARACTERS = [
  {
    id: 'dragon',
    name: 'Дракон',
    description: 'Стартовая раса. Контр-удар: Огонь (70 урона).',
    baseHp: 230,
    hpPerLevel: 30,
    price: 0,
    isStarter: true,
    // Стоимость переходов с 1 на 2, с 2 на 3 и т.д.
    upgradeCosts: [0, 50, 60, 70, 80, 90], 
  },
  {
    id: 'cat',
    name: 'Кот',
    description: 'Контр-удар: Царапины (40 урона + кровотечение).',
    baseHp: 230,
    hpPerLevel: 30,
    price: 500,
    isStarter: false,
    upgradeCosts: [0, 50, 60, 70, 80, 90],
  },
  {
    id: 'robot',
    name: 'Робот',
    description: 'Контр-удар: Ток (80 урона + пропуск хода босса).',
    baseHp: 230,
    hpPerLevel: 30,
    price: 700,
    isStarter: false,
    upgradeCosts: [0, 50, 60, 70, 80, 90],
  },
  {
    id: 'zombie',
    name: 'Зомби',
    description: 'Контр-удар: Яд (25 урона + отравление на 5 ходов).',
    baseHp: 230,
    hpPerLevel: 30,
    price: 1000,
    isStarter: false,
    upgradeCosts: [0, 50, 60, 70, 80, 90],
  },
];

export function getCharacterData(id) {
  return CHARACTERS.find((c) => c.id === id);
}

export function getCharacterMaxHp(id, level) {
  const c = getCharacterData(id);
  if (!c) return 0;
  return c.baseHp + (level - 1) * c.hpPerLevel;
}

export function getUpgradeCost(id, currentLevel) {
  const c = getCharacterData(id);
  if (!c) return Infinity;
  // Если достигли 6 уровня (5 апгрейдов), цена Infinity (MAX)
  return c.upgradeCosts[currentLevel] ?? Infinity;
}
