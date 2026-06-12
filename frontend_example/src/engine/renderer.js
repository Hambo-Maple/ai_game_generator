import { gameState } from "./state.js";

const SPRITE_SHEET_SRC = "/assets/sprites/game-sprites-key.png";
const SPRITE_GRID = 4;
const SPRITES = {
  cat: [0, 0],
  knight: [1, 0],
  robot: [2, 0],
  ninja: [3, 0],
  dog: [0, 1],
  bird: [1, 1],
  explorer: [2, 1],
  astronaut: [3, 1],
  meteor: [0, 2],
  bee: [1, 2],
  dart: [2, 2],
  log: [3, 2],
  coin: [0, 3],
  star: [1, 3],
  gem: [2, 3],
  candy: [3, 3]
};

const spriteState = {
  image: null,
  loaded: false,
  attempted: false
};

function ensureSpriteSheet() {
  if (spriteState.attempted || typeof Image === "undefined") return;
  spriteState.attempted = true;
  const image = new Image();
  image.onload = () => {
    spriteState.image = removeGreenBackground(image);
    spriteState.loaded = true;
  };
  image.onerror = () => {
    spriteState.loaded = false;
  };
  image.src = SPRITE_SHEET_SRC;
}

function removeGreenBackground(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    if (g > 120 && g > r * 1.45 && g > b * 1.45) {
      data.data[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function renderGame() {
  const { ctx, canvas, currentSpec } = gameState;
  if (!ctx || !canvas || !currentSpec) return;
  ensureSpriteSheet();

  drawBackground(ctx, canvas, currentSpec.scene);
  drawObjects(ctx);
  drawBullets(ctx);
  drawPlayer(ctx);
  drawHud(ctx, canvas);
}

function drawHud(ctx, canvas) {
  const spec = gameState.currentSpec || {};
  const rules = spec.rules || {};
  const maxHealth = Math.max(0, Math.floor(spec.player?.health || gameState.health || 0));
  const health = Math.max(0, Math.floor(gameState.health || 0));
  const timeLimit = Math.max(0, Math.ceil(rules.timeLimit || 0));
  const timeLeft = Math.max(0, Math.ceil(gameState.timeLeft || 0));
  const chips = [
    { icon: "★", text: String(Math.floor(gameState.score || 0)), color: "#facc15" }
  ];

  if (maxHealth > 0) {
    chips.push({
      icon: "♥",
      text: `${"♥".repeat(Math.min(health, 6))}${health > 6 ? ` x${health}` : ""}`,
      color: "#fb7185"
    });
  }

  if (timeLimit > 0) {
    chips.push({ icon: "⏱", text: String(timeLeft), color: "#38bdf8" });
  }

  ctx.save();
  ctx.font = "700 18px Microsoft YaHei, Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  let x = 16;
  const y = 18;
  chips.forEach((chip) => {
    const text = `${chip.icon} ${chip.text}`;
    const width = Math.ceil(ctx.measureText(text).width) + 28;
    roundRect(ctx, x, y, width, 34, 10, "rgba(15,23,42,0.72)", "rgba(15,23,42,0.72)");
    ctx.fillStyle = chip.color;
    ctx.fillText(chip.icon, x + 12, y + 17);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(chip.text, x + 36, y + 17);
    x += width + 10;
  });

  const goal = getGoalText(rules);
  if (goal) {
    ctx.font = "700 15px Microsoft YaHei, Segoe UI, sans-serif";
    const width = Math.ceil(ctx.measureText(goal).width) + 24;
    roundRect(ctx, canvas.width - width - 16, y, width, 34, 10, "rgba(15,23,42,0.6)", "rgba(15,23,42,0.6)");
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(goal, canvas.width - width - 4, y + 17);
  }
  ctx.restore();
}

function getGoalText(rules) {
  if (rules.winCondition === "scoreTarget" && rules.scoreTarget) return `目标 ${rules.scoreTarget}`;
  if (rules.winCondition === "surviveTime" && rules.timeLimit) return `坚持 ${rules.timeLimit}s`;
  if (rules.winCondition === "defeatAll" && rules.scoreTarget) return `击败 ${rules.scoreTarget}`;
  return "";
}

function drawBackground(ctx, canvas, scene) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, scene.backgroundColor || "#0f172a");
  gradient.addColorStop(1, shadeColor(scene.backgroundColor || "#0f172a", -28));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTexture(ctx, canvas, scene.theme);

  if (scene.theme === "space") {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 45; i += 1) {
      const x = (i * 137) % canvas.width;
      const y = (i * 71) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, i % 4 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene.theme === "city") {
    ctx.fillStyle = "#1f2937";
    for (let x = 0; x < canvas.width; x += 70) {
      ctx.fillRect(x, canvas.height - 140 - (x % 3) * 28, 46, 150);
    }
  } else if (scene.theme === "forest") {
    ctx.fillStyle = "#166534";
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.fillText("🌲", x, canvas.height - 70);
    }
  } else if (scene.theme === "ocean") {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let x = 0; x < canvas.width; x += 80) {
      ctx.fillText("≈", x, canvas.height - 90);
    }
  }

  ctx.fillStyle = scene.groundColor || "#475569";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x < canvas.width; x += 28) {
    ctx.fillRect(x, canvas.height - 28, 12, 28);
  }
}

function drawPlayer(ctx) {
  const player = gameState.player;
  if (!player) return;
  drawSprite(ctx, {
    name: gameState.currentSpec.player.name,
    emoji: player.emoji,
    type: "player"
  }, player.x, player.y, player.width, player.height);
}

function drawObjects(ctx) {
  gameState.objects.forEach((object) => {
    drawSprite(ctx, object, object.x, object.y, object.width, object.height);
  });
}

function drawBullets(ctx) {
  gameState.bullets.forEach((bullet) => {
    const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
    gradient.addColorStop(0, "#fff7ad");
    gradient.addColorStop(1, "#f97316");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 10;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.shadowBlur = 0;
  });
}

function drawTexture(ctx, canvas, theme) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  if (theme === "forest") {
    ctx.strokeStyle = "#bbf7d0";
    for (let x = -40; x < canvas.width; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.quadraticCurveTo(x + 20, canvas.height - 130, x + 8, canvas.height - 260);
      ctx.stroke();
    }
  } else if (theme === "city") {
    ctx.strokeStyle = "#cbd5e1";
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  } else if (theme === "ocean") {
    ctx.strokeStyle = "#bae6fd";
    for (let y = 60; y < canvas.height; y += 42) {
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 28) {
        ctx.lineTo(x, y + Math.sin(x / 35) * 8);
      }
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = "#ffffff";
    for (let x = 0; x < canvas.width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + canvas.height, canvas.height);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSprite(ctx, entity, x, y, width, height) {
  const key = `${entity.name || ""}${entity.emoji || ""}`.toLowerCase();
  const spriteName = getSpriteName(key, entity);
  if (drawSheetSprite(ctx, spriteName, x, y, width, height)) return;

  const cx = x + width / 2;
  const cy = y + height / 2;
  const size = Math.min(width, height);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  if (key.includes("小猫") || key.includes("猫") || key.includes("🐱")) drawCat(ctx, cx, cy, size);
  else if (key.includes("小狗") || key.includes("狗") || key.includes("🐶")) drawDog(ctx, cx, cy, size);
  else if (key.includes("小鸟") || key.includes("鸟") || key.includes("🐦")) drawBird(ctx, cx, cy, size);
  else if (key.includes("忍者") || key.includes("🥷")) drawNinja(ctx, cx, cy, size);
  else if (key.includes("机器人") || key.includes("🤖")) drawRobot(ctx, cx, cy, size);
  else if (key.includes("宇航") || key.includes("🧑‍🚀")) drawAstronaut(ctx, cx, cy, size);
  else if (key.includes("陨石") || key.includes("☄")) drawMeteor(ctx, cx, cy, size);
  else if (key.includes("星星") || key.includes("⭐")) drawStar(ctx, cx, cy, size);
  else if (key.includes("宝石") || key.includes("💎")) drawGem(ctx, cx, cy, size);
  else if (key.includes("糖果") || key.includes("🍬")) drawCandy(ctx, cx, cy, size);
  else if (key.includes("飞镖") || key.includes("🗡")) drawDart(ctx, cx, cy, size);
  else if (key.includes("蜜蜂") || key.includes("🐝")) drawBee(ctx, cx, cy, size);
  else if (key.includes("怪物") || key.includes("外星") || key.includes("👾")) drawMonster(ctx, cx, cy, size);
  else if (key.includes("地鼠") || key.includes("🐹")) drawMole(ctx, cx, cy, size);
  else if (key.includes("木桩") || key.includes("🪵")) drawLog(ctx, cx, cy, size);
  else if (key.includes("金币") || key.includes("coin")) drawCoin(ctx, cx, cy, size);
  else drawDefaultSprite(ctx, entity, cx, cy, size);

  ctx.restore();
}

function getSpriteName(key, entity) {
  if (key.includes("小猫") || key.includes("猫") || key.includes("🐱")) return "cat";
  if (key.includes("骑士") || key.includes("勇士")) return "knight";
  if (key.includes("小狗") || key.includes("狗") || key.includes("🐶")) return "dog";
  if (key.includes("小鸟") || key.includes("鸟") || key.includes("🐦")) return "bird";
  if (key.includes("忍者") || key.includes("🥷")) return "ninja";
  if (key.includes("机器人") || key.includes("🤖")) return "robot";
  if (key.includes("宇航") || key.includes("太空人") || key.includes("🧑‍🚀")) return "astronaut";
  if (key.includes("探险") || key.includes("冒险者")) return "explorer";
  if (key.includes("陨石") || key.includes("☄")) return "meteor";
  if (key.includes("星星") || key.includes("⭐")) return "star";
  if (key.includes("宝石") || key.includes("💎")) return "gem";
  if (key.includes("糖果") || key.includes("🍬")) return "candy";
  if (key.includes("飞镖") || key.includes("🗡")) return "dart";
  if (key.includes("蜜蜂") || key.includes("🐝")) return "bee";
  if (key.includes("木桩") || key.includes("🪵")) return "log";
  if (key.includes("金币") || key.includes("硬币") || key.includes("coin")) return "coin";
  if (entity.type === "reward" || entity.effect === "score") return "star";
  return null;
}

function drawSheetSprite(ctx, name, x, y, width, height) {
  if (!name || !spriteState.loaded || !spriteState.image || !SPRITES[name]) return false;
  const [col, row] = SPRITES[name];
  const cellW = spriteState.image.width / SPRITE_GRID;
  const cellH = spriteState.image.height / SPRITE_GRID;
  const pad = Math.min(cellW, cellH) * 0.05;
  const drawSize = Math.max(width, height) * 1.45;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.38)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(
    spriteState.image,
    col * cellW + pad,
    row * cellH + pad,
    cellW - pad * 2,
    cellH - pad * 2,
    x + width / 2 - drawSize / 2,
    y + height / 2 - drawSize / 2,
    drawSize,
    drawSize
  );
  ctx.restore();
  return true;
}

function drawCat(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.38, "#f59e0b", "#b45309");
  drawTriangle(ctx, cx - s * 0.22, cy - s * 0.28, s * 0.18, "#f59e0b");
  drawTriangle(ctx, cx + s * 0.22, cy - s * 0.28, s * 0.18, "#f59e0b");
  drawEyes(ctx, cx, cy - s * 0.05, s, "#111827");
  drawWhiskers(ctx, cx, cy + s * 0.08, s);
}

function drawDog(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.38, "#a16207", "#713f12");
  drawOval(ctx, cx - s * 0.34, cy - s * 0.04, s * 0.18, s * 0.28, "#7c2d12");
  drawOval(ctx, cx + s * 0.34, cy - s * 0.04, s * 0.18, s * 0.28, "#7c2d12");
  drawEyes(ctx, cx, cy - s * 0.05, s, "#111827");
  drawCircle(ctx, cx, cy + s * 0.12, s * 0.08, "#111827", "#111827");
}

function drawBird(ctx, cx, cy, s) {
  drawOval(ctx, cx, cy, s * 0.34, s * 0.26, "#38bdf8", "#0369a1");
  drawOval(ctx, cx - s * 0.18, cy + s * 0.02, s * 0.24, s * 0.12, "#7dd3fc");
  drawTriangle(ctx, cx + s * 0.32, cy, s * 0.13, "#f59e0b");
  drawEyes(ctx, cx + s * 0.1, cy - s * 0.08, s * 0.7, "#111827");
}

function drawNinja(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.38, "#111827", "#020617");
  roundRect(ctx, cx - s * 0.25, cy - s * 0.1, s * 0.5, s * 0.16, s * 0.06, "#f8fafc");
  drawEyes(ctx, cx, cy - s * 0.04, s, "#111827");
  drawTriangle(ctx, cx + s * 0.34, cy - s * 0.18, s * 0.12, "#111827");
}

function drawRobot(ctx, cx, cy, s) {
  roundRect(ctx, cx - s * 0.34, cy - s * 0.32, s * 0.68, s * 0.64, s * 0.08, "#94a3b8", "#334155");
  drawCircle(ctx, cx - s * 0.14, cy - s * 0.08, s * 0.07, "#22d3ee", "#0891b2");
  drawCircle(ctx, cx + s * 0.14, cy - s * 0.08, s * 0.07, "#22d3ee", "#0891b2");
  roundRect(ctx, cx - s * 0.16, cy + s * 0.12, s * 0.32, s * 0.06, s * 0.02, "#0f172a");
  drawLine(ctx, cx, cy - s * 0.32, cx, cy - s * 0.48, "#94a3b8", 3);
}

function drawAstronaut(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.4, "#e2e8f0", "#94a3b8");
  drawCircle(ctx, cx, cy - s * 0.04, s * 0.25, "#0f172a", "#020617");
  drawCircle(ctx, cx - s * 0.08, cy - s * 0.1, s * 0.04, "#67e8f9", "#06b6d4");
}

function drawMeteor(ctx, cx, cy, s) {
  const gradient = ctx.createRadialGradient(cx - s * 0.1, cy - s * 0.1, 2, cx, cy, s * 0.46);
  gradient.addColorStop(0, "#fde68a");
  gradient.addColorStop(0.45, "#92400e");
  gradient.addColorStop(1, "#3f1d0b");
  ctx.fillStyle = gradient;
  jaggedCircle(ctx, cx, cy, s * 0.42, 10);
  drawLine(ctx, cx - s * 0.3, cy - s * 0.28, cx - s * 0.55, cy - s * 0.55, "#fb923c", 5);
}

function drawStar(ctx, cx, cy, s) {
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? s * 0.42 : s * 0.18;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawGem(ctx, cx, cy, s) {
  const points = [[0, -0.42], [0.34, -0.08], [0.2, 0.38], [-0.2, 0.38], [-0.34, -0.08]];
  polygon(ctx, cx, cy, s, points, "#22d3ee", "#0e7490");
  drawLine(ctx, cx, cy - s * 0.36, cx, cy + s * 0.34, "rgba(255,255,255,0.7)", 2);
}

function drawCandy(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.28, "#f472b6", "#be185d");
  drawLine(ctx, cx - s * 0.2, cy + s * 0.2, cx + s * 0.2, cy - s * 0.2, "#fff", 4);
  drawTriangle(ctx, cx - s * 0.4, cy, s * 0.15, "#f9a8d4");
  drawTriangle(ctx, cx + s * 0.4, cy, s * 0.15, "#f9a8d4");
}

function drawDart(ctx, cx, cy, s) {
  drawLine(ctx, cx - s * 0.35, cy + s * 0.25, cx + s * 0.28, cy - s * 0.28, "#e5e7eb", 5);
  drawTriangle(ctx, cx + s * 0.34, cy - s * 0.32, s * 0.16, "#ef4444");
  drawTriangle(ctx, cx - s * 0.3, cy + s * 0.3, s * 0.12, "#64748b");
}

function drawBee(ctx, cx, cy, s) {
  drawOval(ctx, cx, cy, s * 0.34, s * 0.24, "#facc15", "#a16207");
  drawLine(ctx, cx - s * 0.1, cy - s * 0.18, cx - s * 0.1, cy + s * 0.18, "#111827", 4);
  drawLine(ctx, cx + s * 0.1, cy - s * 0.18, cx + s * 0.1, cy + s * 0.18, "#111827", 4);
  drawOval(ctx, cx - s * 0.14, cy - s * 0.24, s * 0.18, s * 0.12, "rgba(219,234,254,0.8)");
  drawOval(ctx, cx + s * 0.14, cy - s * 0.24, s * 0.18, s * 0.12, "rgba(219,234,254,0.8)");
}

function drawMonster(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.38, "#8b5cf6", "#4c1d95");
  drawCircle(ctx, cx - s * 0.13, cy - s * 0.08, s * 0.09, "#f8fafc", "#f8fafc");
  drawCircle(ctx, cx + s * 0.13, cy - s * 0.08, s * 0.09, "#f8fafc", "#f8fafc");
  drawCircle(ctx, cx - s * 0.13, cy - s * 0.08, s * 0.04, "#111827", "#111827");
  drawCircle(ctx, cx + s * 0.13, cy - s * 0.08, s * 0.04, "#111827", "#111827");
  roundRect(ctx, cx - s * 0.2, cy + s * 0.13, s * 0.4, s * 0.08, s * 0.03, "#111827");
}

function drawMole(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.34, "#92400e", "#451a03");
  drawOval(ctx, cx, cy + s * 0.08, s * 0.18, s * 0.12, "#f9a8d4");
  drawEyes(ctx, cx, cy - s * 0.08, s, "#111827");
  roundRect(ctx, cx - s * 0.38, cy + s * 0.25, s * 0.76, s * 0.16, s * 0.08, "#3f2f1f");
}

function drawLog(ctx, cx, cy, s) {
  roundRect(ctx, cx - s * 0.36, cy - s * 0.24, s * 0.72, s * 0.48, s * 0.12, "#92400e", "#451a03");
  for (let i = -1; i <= 1; i += 1) drawLine(ctx, cx - s * 0.24, cy + i * s * 0.1, cx + s * 0.24, cy + i * s * 0.1, "#fbbf24", 2);
}

function drawCoin(ctx, cx, cy, s) {
  drawCircle(ctx, cx, cy, s * 0.34, "#facc15", "#b45309");
  drawCircle(ctx, cx, cy, s * 0.22, "#fde68a", "#f59e0b");
}

function drawDefaultSprite(ctx, entity, cx, cy, s) {
  const light = entity.effect === "damage" ? "#fca5a5" : entity.effect === "score" ? "#fef08a" : "#a7f3d0";
  const dark = entity.effect === "damage" ? "#991b1b" : entity.effect === "score" ? "#ca8a04" : "#047857";
  drawCircle(ctx, cx, cy, s * 0.4, light, dark);
  if (entity.emoji) {
    ctx.font = `${Math.floor(s * 0.7)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entity.emoji, cx, cy + s * 0.02);
  }
}

function drawCircle(ctx, cx, cy, r, light, dark) {
  const gradient = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 2, cx, cy, r);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark || light);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawOval(ctx, cx, cy, rx, ry, light, dark = light) {
  const gradient = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.5, 2, cx, cy, Math.max(rx, ry));
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTriangle(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy + s);
  ctx.lineTo(cx - s, cy + s);
  ctx.closePath();
  ctx.fill();
}

function drawEyes(ctx, cx, cy, s, color) {
  drawCircle(ctx, cx - s * 0.12, cy, s * 0.04, color, color);
  drawCircle(ctx, cx + s * 0.12, cy, s * 0.04, color, color);
}

function drawWhiskers(ctx, cx, cy, s) {
  drawLine(ctx, cx - s * 0.08, cy, cx - s * 0.35, cy - s * 0.06, "#78350f", 2);
  drawLine(ctx, cx - s * 0.08, cy + s * 0.05, cx - s * 0.35, cy + s * 0.09, "#78350f", 2);
  drawLine(ctx, cx + s * 0.08, cy, cx + s * 0.35, cy - s * 0.06, "#78350f", 2);
  drawLine(ctx, cx + s * 0.08, cy + s * 0.05, cx + s * 0.35, cy + s * 0.09, "#78350f", 2);
}

function drawLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r, light, dark = light) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function polygon(ctx, cx, cy, s, points, light, dark) {
  const gradient = ctx.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const px = cx + x * s;
    const py = cy + y * s;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.stroke();
}

function jaggedCircle(ctx, cx, cy, r, points) {
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const radius = r * (0.78 + (i % 3) * 0.1);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.stroke();
}

function shadeColor(color, percent) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const value = parseInt(color.slice(1), 16);
  const amount = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}
