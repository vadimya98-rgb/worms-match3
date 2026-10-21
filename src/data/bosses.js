export const BOSSES = [
  {
    id: 'boss0', name: 'Фермер', level: 1, maxHp: 1200, armor: 0,
    weapons: [0, 1], description: 'Бьет из базуки и кидает гранаты. Урон: 40-60.',
    reward: 120,
  },
  {
    id: 'boss1', name: 'Маньяк', level: 2, maxHp: 1300, armor: 0,
    weapons: [3, 1], description: 'Использует сверлящую и гранаты. Урон: 70-90.',
    reward: 140,
  },
  {
    id: 'boss2', name: 'Минер', level: 3, maxHp: 1400, armor: 50, 
    weapons: [5, 0, 3], description: 'Имеет 50 брони. Замораживает (пропуск хода). Урон: 90-120.',
    reward: 160,
  },
  {
    id: 'boss3', name: 'Сержант', level: 4, maxHp: 1500, armor: 100, 
    weapons: [2, 4], description: 'Имеет 100 брони. Кидает динамит и ставит мины. Урон: 110-140.',
    reward: 180,
  },
  {
    id: 'boss4', name: 'Охотник', level: 5, maxHp: 1600, armor: 50,
    weapons: [0, 4], description: 'Особенность: Ловушка (наносит доп. урон каждый 2-й ход).',
    reward: 200,
  },
  {
    id: 'boss5', name: 'Самурай', level: 6, maxHp: 1700, armor: 100,
    weapons: [3, 2], description: 'Особенность: Контратака (наносит ответный удар при получении урона).',
    reward: 220,
  },
  {
    id: 'boss6', name: 'Блуждающий', level: 7, maxHp: 1800, armor: 0,
    weapons: [5, 0], description: 'Особенность: Иммунитет (полный игнор 1 случайного вида оружия).',
    reward: 240,
  },
  {
    id: 'boss7', name: 'Шаман', level: 8, maxHp: 1900, armor: 50,
    weapons: [5, 1], description: 'Особенность: Проклятие (снижает эффективность лечения на 50%).',
    reward: 260,
  },
  {
    id: 'boss8', name: 'Иллюзионист', level: 9, maxHp: 2000, armor: 0,
    weapons: [3, 4], description: 'Особенность: Иллюзия (в начале боя скрывает 2 вида фишек).',
    reward: 280,
  },
  {
    id: 'boss9', name: 'Викинг', level: 10, maxHp: 2100, armor: 150,
    weapons: [1, 0, 2], description: 'Особенность: Ярость (урон увеличивается при потере здоровья).',
    reward: 300,
  },
  {
    id: 'boss10', name: 'Пират', level: 11, maxHp: 2200, armor: 100,
    weapons: [5, 3], description: 'Особенность: Грабеж (забирает часть фузов при ударе).',
    reward: 320,
  }
];
export function getBossData(id) { return BOSSES.find(b => b.id === id); }
