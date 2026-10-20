export default class FarmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmScene' });
  }

  create() {
    // ===== Настройки поля =====
    this.COLS = 6;
    this.ROWS = 6;
    this.TILE_SIZE = 100; // Размер фишки (100х100 пикселей)
    this.GAP = 4;         // Зазор между фишками

    // Отступы, чтобы поле было по центру экрана
    this.OFFSET_X = (720 - this.COLS * this.TILE_SIZE) / 2;
    this.OFFSET_Y = 280;

    // Доступные цвета (в будущем заменим на текстурные ключи оружий)
    this.COLORS = [0xff3344, 0xaa44ff, 0xff9933, 0x33cc66, 0x3399ff, 0xbb8844];

    // Двумерный массив для хранения логики поля
    this.grid = [];
    
    // Переменные для отслеживания свайпа
    this.isBusy = false; // Блокировка ввода во время анимаций
    this.selectedTile = null;

    // 1. Генерируем начальное поле
    this.createBoard();

    // 2. Добавляем текст и кнопку "Назад"
    this.add.text(360, 100, 'РЕЖИМ ФАРМ', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
    
    const backBtn = this.add.text(360, 1180, '← В МЕНЮ', {
      fontSize: '40px', color: '#ffffff', backgroundColor: '#333366', padding: { x: 40, y: 20 }
    }).setOrigin(0.5);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));

    // 3. Обработка свайпов на уровне всей сцены
    this.setupInput();
  }

  // ==========================================
  // ЛОГИКА СОЗДАНИЯ ПОЛЯ
  // ==========================================

  createBoard() {
    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        // Создаем фишку так, чтобы изначально не было совпадений 3-в-ряд
        let colorIndex;
        let isMatch;
        do {
          isMatch = false;
          colorIndex = Phaser.Math.Between(0, this.COLORS.length - 1);

          // Проверяем два левых соседа
          if (col >= 2 && this.grid[row][col - 1].colorIndex === colorIndex && this.grid[row][col - 2].colorIndex === colorIndex) {
            isMatch = true;
          }
          // Проверяем двух верхних соседей
          if (row >= 2 && this.grid[row - 1][col].colorIndex === colorIndex && this.grid[row - 2][col].colorIndex === colorIndex) {
            isMatch = true;
          }
        } while (isMatch);

        // Создаем визуальную фишку
        const tile = this.createTile(row, col, colorIndex);
        this.grid[row][col] = tile;
      }
    }
  }

  // Создает одну фишку и настраивает на нее клик
  createTile(row, col, colorIndex) {
    const x = this.OFFSET_X + col * this.TILE_SIZE + this.TILE_SIZE / 2;
    const y = this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2;

    // Рисуем закругленный прямоугольник (в будущем здесь будет this.add.sprite)
    const tile = this.add.rectangle(x, y, this.TILE_SIZE - this.GAP, this.TILE_SIZE - this.GAP, this.COLORS[colorIndex]);
    
    // Добавляем кастомные свойства, чтобы знать, где фишка лежит
    tile.gridRow = row;
    tile.gridCol = col;
    tile.colorIndex = colorIndex;

    // Делаем фишку интерактивной
    tile.setInteractive();
    
    // Добавляем анимацию при нажатии (чтобы чувствовался отклик)
    tile.on('pointerdown', () => {
      if (this.isBusy) return;
      
      // Если первая фишка не выбрана - выбираем её
      if (!this.selectedTile) {
        this.selectedTile = tile;
        tile.setScale(0.9); // Визуально уменьшаем, показывая выбор
      } 
      // Если выбрана эта же фишка - отменяем выбор
      else if (this.selectedTile === tile) {
        this.selectedTile.setScale(1);
        this.selectedTile = null;
      } 
      // Если выбрана другая фишка - пытаемся поменять их местами
      else {
        const firstTile = this.selectedTile;
        this.selectedTile.setScale(1); // Сбрасываем визуал
        this.selectedTile = null;
        
        // Проверяем, являются ли они соседями
        if (this.areNeighbors(firstTile, tile)) {
          this.swapTiles(firstTile, tile);
        }
      }
    });

    return tile;
  }

  // Проверяет, стоят ли фишки рядом (по горизонтали или вертикали)
  areNeighbors(tile1, tile2) {
    const rowDiff = Math.abs(tile1.gridRow - tile2.gridRow);
    const colDiff = Math.abs(tile1.gridCol - tile2.gridCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  // ==========================================
  // МЕХАНИКА СВАЙПА (DRAG & DROP)
  // ==========================================

  setupInput() {
    let startX = 0;
    let startY = 0;
    let startTile = null;

    // Игрок касается экрана
    this.input.on('pointerdown', (pointer) => {
      if (this.isBusy) return;
      startX = pointer.x;
      startY = pointer.y;
      
      // Находим фишку под пальцем
      const col = Math.floor((pointer.x - this.OFFSET_X) / this.TILE_SIZE);
      const row = Math.floor((pointer.y - this.OFFSET_Y) / this.TILE_SIZE);
      
      if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) {
        startTile = this.grid[row][col];
      }
    });

    // Игрок отпускает палец
    this.input.on('pointerup', (pointer) => {
      if (this.isBusy || !startTile) return;

      const dx = pointer.x - startX;
      const dy = pointer.y - startY;

      // Определяем направление свайпа (если свайп больше 20 пикселей)
      let targetRow = startTile.gridRow;
      let targetCol = startTile.gridCol;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        targetCol += (dx > 0) ? 1 : -1; // Свайп влево/вправо
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) {
        targetRow += (dy > 0) ? 1 : -1; // Свайп вверх/вниз
      } else {
        startTile = null; // Слишком короткий свайп, игнорируем
        return;
      }

      // Проверяем, не вышли ли за границы поля
      if (targetRow >= 0 && targetRow < this.ROWS && targetCol >= 0 && targetCol < this.COLS) {
        const targetTile = this.grid[targetRow][targetCol];
        this.swapTiles(startTile, targetTile);
      }
      
      startTile = null;
    });
  }

  // ==========================================
  // ОБМЕН, ПОИСК СОВПАДЕНИЙ И УДАЛЕНИЕ
  // ==========================================

  // Меняет две фишки местами
  swapTiles(tile1, tile2) {
    this.isBusy = true;

    // Меняем их местами в двумерном массиве
    this.grid[tile1.gridRow][tile1.gridCol] = tile2;
    this.grid[tile2.gridRow][tile2.gridCol] = tile1;

    // Меняем их координаты (для логики)
    const tempRow = tile1.gridRow;
    const tempCol = tile1.gridCol;
    tile1.gridRow = tile2.gridRow;
    tile1.gridCol = tile2.gridCol;
    tile2.gridRow = tempRow;
    tile2.gridCol = tempCol;

    // Анимируем перемещение (свап)
    this.tweens.add({
      targets: tile1,
      x: this.OFFSET_X + tile1.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: this.OFFSET_Y + tile1.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2,
      duration: 200,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: tile2,
      x: this.OFFSET_X + tile2.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: this.OFFSET_Y + tile2.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // После анимации проверяем, появились ли совпадения
        const matches = this.findMatches();
        if (matches.length > 0) {
          // Если есть - удаляем их
          this.removeTiles(matches);
        } else {
          // Если нет - меняем фишки обратно
          this.swapBack(tile1, tile2);
        }
      }
    });
  }

  // Если обмен не принес совпадений - откатываем его
  swapBack(tile1, tile2) {
    // Возвращаем в массив
    this.grid[tile1.gridRow][tile1.gridCol] = tile2;
    this.grid[tile2.gridRow][tile2.gridCol] = tile1;

    // Возвращаем координаты логики
    const tempRow = tile1.gridRow;
    const tempCol = tile1.gridCol;
    tile1.gridRow = tile2.gridRow;
    tile1.gridCol = tile2.gridCol;
    tile2.gridRow = tempRow;
    tile2.gridCol = tempCol;

    // Анимируем возврат назад
    this.tweens.add({
      targets: [tile1, tile2],
      x: (target) => this.OFFSET_X + target.gridCol * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: (target) => this.OFFSET_Y + target.gridRow * this.TILE_SIZE + this.TILE_SIZE / 2,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => { this.isBusy = false; }
    });
  }

  // Ищет все совпадения 3-в-ряд (по горизонтали и вертикали)
  findMatches() {
    const matches = [];

    // Ищем по горизонтали
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS - 2; col++) {
        const t1 = this.grid[row][col];
        const t2 = this.grid[row][col + 1];
        const t3 = this.grid[row][col + 2];
        if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t2.colorIndex === t3.colorIndex) {
          if (!matches.includes(t1)) matches.push(t1);
          if (!matches.includes(t2)) matches.push(t2);
          if (!matches.includes(t3)) matches.push(t3);
        }
      }
    }

    // Ищем по вертикали
    for (let col = 0; col < this.COLS; col++) {
      for (let row = 0; row < this.ROWS - 2; row++) {
        const t1 = this.grid[row][col];
        const t2 = this.grid[row + 1][col];
        const t3 = this.grid[row + 2][col];
        if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t2.colorIndex === t3.colorIndex) {
          if (!matches.includes(t1)) matches.push(t1);
          if (!matches.includes(t2)) matches.push(t2);
          if (!matches.includes(t3)) matches.push(t3);
        }
      }
    }

    return matches;
  }

  // Удаляет найденные фишки и запускает гравитацию
  removeTiles(tiles) {
    tiles.forEach(tile => {
      // Убираем из массива логики
      this.grid[tile.gridRow][tile.gridCol] = null;
      
      // Анимация исчезновения (сжатие)
      this.tweens.add({
        targets: tile,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => tile.destroy() // Удаляем объект из игры
      });
    });

    // Ждем завершения анимации (200мс) и запускаем падение фишек
    this.time.delayedCall(200, () => {
      this.applyGravity();
    });
  }

  // ==========================================
  // ГРАВИТАЦИЯ И ДОЗАПОЛНЕНИЕ ПОЛЯ
  // ==========================================

  applyGravity() {
    // Идем по колонкам снизу вверх
    for (let col = 0; col < this.COLS; col++) {
      let emptyRow = this.ROWS - 1; // Нижняя пустая клетка
      
      for (let row = this.ROWS - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          // Если нашли фишку, и она не на своей нижней позиции - двигаем её вниз
          if (row !== emptyRow) {
            const tile = this.grid[row][col];
            
            // Переносим в логике
            this.grid[emptyRow][col] = tile;
            this.grid[row][col] = null;
            
            tile.gridRow = emptyRow;
            
            // Анимируем падение
            this.tweens.add({
              targets: tile,
              y: this.OFFSET_Y + emptyRow * this.TILE_SIZE + this.TILE_SIZE / 2,
              duration: 300,
              ease: 'Bounce.easeOut'
            });
          }
          emptyRow--;
        }
      }

      // Заполняем пустые места сверху новыми фишками
      for (let row = emptyRow; row >= 0; row--) {
        const colorIndex = Phaser.Math.Between(0, this.COLORS.length - 1);
        const tile = this.createTile(row, col, colorIndex);
        
        // Ставим фишку ВЫШЕ поля, чтобы она красиво упала
        tile.y = this.OFFSET_Y - (emptyRow - row + 1) * this.TILE_SIZE;
        this.grid[row][col] = tile;

        // Анимируем падение
        this.tweens.add({
          targets: tile,
          y: this.OFFSET_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2,
          duration: 300,
          ease: 'Bounce.easeOut'
        });
      }
    }

    // Ждем, пока все упадет (400мс), и проверяем на каскадные совпадения
    this.time.delayedCall(400, () => {
      const newMatches = this.findMatches();
      if (newMatches.length > 0) {
        this.removeTiles(newMatches); // Каскад!
      } else {
        this.isBusy = false; // Разблокируем ввод
      }
    });
  }
}
