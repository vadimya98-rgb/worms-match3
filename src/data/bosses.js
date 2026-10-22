export const BOSSES = [
  {
    id: 'boss0', name: 'Фермер', level: 1, maxHp: 1200, armor: 0,
    weapons: [0, 1], description: 'Обычный фермер. Бьет из базуки и кидает гранаты. Урон: 40-60.',
    reward: 400,
  },
  {
    id: 'boss1', name: 'Маньяк', level: 2, maxHp: 1300, armor: 0,
    weapons: [3, 1], description: 'Использует сверлящую и гранаты. Урон: 70-90.',
    reward: 550,
  },
  {
    id: 'boss2', name: 'Минер', level: 3, maxHp: 1400, armor: 50,
    weapons: [5, 0, 3], description: 'Имеет 50 брони. Замораживает (пропуск хода). Урон: 90-120.',
    reward: 750,
  },
  {
    id: 'boss3', name: 'Сержант', level: 4, maxHp: 1500, armor: 100,
    weapons: [2, 4], description: 'Имеет 100 брони. Кидает динамит и ставит мины. Урон: 110-140.',
    reward: 1000,
  },
  {
    id: 'boss4', name: 'Охотник', level: 5, maxHp: 1600, armor: 50,
    weapons: [0, 4], description: 'Ловушка: +15 урона каждый 2-й ход. Урон: 100-130.',
    reward: 1300,
  },
  {
    id: 'boss5', name: 'Самурай', level: 6, maxHp: 1700, armor: 100,
    weapons: [3, 2], description: 'Контратака: наносит 10 урона в ответ. Урон: 120-150.',
    reward: 1650,
  },
  {
    id: 'boss6', name: 'Блуждающий', level: 7, maxHp: 1800, armor: 0,
    weapons: [5, 0], description: 'Иммунитет к 1 случайному оружию. Урон: 130-160.',
    reward: 2050,
  },
  {
    id: 'boss7', name: 'Шаман', level: 8, maxHp: 1900, armor: 50,
    weapons: [5, 1], description: 'Проклятие: лечение игрока снижено на 50%. Урон: 140-170.',
    reward: 2500,
  },
  {
    id: 'boss8', name: 'Иллюзионист', level: 9, maxHp: 2000, armor: 0,
    weapons: [3, 4], description: 'Иллюзия: скрывает 2 вида фишек. Урон: 150-180.',
    reward: 3000,
  },
  {
    id: 'boss9', name: 'Викинг', level: 10, maxHp: 2100, armor: 150,
    weapons: [1, 0, 2], description: 'Ярость: урон +20% за каждые 20% потерянного ХП. Урон: 160-190.',
    reward: 3600,
  },
  {
    id: 'boss10', name: 'Пират', level: 11, maxHp: 2200, armor: 100,
    weapons: [5, 3], description: 'Двойной удар: атакует дважды каждый 3-й ход. Урон: 170-200.',
    reward: 4300,
  }
];
export function getBossData(id) { return BOSSES.find(b => b.id === id); }
