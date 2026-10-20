export const BOSSES = [
  {
    id: 'boss0', name: 'Фермер', level: 1, maxHp: 1500, armor: 0,
    weapons: [0, 1], description: 'Обычный фермер. Бьет из базуки и кидает гранаты. Урон: 40-60.',
    reward: 800, // Награда за победу
  },
  {
    id: 'boss1', name: 'Маньяки', level: 2, maxHp: 3500, armor: 0,
    weapons: [3, 1], description: 'Безумные близнецы. Используют дрели. Урон: 70-90.',
    reward: 2500,
  },
  {
    id: 'boss2', name: 'Минер', level: 3, maxHp: 6000, armor: 100, // Броня 100!
    weapons: [5, 0, 3], description: 'Защищен тяжелой броней. Замораживает. Урон: 90-120.',
    reward: 6000,
  },
  {
    id: 'boss3', name: 'Неизвестный', level: 4, maxHp: 15000, armor: 250,
    weapons: [4, 3, 5], description: 'Скоро здесь будет новый босс... (Тестовый босс)',
    reward: 20000,
  }
];
export function getBossData(id) { return BOSSES.find(b => b.id === id); }
