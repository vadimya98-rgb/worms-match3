export const BOSSES = [
  {
    id: 'boss1',
    name: 'Червь-Мутант',
    level: 1,
    maxHp: 500,
    description: 'Обычный червь, но очень злой.',
    reward: 300, // Награда в фузах
  },
  {
    id: 'boss2',
    name: 'Королева-Паучиха',
    level: 5,
    maxHp: 1200,
    description: 'Плетет сети и призывает пауков.',
    reward: 800,
  },
  {
    id: 'boss3',
    name: 'Механический Скорпион',
    level: 10,
    maxHp: 2500,
    description: 'Стреляет лазером из хвоста.',
    reward: 2000,
  }
];

export function getBossData(id) {
  return BOSSES.find(b => b.id === id);
}
