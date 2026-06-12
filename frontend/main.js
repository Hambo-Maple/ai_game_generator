import { gameState } from "./engine/state.js";
import { runGame, resetGame, setPaused } from "./engine/gameSpecEngine.js";

const examples = [
  "小猫在太空中躲避陨石收集星星",
  "勇士点击怪物获得金币",
  "小狗在森林里跳过木桩向前奔跑",
  "机器人射击外星怪物保护基地",
  "在规定时间内快速点击出现的地鼠",
  "忍者在城市中躲避飞镖并收集宝石",
  "宇航员在宇宙中发射子弹消灭外星怪物",
  "小鸟在森林中躲避蜜蜂收集糖果",
  "设计一个五子棋游戏",
  "做一个塔防游戏"
];

const dom = {
  promptInput: document.querySelector("#promptInput"),
  generateBtn: document.querySelector("#generateBtn"),
  examples: document.querySelector("#examples"),
  specView: document.querySelector("#specView"),
  statusText: document.querySelector("#statusText"),
  moduleFrame: document.querySelector("#moduleFrame"),
  canvas: document.querySelector("#gameCanvas"),
  startBtn: document.querySelector("#startBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  restartBtn: document.querySelector("#restartBtn"),
  fullscreenBtn: document.querySelector("#fullscreenBtn"),
  gamePanel: document.querySelector(".game-panel"),
  stageWrap: document.querySelector(".stage-wrap"),
  overlay: document.querySelector("#gameOverlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayMessage: document.querySelector("#overlayMessage"),
  overlayRestartBtn: document.querySelector("#overlayRestartBtn"),
  keyHelp: document.querySelector("#keyHelp")
};

const externalGame = {
  active: false,
  generated: false,
  entry: "",
  running: false,
  paused: false,
  controlsText: "",
  scale: 1
};

window.gameUi = {
  updateStatus,
  updateHud,
  updatePauseLabel,
  showOverlay,
  hideOverlay
};

function init() {
  examples.forEach((example) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = example;
    button.addEventListener("click", () => {
      dom.promptInput.value = example;
      dom.promptInput.focus();
    });
    dom.examples.appendChild(button);
  });

  dom.generateBtn.addEventListener("click", generateGameWithAI);
  dom.startBtn.addEventListener("click", () => {
    if (externalGame.active) {
      startExternalGame();
      return;
    }
    if (!gameState.currentSpec) {
      showOverlay("还没有游戏", "先输入一句话生成小游戏。", false);
      return;
    }
    showCanvas();
    runGame(gameState.currentSpec);
  });
  dom.pauseBtn.addEventListener("click", () => {
    if (externalGame.active) {
      pauseExternalGame();
      return;
    }
    if (!gameState.running) return;
    setPaused(!gameState.paused);
  });
  dom.restartBtn.addEventListener("click", () => {
    if (externalGame.active) {
      restartExternalGame();
    } else if (gameState.currentSpec) {
      showCanvas();
      runGame(gameState.currentSpec);
    }
  });
  dom.fullscreenBtn.addEventListener("click", toggleFullscreen);
  dom.stageWrap.addEventListener("wheel", handleStageWheel, { passive: false });
  document.addEventListener("keydown", preventGameScrollKeys, { capture: true });
  window.addEventListener("message", handleFrameMessage);
  document.addEventListener("fullscreenchange", () => {
    dom.fullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
  dom.overlayRestartBtn.addEventListener("click", () => {
    if (gameState.currentSpec) {
      runGame(gameState.currentSpec);
    }
  });

  updateControls();
}

async function generateGameWithAI() {
  const prompt = dom.promptInput.value.trim();
  if (!prompt) {
    showOverlay("请输入创意", "用一句话描述你想玩的小游戏。", false);
    return;
  }

  resetGame();
  showCanvas();
  updateStatus("生成中");
  hideOverlay();
  dom.generateBtn.disabled = true;

  try {
    const response = await fetch("/api/generate-game-spec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();

    if (data.generationMode === "module") {
      gameState.currentSpec = null;
      showModule(data.moduleEntry, { generated: false, title: data.moduleName });
      updateStatus("已生成");
      renderSpec({
        title: data.moduleName,
        description: data.message,
        player: { name: "双人轮流", control: "点击棋盘" },
        scene: { theme: "专业模块" },
        objects: [{ name: "黑白棋子" }],
        rules: { winCondition: "五连", loseCondition: "无" },
        difficulty: { name: "standard" }
      });
      updateKeyHelp("点击棋盘交替落子，模块内的重新开始按钮可重置棋局。");
      updateControls();
      return;
    }

    if (data.generationMode === "apiDevelopment") {
      updateStatus("API开发中");
      renderSpec({
        title: "API 开发模式",
        description: data.message,
        player: { name: "系统", control: "等待" },
        scene: { theme: "开发中" },
        objects: [{ name: data.developmentTaskId }],
        rules: { winCondition: "开发完成", loseCondition: "开发失败" },
        difficulty: { name: "custom" }
      });
      updateKeyHelp("复杂游戏开发完成后会在此区域加载，具体键位由生成游戏页面显示。");
      showDevelopmentOverlay(data.progress || 5, data.stage || "准备开发任务");
      pollDevelopmentTask(data.developmentTaskId);
      return;
    }

    const spec = data.gameSpec || data.fallbackSpec;
    gameState.currentSpec = spec;
    renderSpec(spec);
    updateKeyHelp(getControlHelp(spec.player?.control));
    updateStatus("已生成");
    updateHud();
    showOverlay("游戏已生成", "点击开始运行 Canvas 小游戏。", false);
    updateControls();
  } catch (error) {
    updateStatus("失败");
    showOverlay("生成失败", "请求后端失败，请确认服务正在运行。", false);
  } finally {
    dom.generateBtn.disabled = false;
  }
}

async function pollDevelopmentTask(taskId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await fetch(`/api/develop-game/${taskId}`);
    const data = await response.json();
    showDevelopmentOverlay(data.progress || estimateProgress(attempt), data.stage || data.message || "正在调用 API 开发");

    if (data.status === "completed") {
      showDevelopmentOverlay(100, "开发完成，正在加载游戏");
      showModule(data.entry, { generated: true, title: "AI 生成游戏", controlsText: data.controlsText });
      updateStatus("已生成");
      updateKeyHelp(data.controlsText || "操作：点击游戏区域聚焦后按游戏提示操作；使用下方按钮开始、暂停、重开。");
      hideOverlay();
      return;
    }

    if (data.status === "failed") {
      gameState.currentSpec = data.fallbackSpec;
      showCanvas();
      renderSpec(data.fallbackSpec);
      updateKeyHelp(getControlHelp(data.fallbackSpec?.player?.control));
      updateStatus("已生成");
      showOverlay("API 开发失败", data.message || "已为你加载默认小游戏。", false);
      updateControls();
      return;
    }
  }
}

function renderSpec(spec) {
  const objects = Array.isArray(spec.objects) ? spec.objects.map((item) => item.name).join("、") : "无";
  dom.specView.innerHTML = `
    <dt>标题</dt><dd>${escapeHtml(spec.title)}</dd>
    <dt>说明</dt><dd>${escapeHtml(spec.description)}</dd>
    <dt>角色</dt><dd>${escapeHtml(spec.player?.emoji || "")} ${escapeHtml(spec.player?.name || "")}</dd>
    <dt>场景</dt><dd>${escapeHtml(spec.scene?.theme || "")}</dd>
    <dt>操作</dt><dd>${escapeHtml(spec.player?.control || "")}</dd>
    <dt>物体</dt><dd>${escapeHtml(objects)}</dd>
    <dt>胜利</dt><dd>${escapeHtml(spec.rules?.winCondition || "")}</dd>
    <dt>失败</dt><dd>${escapeHtml(spec.rules?.loseCondition || "")}</dd>
    <dt>难度</dt><dd>${escapeHtml(spec.difficulty?.name || "")}</dd>
  `;
}

function updateStatus(status) {
  gameState.status = status;
  dom.statusText.textContent = status;
  updateControls();
}

function updateHud() {
  // Canvas games draw their own HUD; iframe modules keep their own UI.
}

function updatePauseLabel(label) {
  dom.pauseBtn.textContent = label;
}

function updateKeyHelp(text) {
  dom.keyHelp.textContent = text;
}

function updateControls() {
  if (externalGame.active) {
    dom.startBtn.disabled = externalGame.running && !externalGame.paused;
    dom.startBtn.textContent = externalGame.paused ? "继续" : externalGame.running ? "运行中" : "开始";
  } else {
    dom.startBtn.disabled = !gameState.currentSpec;
    dom.startBtn.textContent = "开始";
  }
  dom.pauseBtn.disabled = externalGame.active ? !externalGame.running : !gameState.running;
  dom.restartBtn.disabled = externalGame.active ? false : !gameState.currentSpec;
}

function showCanvas() {
  externalGame.active = false;
  externalGame.generated = false;
  externalGame.entry = "";
  externalGame.running = false;
  externalGame.paused = false;
  externalGame.controlsText = "";
  externalGame.scale = 1;
  dom.stageWrap.style.transform = "";
  dom.stageWrap.style.marginBottom = "";
  dom.moduleFrame.style.display = "none";
  dom.canvas.style.display = "block";
  updatePauseLabel("暂停");
  updateControls();
}

function showModule(entry, options = {}) {
  resetGame();
  externalGame.active = true;
  externalGame.generated = Boolean(options.generated);
  externalGame.entry = entry;
  externalGame.running = !options.generated;
  externalGame.paused = false;
  externalGame.controlsText = options.controlsText || "";
  externalGame.scale = 1;
  dom.stageWrap.style.transform = "";
  dom.stageWrap.style.marginBottom = "";
  dom.canvas.style.display = "none";
  dom.moduleFrame.style.display = "block";
  dom.moduleFrame.src = entry;
  dom.moduleFrame.addEventListener("load", prepareEmbeddedGame, { once: true });
  hideOverlay();
  updatePauseLabel("暂停");
  if (options.generated) {
    showOverlay("游戏已准备好", "请查看下方操作提示，点击左下角“开始”运行游戏。", false);
  }
  updateControls();
}

function getControlHelp(control) {
  const helps = {
    move: "操作：点击游戏画布聚焦后，使用 ← / → 移动角色，躲避危险物并收集奖励。",
    jump: "操作：点击游戏画布聚焦后，按 Space 或 ↑ 跳跃，避开迎面而来的障碍。",
    click: "操作：直接点击游戏画布中出现的目标，尽快达到目标分数。",
    shoot: "操作：点击游戏画布聚焦后，使用 ← / → 移动，按 Space 发射子弹。"
  };
  return helps[control] || "操作：点击游戏区域后按页面提示游玩。";
}

function restartExternalGame() {
  if (!externalGame.entry) return;
  externalGame.running = false;
  externalGame.paused = false;
  updatePauseLabel("暂停");
  dom.moduleFrame.style.visibility = "visible";
  postExternalGameMessage("GAME_RESET");
  showOverlay("游戏已重置", "点击左下角“开始”重新运行游戏。", false);
  updateControls();
}

function startExternalGame() {
  if (!externalGame.entry) return;
  externalGame.running = true;
  externalGame.paused = false;
  updatePauseLabel("暂停");
  dom.moduleFrame.style.visibility = "visible";
  hideOverlay();
  postExternalGameMessage("GAME_START");
  dom.moduleFrame.contentWindow?.focus();
  updateControls();
}

function pauseExternalGame() {
  if (!externalGame.running) return;
  externalGame.paused = !externalGame.paused;
  updatePauseLabel(externalGame.paused ? "继续" : "暂停");
  if (externalGame.paused) {
    postExternalGameMessage("GAME_PAUSE");
    showOverlay("已暂停", "点击继续按钮恢复游戏。", false);
    dom.moduleFrame.style.visibility = "hidden";
  } else {
    postExternalGameMessage("GAME_RESUME");
    dom.moduleFrame.style.visibility = "visible";
    hideOverlay();
  }
  updateControls();
}

function prepareEmbeddedGame() {
  dom.moduleFrame.style.visibility = "visible";
  try {
    const frameWindow = dom.moduleFrame.contentWindow;
    const frameDocument = dom.moduleFrame.contentDocument;
    const style = frameDocument.createElement("style");
    style.textContent = `
      html, body {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        margin: 0 !important;
        overflow: hidden !important;
      }
      body {
        box-sizing: border-box !important;
      }
      canvas {
        max-width: 100% !important;
        max-height: 100% !important;
      }
      body > *:first-child {
        max-width: 100% !important;
        max-height: 100% !important;
      }
    `;
    frameDocument.head.appendChild(style);
    frameDocument.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    }, { capture: true });
    frameDocument.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      window.postMessage({ type: "GAME_ZOOM", deltaY: event.deltaY }, window.location.origin);
    }, { passive: false });
    frameWindow.focus();
  } catch (error) {
    // Same-origin generated modules should be accessible; ignore if a browser blocks it.
  }
}

function postExternalGameMessage(type) {
  dom.moduleFrame.contentWindow?.postMessage({ type }, window.location.origin);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }
  dom.gamePanel.requestFullscreen?.();
}

function handleStageWheel(event) {
  if (!event.ctrlKey || document.fullscreenElement) return;
  event.preventDefault();
  applyGameZoom(event.deltaY);
}

function handleFrameMessage(event) {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "GAME_ZOOM" && !document.fullscreenElement) {
    applyGameZoom(event.data.deltaY);
  }
}

function applyGameZoom(deltaY) {
  const direction = deltaY > 0 ? -0.08 : 0.08;
  externalGame.scale = Math.max(0.7, Math.min(1.5, externalGame.scale + direction));
  dom.stageWrap.style.transform = `scale(${externalGame.scale})`;
  dom.stageWrap.style.transformOrigin = "top left";
  dom.stageWrap.style.marginBottom = `${Math.max(0, (externalGame.scale - 1) * dom.stageWrap.offsetHeight)}px`;
}

function preventGameScrollKeys(event) {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
  const gameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code);
  if (!gameKey) return;
  const pointerInStage = dom.stageWrap.matches(":hover");
  const focusedInStage = dom.stageWrap.contains(document.activeElement);
  const fullscreenInGame = document.fullscreenElement && dom.gamePanel.contains(document.fullscreenElement);
  if ((externalGame.active || gameState.running) && (pointerInStage || focusedInStage || fullscreenInGame)) {
    event.preventDefault();
  }
}

function showOverlay(title, message, showRestart = true) {
  dom.overlayTitle.textContent = title;
  dom.overlayMessage.innerHTML = escapeHtml(message);
  dom.overlayRestartBtn.style.display = showRestart ? "inline-block" : "none";
  dom.overlay.classList.remove("hidden");
}

function hideOverlay() {
  dom.overlay.classList.add("hidden");
}

function showDevelopmentOverlay(progress, stage) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  dom.overlayTitle.textContent = "正在调用 API 开发";
  dom.overlayMessage.innerHTML = `
    <span class="progress-stage">${escapeHtml(stage)}</span>
    <span class="progress-bar" aria-label="开发进度">
      <span class="progress-fill" style="width: ${safeProgress}%"></span>
    </span>
    <span class="progress-percent">${safeProgress}%</span>
  `;
  dom.overlayRestartBtn.style.display = "none";
  dom.overlay.classList.remove("hidden");
}

function estimateProgress(attempt) {
  return Math.min(92, 8 + attempt * 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
