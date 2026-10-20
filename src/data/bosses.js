export const BOSSES = [
  {
    id: 'boss0', name: 'Фермер', level: 1, maxHp: 1200, armor: 0,
    weapons: [0, 1], description: 'Обычный фермер. Бьет из базуки и кидает гранаты. Урон: 40-60.',
    reward: 120,
  },
  {
    id: 'boss1', name: 'Маньяки', level: 2, maxHp: 1300, armor: 0,
    weapons: [3, 1], description: 'Безумные близнецы. Используют дрели. Урон: 70-90.',
    reward: 140,
  },
  {
    id: 'boss2', name: 'Минер', level: 3, maxHp: 1400, armor: 50, // Снижено с 6000/100
    weapons: [5, 0, 3], description: 'Защищен тяжелой броней. Замораживает. Урон: 90-120.',
    reward: 160,
  },
  {
    id: 'boss3', name: 'Неизвестный', level: 4, maxHp: 1600, armor: 100, // Снижено с 15000/250
    weapons: [4, 3, 5], description: 'Скоро здесь будет новый босс... (Тестовый босс)',
    reward: 200,
  }
];
export function getBossData(id) { return BOSSES.find(b => b.id === id); }
