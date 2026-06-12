const path = require("path");
const fs = require("fs/promises");
const { createId } = require("../utils/ids");
const { callAi } = require("./aiClient");
const { extractJsonObject } = require("../utils/json");
const {
  isAllowedGeneratedFile,
  isSafeGeneratedPath,
  scanGeneratedContent
} = require("../utils/safeFiles");

const tasks = new Map();
const generatedRoot = path.join(__dirname, "..", "..", "frontend", "generated");

const DEVELOPMENT_HUD_GUIDANCE = `
UI HUD rules:
- Do not rely on the outer page to show score, health, time, coins, turns, lines, or wave state.
- If a generated game needs score, health, time, coins, lines, waves, or similar state, show it inside the game screen as a compact in-game HUD.
- Prefer visual icons: hearts for health/lives, stars/coins for score or money, clock for time, wave/flag labels for stages.
- Do not show irrelevant HUD fields. Gomoku, board games, puzzle games, and games without health or timers must not display fake life/time indicators.
- The game must still avoid internal start/pause/restart buttons; those controls remain on the outer page.
`;

const DEVELOPMENT_SYSTEM_PROMPT = `你是一个前端小游戏模块开发器。
你只能返回纯 JSON，不要返回 Markdown，不要返回解释，不要返回代码块。
根据用户的复杂游戏需求，生成一个可独立运行的前端小游戏模块。
返回 JSON 结构必须是：
{
  "controlsText": "用一句中文说明操作方式，例如：←/→移动，↑旋转，↓加速下落，空格硬降。",
  "files": {
    "index.html": "...",
    "style.css": "...",
    "game.js": "..."
  }
}
严格限制：
1. 只允许 index.html、style.css、game.js 三个文件。
2. 不允许使用 eval。
3. 不允许使用 new Function。
4. 不允许加载外部 CDN 或外部脚本。
5. 不允许 fetch、XMLHttpRequest、localStorage、sessionStorage、cookie。
6. 不允许读取环境变量、服务器文件或执行后端命令。
7. 必须是纯浏览器端代码。
8. index.html 必须引用 ./style.css 和 ./game.js。
9. 游戏必须有可见界面、简短游戏介绍和状态提示。
10. 游戏内部不要显示开始、暂停、继续、重新开始按钮；这些按钮由外层页面统一提供。
11. 游戏不能自动开始。必须等待外层页面发送 window message 后才运行。
12. 游戏必须监听 window message：
   - { type: "GAME_START" } 时开始或继续新局。
   - { type: "GAME_PAUSE" } 时暂停所有计时器、动画和输入响应。
   - { type: "GAME_RESUME" } 时恢复游戏。
   - { type: "GAME_RESET" } 时重置到初始等待开始状态。
13. 游戏必须阻止方向键和空格导致页面滚动。
14. controlsText 必须准确描述游戏键位，供外层页面在游戏下方展示；游戏内部不要重复显示大段操作说明。
15. 生成页面必须完全适配 iframe 容器：html/body width=100%、height=100%、margin=0、overflow=hidden。
16. 不允许页面内部出现滚动条；不要使用超过视口的固定高度布局。
17. 游戏主画面必须在 16:9 容器内完整可见，可用 CSS grid/flex 居中和 canvas 自适应。
18. 游戏主体不能缩在画面中央。主游戏区域高度至少占 iframe 高度的 78%，宽度至少占 iframe 宽度的 45%。
19. 对竖向棋盘类游戏，棋盘高度应为 min(82vh, 92%)，并保持完整可见。
20. 对俄罗斯方块，棋盘必须明显放大，不能是小矩形；必须支持左右移动、旋转、下落、消行、得分、失败、重开。
21. 如果是塔防，必须支持放置防御塔、敌人沿路线移动、攻击、金币/生命、重开。
22. 如果是扫雷，必须支持格子、雷、翻开、标记、胜负、重开。
23. 视觉素材必须丰富，不能只用纯色块。必须用 CSS 或 Canvas 绘制本地贴图效果，例如渐变、描边、高光、阴影、网格、砖纹、星空、草地、金属、能量光效、粒子或棋盘纹理。
24. 不允许依赖外部图片。所有贴图都必须通过 CSS gradient、box-shadow、Canvas path/gradient/pattern 或内联绘制实现。
25. 游戏对象要有可辨识外观：玩家、敌人、奖励、障碍、方块、塔、子弹都必须有颜色层次和边缘高光。
代码要简洁稳定，不要依赖任何外部资源。`;

function createDevelopmentTask(prompt) {
  const id = createId("dev");
  const task = {
    id,
    prompt,
    status: "developing",
    progress: 5,
    stage: "准备开发任务",
    entry: null,
    createdAt: Date.now()
  };
  tasks.set(id, task);
  developTask(task).catch((error) => {
    failTask(id, error.message);
  });

  return task;
}

function getDevelopmentTask(id) {
  return tasks.get(id) || null;
}

async function developTask(task) {
  updateTaskProgress(task.id, 15, "正在调用 AI 开发");
  console.log(`[develop] task=${task.id} calling AI developer`);
  const content = await callAi([
    { role: "system", content: DEVELOPMENT_SYSTEM_PROMPT + DEVELOPMENT_HUD_GUIDANCE },
    { role: "user", content: task.prompt }
  ]);
  updateTaskProgress(task.id, 50, "正在解析开发结果");
  const payload = extractJsonObject(content);
  const files = payload?.files;
  const controlsText = normalizeControlsText(payload?.controlsText, task.prompt);

  if (!files || typeof files !== "object") {
    throw new Error("AI developer returned invalid files JSON");
  }

  updateTaskProgress(task.id, 70, "正在进行安全检查");
  const normalizedFiles = normalizeFiles(files);
  updateTaskProgress(task.id, 85, "正在写入游戏文件");
  await writeGeneratedFiles(task.id, normalizedFiles);

  const current = tasks.get(task.id);
  if (!current) return;
  current.status = "completed";
  current.progress = 100;
  current.stage = "开发完成";
  current.entry = `/generated/${task.id}/index.html`;
  current.controlsText = controlsText;
  current.completedAt = Date.now();
  console.log(`[develop] task=${task.id} completed entry=${current.entry}`);
}

function normalizeControlsText(value, prompt) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 120);
  }
  if (String(prompt).includes("俄罗斯方块")) {
    return "操作：点击游戏区域后，使用 ←/→ 移动，↑ 旋转，↓ 加速下落，Space 硬降；使用下方按钮开始、暂停、重开。";
  }
  return "操作：点击游戏区域聚焦后按游戏提示操作；使用下方按钮开始、暂停、重开。";
}

function normalizeFiles(files) {
  const required = ["index.html", "style.css", "game.js"];
  const normalized = {};

  for (const fileName of required) {
    const content = files[fileName];
    if (!isAllowedGeneratedFile(fileName)) {
      throw new Error(`Generated file is not allowed: ${fileName}`);
    }
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`Generated file is empty: ${fileName}`);
    }
    if (!scanGeneratedContent(content)) {
      throw new Error(`Generated file failed safety scan: ${fileName}`);
    }
    normalized[fileName] = content;
  }

  return normalized;
}

async function writeGeneratedFiles(taskId, files) {
  const taskDir = path.join(generatedRoot, taskId);
  if (!isSafeGeneratedPath(generatedRoot, taskDir)) {
    throw new Error("Generated task path is unsafe");
  }

  await fs.mkdir(taskDir, { recursive: true });

  for (const [fileName, content] of Object.entries(files)) {
    const filePath = path.join(taskDir, fileName);
    if (!isSafeGeneratedPath(taskDir, filePath)) {
      throw new Error(`Generated file path is unsafe: ${fileName}`);
    }
    await fs.writeFile(filePath, content, "utf8");
  }
}

function failTask(id, reason) {
  const current = tasks.get(id);
  if (!current || current.status !== "developing") return;
  current.status = "failed";
  current.progress = 100;
  current.stage = "开发失败，正在加载默认小游戏";
  current.failedReason = reason;
  current.failedAt = Date.now();
  console.warn(`[develop] task=${id} failed: ${reason}`);
}

function updateTaskProgress(id, progress, stage) {
  const current = tasks.get(id);
  if (!current || current.status !== "developing") return;
  current.progress = Math.max(current.progress || 0, progress);
  current.stage = stage;
}

module.exports = { createDevelopmentTask, getDevelopmentTask };
