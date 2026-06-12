import { gameState } from "./state.js";

export function bindControls(canvas) {
  window.addEventListener("keydown", handleKeyDown, { capture: true });
  window.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("pointerdown", () => canvas.focus());
}

function handleKeyDown(event) {
  if (isTextInput(event.target)) return;

  const gameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code);
  const shouldCapture = gameState.running && gameKey && isGameFocused();
  if (!shouldCapture) return;

  gameState.keys[event.code] = true;
  if (gameKey) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function handleKeyUp(event) {
  if (isTextInput(event.target)) return;
  gameState.keys[event.code] = false;
}

function handleCanvasClick(event) {
  const spec = gameState.currentSpec;
  if (!gameState.running || gameState.paused || spec?.player?.control !== "click") return;

  const rect = gameState.canvas.getBoundingClientRect();
  const scaleX = gameState.canvas.width / rect.width;
  const scaleY = gameState.canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  gameState.objects.forEach((object) => {
    if (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    ) {
      object.hp -= 1;
      if (object.hp <= 0) {
        gameState.score += object.points || 10;
        gameState.defeatedCount += 1;
        object.x = Math.random() * (gameState.canvas.width - object.width);
        object.y = 58 + Math.random() * (gameState.canvas.height - 130);
        object.hp = object.maxHp || 1;
      }
    }
  });
}

function isGameFocused() {
  return document.activeElement === gameState.canvas || gameState.canvas?.matches(":hover");
}

function isTextInput(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
}

export function updatePlayer() {
  const { player, canvas, currentSpec, keys } = gameState;
  if (!player || !canvas || !currentSpec) return;

  const control = currentSpec.player.control;
  const speed = currentSpec.player.speed;

  if (control === "move" || control === "shoot") {
    if (keys.ArrowLeft) player.x -= speed;
    if (keys.ArrowRight) player.x += speed;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  }

  if (control === "jump") {
    if ((keys.Space || keys.ArrowUp) && player.onGround) {
      player.vy = -15;
      player.onGround = false;
    }
    player.vy += 0.75;
    player.y += player.vy;
    if (player.y >= player.groundY) {
      player.y = player.groundY;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (control === "shoot" && keys.Space) {
    const now = performance.now();
    if (now - gameState.lastShotAt > 280) {
      gameState.bullets.push({
        x: player.x + player.width / 2 - 4,
        y: player.y - 12,
        width: 8,
        height: 18,
        speed: 8
      });
      gameState.lastShotAt = now;
    }
  }
}
