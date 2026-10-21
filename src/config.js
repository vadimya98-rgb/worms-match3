// Получаем реальные размеры экрана устройства
const screenW = window.innerWidth;
const screenH = window.innerHeight;
const ratio = screenH / screenW;

// Базовая ширина 720. А высоту вычисляем пропорционально экрану телефона.
export const GAME_WIDTH = 720;
// Если экран слишком квадратный, ставим минимум 1280, чтобы кнопки не слипались
export const GAME_HEIGHT = Math.max(1280, Math.round(GAME_WIDTH * ratio));
