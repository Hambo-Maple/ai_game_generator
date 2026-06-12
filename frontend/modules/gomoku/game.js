(function () {
  const canvas = document.querySelector("#board");
  const ctx = canvas.getContext("2d");
  const statusEl = document.querySelector("#status");
  const restartBtn = document.querySelector("#restart");
  const size = 15;
  const margin = 36;
  const cell = (canvas.width - margin * 2) / (size - 1);
  let board;
  let current;
  let winner;

  function reset() {
    board = Array.from({ length: size }, () => Array(size).fill(null));
    current = "black";
    winner = null;
    statusEl.textContent = "黑棋先手";
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d7b06a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#22313f";
    ctx.lineWidth = 1.5;

    for (let i = 0; i < size; i += 1) {
      const pos = margin + i * cell;
      ctx.beginPath();
      ctx.moveTo(margin, pos);
      ctx.lineTo(canvas.width - margin, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, margin);
      ctx.lineTo(pos, canvas.height - margin);
      ctx.stroke();
    }

    drawStar(3, 3);
    drawStar(11, 3);
    drawStar(7, 7);
    drawStar(3, 11);
    drawStar(11, 11);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (board[y][x]) {
          drawStone(x, y, board[y][x]);
        }
      }
    }
  }

  function drawStar(x, y) {
    ctx.fillStyle = "#22313f";
    ctx.beginPath();
    ctx.arc(margin + x * cell, margin + y * cell, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStone(x, y, color) {
    const cx = margin + x * cell;
    const cy = margin + y * cell;
    const gradient = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 18);
    if (color === "black") {
      gradient.addColorStop(0, "#56606b");
      gradient.addColorStop(1, "#071018");
    } else {
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#dce5e8");
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function placeStone(event) {
    if (winner) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width * canvas.width - margin) / cell);
    const y = Math.round(((event.clientY - rect.top) / rect.height * canvas.height - margin) / cell);

    if (x < 0 || x >= size || y < 0 || y >= size || board[y][x]) {
      return;
    }

    board[y][x] = current;
    draw();

    if (hasFive(x, y, current)) {
      winner = current;
      statusEl.textContent = current === "black" ? "黑棋获胜" : "白棋获胜";
      return;
    }

    current = current === "black" ? "white" : "black";
    statusEl.textContent = current === "black" ? "黑棋回合" : "白棋回合";
  }

  function hasFive(x, y, color) {
    return [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ].some(([dx, dy]) => 1 + count(x, y, dx, dy, color) + count(x, y, -dx, -dy, color) >= 5);
  }

  function count(x, y, dx, dy, color) {
    let total = 0;
    let cx = x + dx;
    let cy = y + dy;
    while (cx >= 0 && cx < size && cy >= 0 && cy < size && board[cy][cx] === color) {
      total += 1;
      cx += dx;
      cy += dy;
    }
    return total;
  }

  canvas.addEventListener("click", placeStone);
  restartBtn.addEventListener("click", reset);
  reset();
})();
