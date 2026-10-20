export const BOSSES = [
  {
    id: 'boss0',
    name: 'Фермер',
    level: 1,
    maxHp: 230,
    armor: 0,
    weapons: [0, 1], // Базука и Граната
    description: 'Обычный фермер. Бьет из базуки и кидает гранаты.',
    reward: 300,
  },
  {
    id: 'boss1',
    name: 'Маньяки',
    level: 2,
    maxHp: 260,
    armor: 0,
    weapons: [3, 1], // Сверлящая и Граната
    description: 'Безумные близнецы. Используют дрели и гранаты.',
    reward: 600,
  },
  {
    id: 'boss2',
    name: 'Минер',
    level: 3,
    maxHp: 250,
    armor: 30, // Броня
    weapons: [5, 0, 3], // Ледяная мина, Базука, Сверлящая
    description: 'Защищен броней. Замораживает и сверлит.',
    reward: 1000,
  },
  {
    id: 'boss3',
    name: 'Неизвестный',
    level: 4,
    maxHp: 9999,
    armor: 0,
    weapons: [4],
    description: 'Скоро здесь будет новый босс...',
    reward: 0,
  }
];

export function getBossData(id) {
  return BOSSES.find(b => b.id === id);
}
