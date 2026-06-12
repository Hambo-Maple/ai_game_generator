"use strict";

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('score');
  const linesElem = document.getElementById('lines');
  const levelElem = document.getElementById('level');
  const statusElem = document.getElementById('status');

  // 游戏参数
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 32; // 画布内绘制大小参考（canvas尺寸已固定）

  // 缓存画布尺寸与单格大小
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;

  // 方块颜色和样式
  const COLORS = [
    null,
    '#00f0f0', // I
    '#0000f0', // J
    '#f0a000', // L
    '#f0f000', // O
    '#00f000', // S
    '#a000f0', // T
    '#f00000'  // Z
  ];

  // 渐变和高光绘制函数
  function drawBlock(x, y, type) {
    if (!type) return;
    const color = COLORS[type];
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;

    // 绘制渐变底色
    const grad = ctx.createLinearGradient(px, py, px, py + BLOCK_SIZE);
    grad.addColorStop(0, lightenColor(color, 0.3));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 0.2));

    ctx.fillStyle = grad;
    ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    // 边缘描边
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

    // 内部高光
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 6);
    ctx.lineTo(px + BLOCK_SIZE - 6, py + 6);
    ctx.stroke();

    // 轻微阴影
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.strokeRect(px + 3, py + 3, BLOCK_SIZE - 6, BLOCK_SIZE - 6);
    ctx.shadowColor = 'transparent';
  }

  // 颜色辅助函数
  function lightenColor(color, amount) {
    const c = hexToRgb(color);
    return `rgb(${Math.min(255, c.r + 255 * amount)},${Math.min(255, c.g + 255 * amount)},${Math.min(255, c.b + 255 * amount)})`;
  }
  function darkenColor(color, amount) {
    const c = hexToRgb(color);
    return `rgb(${Math.max(0, c.r - 255 * amount)},${Math.max(0, c.g - 255 * amount)},${Math.max(0, c.b - 255 * amount)})`;
  }
  function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r:0,g:0,b:0};
  }

  // 方块形状定义，4x4矩阵
  const SHAPES = [
    [],
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ], // I
    [
      [2,0,0],
      [2,2,2],
      [0,0,0]
    ], // J
    [
      [0,0,3],
      [3,3,3],
      [0,0,0]
    ], // L
    [
      [4,4],
      [4,4]
    ], // O
    [
      [0,5,5],
      [5,5,0],
      [0,0,0]
    ], // S
    [
      [0,6,0],
      [6,6,6],
      [0,0,0]
    ], // T
    [
      [7,7,0],
      [0,7,7],
      [0,0,0]
    ]  // Z
  ];

  // 游戏状态
  let arena = createMatrix(COLS, ROWS);
  let player = null;
  let dropCounter = 0;
  let dropInterval = 1000; // 初始速度1秒下落一格
  let lastTime = 0;
  let score = 0;
  let lines = 0;
  let level = 1;
  let gameOver = false;
  let paused = true;

  // 创建矩阵(宽x高)
  function createMatrix(w, h) {
    const matrix = [];
    for (let i = 0; i < h; i++) {
      matrix.push(new Array(w).fill(0));
    }
    return matrix;
  }

  // 随机生成一个方块
  function createPiece(type) {
    return SHAPES[type].map(row => row.slice());
  }

  function playerReset() {
    const pieces = 'TJLOSZI';
    const type = pieces[(pieces.length * Math.random()) | 0];
    player.matrix = createPiece(pieces.indexOf(type) + 1);
    player.pos.y = 0;
    player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
      gameOver = true;
      paused = true;
      statusElem.textContent = '游戏结束';
    } else {
      statusElem.textContent = '进行中';
    }
  }

  // 碰撞检测
  function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] !== 0 &&
          (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  // 合并方块到场地
  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
  }

  // 消行检测
  function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
      for (let x = 0; x < arena[y].length; ++x) {
        if (arena[y][x] === 0) {
          continue outer;
        }
      }
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      ++rowCount;
      ++y; // 因为移除了一行要检查这一行的新数据
    }
    if (rowCount > 0) {
      lines += rowCount;
      score += getScore(rowCount);
      level = Math.min(15, (lines / 10 | 0) + 1);
      dropInterval = Math.max(100, 1000 - (level - 1) * 60);
      updateHUD();
    }
  }

  function getScore(rows) {
    switch (rows) {
      case 1: return 40 * level;
      case 2: return 100 * level;
      case 3: return 300 * level;
      case 4: return 1200 * level;
      default: return 0;
    }
  }

  // 旋转矩阵
  function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) {
      matrix.forEach(row => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  // 旋转方块并尝试修正碰撞
  function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > player.matrix[0].length) {
        rotate(player.matrix, -dir);
        player.pos.x = pos;
        return;
      }
    }
  }

  // 移动方块
  function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
      player.pos.x -= dir;
    }
  }

  // 硬降
  function hardDrop() {
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    drop();
  }

  // 方块下落逻辑
  function drop() {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      arenaSweep();
      playerReset();
      updateHUD();
    }
    dropCounter = 0;
  }

  // 更新 HUD
  function updateHUD() {
    scoreElem.textContent = `★ ${score}`;
    linesElem.textContent = `🪡 ${lines}`;
    levelElem.textContent = `⚡ ${level}`;
  }

  // 绘制棋盘背景格子纹理
  function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00334488';
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE + 0.5, 0);
      ctx.lineTo(x * BLOCK_SIZE + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE + 0.5);
      ctx.lineTo(canvas.width, y * BLOCK_SIZE + 0.5);
      ctx.stroke();
    }
  }

  // 绘制整个游戏画面
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景纹理
    drawGrid();

    // 绘制场地
    arena.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x, y, value);
        }
      });
    });

    // 绘制当前方块
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x + player.pos.x, y + player.pos.y, value);
        }
      });
    });
  }

  // 游戏主循环
  function update(time = 0) {
    if (paused) {
      lastTime = time;
      requestId = requestAnimationFrame(update);
      return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      drop();
    }
    draw();
    requestId = requestAnimationFrame(update);
  }

  // 清理重置游戏状态
  function resetGame() {
    arena = createMatrix(COLS, ROWS);
    player = { pos: {x:0, y:0}, matrix: null };
    dropCounter = 0;
    dropInterval = 1000;
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    paused = true;
    statusElem.textContent = '等待开始';
    updateHUD();
    draw();
  }

  // 键盘事件处理
  function handleKeyDown(event) {
    if (paused) return;
    const key = event.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(key)) {
      event.preventDefault();
    }
    if (key === 'ArrowLeft') {
      playerMove(-1);
    } else if (key === 'ArrowRight') {
      playerMove(1);
    } else if (key === 'ArrowDown') {
      drop();
    } else if (key === 'ArrowUp') {
      playerRotate(1);
    } else if (key === ' ') {
      hardDrop();
    }
  }

  // 监听 window 消息
  function handleMessage(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || !msg.type) return;

    switch (msg.type) {
      case 'GAME_START':
        if (gameOver) {
          resetGame();
        }
        if (!player.matrix) {
          playerReset();
        }
        paused = false;
        statusElem.textContent = '进行中';
        break;
      case 'GAME_PAUSE':
        paused = true;
        statusElem.textContent = '暂停';
        break;
      case 'GAME_RESUME':
        if (!gameOver) {
          paused = false;
          statusElem.textContent = '进行中';
        }
        break;
      case 'GAME_RESET':
        resetGame();
        break;
    }
  }

  // 初始化
  resetGame();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('message', handleMessage);

  let requestId = requestAnimationFrame(update);

})();