import { gameState } from "./state.js";

export function setupPlayer(spec) {
  const canvas = gameState.canvas;
  const isJump = spec.player.control === "jump";
  gameState.player = {
    x: isJump ? 96 : canvas.width / 2 - 24,
    y: isJump ? canvas.height - 82 : canvas.height - 72,
    groundY: canvas.height - 82,
    width: 48,
    height: 48,
    vy: 0,
    onGround: true,
    emoji: spec.player.emoji
  };
}

export function spawnObject() {
  const spec = gameState.currentSpec;
  if (!spec || !gameState.canvas) return;
  if (spec.player.control === "click" && gameState.objects.length >= 1) return;

  const template = spec.objects[Math.floor(Math.random() * spec.objects.length)];
  const behavior = normalizeBehavior(template.behavior, spec.player.control);
  const size = spec.player.control === "click" ? 58 : 42;
  const object = {
    ...template,
    behavior,
    x: 0,
    y: 0,
    width: size,
    height: size,
    maxHp: template.hp || 1,
    hp: template.hp || 1,
    speed: Math.max(1.2, (template.speed || 2) + spec.difficulty.objectSpeed * 0.28),
    touched: false
  };

  if (behavior === "movingLeft") {
    object.x = gameState.canvas.width + 20;
    object.y = gameState.canvas.height - 82;
  } else if (behavior === "randomAppear" || spec.player.control === "click") {
    object.x = 40 + Math.random() * (gameState.canvas.width - 100);
    object.y = 58 + Math.random() * (gameState.canvas.height - 150);
  } else if (behavior === "static") {
    object.x = gameState.canvas.width - 92;
    object.y = gameState.canvas.height - 90;
  } else {
    object.x = Math.random() * (gameState.canvas.width - object.width);
    object.y = -object.height - 8;
  }

  gameState.objects.push(object);
}

export function updateObjects() {
  const canvas = gameState.canvas;
  const player = gameState.player;
  gameState.objects.forEach((object) => {
    if (object.behavior === "falling") {
      object.y += object.speed;
    } else if (object.behavior === "movingLeft") {
      object.x -= object.speed;
    } else if (object.behavior === "chase" && player) {
      const dx = player.x - object.x;
      const dy = player.y - object.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      object.x += (dx / length) * object.speed * 0.7;
      object.y += (dy / length) * object.speed * 0.7;
    }
  });

  gameState.objects = gameState.objects.filter((object) => {
    if (object.behavior === "randomAppear" || object.behavior === "static") {
      return true;
    }
    const outBottom = object.y > canvas.height + 80;
    const outLeft = object.x < -100;
    const outRight = object.x > canvas.width + 120;
    const outTop = object.y < -120;
    if ((outBottom || outLeft) && gameState.currentSpec?.player?.control === "shoot" && object.effect === "damage") {
      gameState.health -= object.damage || 1;
    }
    return !outBottom && !outLeft && !outRight && !outTop;
  });
}

export function updateBullets() {
  gameState.bullets.forEach((bullet) => {
    bullet.y -= bullet.speed;
  });
  gameState.bullets = gameState.bullets.filter((bullet) => bullet.y + bullet.height > 0);
}

function normalizeBehavior(behavior, control) {
  if (control === "jump") return "movingLeft";
  if (control === "click") return "randomAppear";
  return behavior;
}
