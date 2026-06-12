import { gameState } from "./state.js";
import { bindControls, updatePlayer } from "./controls.js";
import { setupPlayer, spawnObject, updateBullets, updateObjects } from "./objects.js";
import { checkCollisions, checkWinLose } from "./rules.js";
import { renderGame } from "./renderer.js";

let controlsBound = false;

export function runGame(gameSpec) {
  const canvas = document.querySelector("#gameCanvas");
  gameState.canvas = canvas;
  gameState.ctx = canvas.getContext("2d");
  gameState.currentSpec = gameSpec;

  if (!controlsBound) {
    bindControls(canvas);
    controlsBound = true;
  }

  resetRuntime();
  setupPlayer(gameSpec);
  gameState.running = true;
  gameState.paused = false;
  gameState.lastShotAt = 0;
  canvas.focus();
  window.gameUi?.updateStatus("运行中");
  window.gameUi?.updatePauseLabel?.("暂停");
  window.gameUi?.hideOverlay();

  const spawnRate = gameSpec.player.control === "click" ? 700 : gameSpec.difficulty.spawnRate;
  if (gameSpec.player.control === "click") {
    spawnObject();
  } else {
    gameState.spawnTimer = window.setInterval(spawnObject, spawnRate);
  }

  gameState.countdownTimer = window.setInterval(() => {
    if (!gameState.paused && gameState.running) {
      gameState.timeLeft -= 1;
      window.gameUi?.updateHud();
      checkWinLose(endGame);
    }
  }, 1000);

  loop();
}

export function resetGame() {
  cancelAnimationFrame(gameState.animationId);
  clearInterval(gameState.spawnTimer);
  clearInterval(gameState.countdownTimer);
  resetRuntime();
  gameState.currentSpec = null;
  window.gameUi?.updatePauseLabel?.("暂停");
  window.gameUi?.updateHud();
}

export function setPaused(paused) {
  gameState.paused = paused;
  window.gameUi?.updateStatus(paused ? "暂停" : "运行中");
  window.gameUi?.updatePauseLabel?.(paused ? "继续" : "暂停");
}

function resetRuntime() {
  cancelAnimationFrame(gameState.animationId);
  clearInterval(gameState.spawnTimer);
  clearInterval(gameState.countdownTimer);
  const spec = gameState.currentSpec;
  gameState.running = false;
  gameState.paused = false;
  gameState.score = 0;
  gameState.health = spec?.player?.health || 0;
  gameState.timeLeft = spec?.rules?.timeLimit || 0;
  gameState.objects = [];
  gameState.bullets = [];
  gameState.keys = {};
  gameState.result = null;
  gameState.defeatedCount = 0;
  gameState.player = null;
  gameState.lastShotAt = 0;
}

function loop() {
  if (!gameState.running) return;

  if (!gameState.paused) {
    updatePlayer();
    updateObjects();
    updateBullets();
    checkCollisions();
    checkWinLose(endGame);
    window.gameUi?.updateHud();
  }

  renderGame();
  gameState.animationId = requestAnimationFrame(loop);
}

export function endGame(result) {
  if (!gameState.running) return;
  gameState.running = false;
  gameState.result = result;
  cancelAnimationFrame(gameState.animationId);
  clearInterval(gameState.spawnTimer);
  clearInterval(gameState.countdownTimer);
  window.gameUi?.updateStatus(result === "win" ? "胜利" : "失败");
  window.gameUi?.updatePauseLabel?.("暂停");
  window.gameUi?.showOverlay(result === "win" ? "胜利" : "失败", `最终分数：${Math.floor(gameState.score)}`);
}
