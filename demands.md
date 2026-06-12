# AGENTS.md —《一句话生成小游戏》项目需求文档

> 本文档用于直接交给 Codex 阅读和执行。  
> 目标是让 Codex 根据本文档生成一个完整可运行的 AI 生成版小游戏项目。

---

## 1. 项目名称

**一句话生成小游戏**

英文可称为：

**One-Sentence AI Mini Game Generator**

---

## 2. 项目定位

这是一个 **AI 生成版小游戏生成器**。

用户输入一句自然语言描述后，系统通过后端调用大模型，让 AI 生成一个结构化的 `GameSpec` JSON。前端不会执行 AI 返回的代码，而是使用一个通用 Canvas 游戏引擎读取 `GameSpec`，动态组合并运行小游戏。

核心流程：

```text
用户输入一句话
→ 前端发送 prompt 给后端
→ 后端调用大模型 API
→ 大模型返回 GameSpec JSON
→ 后端校验、补全、规范化 GameSpec
→ 前端接收 GameSpec
→ 前端通用游戏引擎根据 GameSpec 运行小游戏
```

---

## 3. 重要设计原则

### 3.1 这是 AI 生成版，不是关键词解析版

本项目需要通过后端调用大模型生成 `GameSpec`，而不是只在前端用关键词匹配生成配置。

可以保留 fallback 默认配置，但核心路径必须是：

```text
用户输入 → 后端 AI 调用 → AI 生成 GameSpec → 前端运行游戏
```

### 3.2 AI 只生成配置，不生成代码

AI 只能返回结构化 JSON 配置。

严禁：

- 执行 AI 返回的 JavaScript 代码
- 使用 `eval`
- 使用 `new Function`
- 让 AI 直接返回 HTML/CSS/JS 游戏代码
- 把 AI 返回内容当作可执行代码运行

正确方式：

```text
AI 返回 GameSpec JSON
前端通用游戏引擎读取 GameSpec
```

### 3.3 不要写死成固定小游戏模板

不要把项目实现成：

```js
if (type === "runner") startRunnerGame();
if (type === "dodge") startDodgeGame();
if (type === "clicker") startClickerGame();
```

允许根据 `player.control` 做基础操作分支，例如：

```js
switch (gameSpec.player.control) {
  case "move":
    // 左右移动 + 物体掉落
    break;
  case "jump":
    // 跳跃 + 横向障碍
    break;
  case "click":
    // 点击随机出现目标
    break;
  case "shoot":
    // 移动 + 发射子弹
    break;
}
```

但项目对外表达必须是：

> AI 生成 GameSpec，通用游戏引擎根据配置动态运行游戏。

---

## 4. 技术栈要求

请使用：

```text
前端：原生 HTML + CSS + JavaScript
游戏渲染：Canvas
后端：Node.js + Express
环境变量：dotenv
数据库：不需要
前端框架：不使用 React / Vue / Angular
TypeScript：不使用
```

不依赖外部 CDN，不使用图片素材，游戏角色、敌人、奖励、障碍物优先使用 emoji 绘制。

---

## 5. 项目文件结构

请生成如下结构：

```text
ai-game-generator/
├── public/
│   ├── index.html
│   ├── style.css
│   └── game.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## 6. package.json 要求

请生成 `package.json`，至少包含：

```json
{
  "name": "ai-game-generator",
  "version": "1.0.0",
  "description": "一句话生成小游戏：AI 生成 GameSpec，前端通用引擎运行小游戏。",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "latest",
    "dotenv": "latest",
    "cors": "latest"
  }
}
```

如果需要调用模型 API，可以使用 Node.js 原生 `fetch`。不要额外引入复杂 SDK，除非非常必要。

---

## 7. .env.example 要求

请生成 `.env.example`：

```env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
PORT=3000
```

要求：

1. API Key 只能放在 `.env` 中。
2. 前端不能出现 API Key。
3. `server.js` 从 `process.env.AI_API_KEY` 读取 key。
4. `AI_BASE_URL`、`AI_MODEL`、`PORT` 也从环境变量读取。
5. 如果没有配置 API Key，后端要返回明确错误，不要崩溃。

---

## 8. 后端接口要求

请实现 `server.js`。

使用 Express 提供静态文件服务和 API。

### 8.1 静态文件

后端需要托管 `public/` 目录：

```text
GET /
GET /index.html
GET /style.css
GET /game.js
```

访问地址：

```text
http://localhost:3000
```

### 8.2 AI 生成接口

实现：

```http
POST /api/generate-game-spec
```

请求体：

```json
{
  "prompt": "小猫在太空中躲避陨石收集星星"
}
```

成功响应：

```json
{
  "success": true,
  "gameSpec": {
    "...": "..."
  }
}
```

失败响应：

```json
{
  "success": false,
  "message": "AI 生成失败，已使用默认配置。",
  "fallbackSpec": {
    "...": "..."
  }
}
```

后端不能把完整错误堆栈暴露给前端。

---

## 9. 后端 AI 调用要求

后端调用大模型 API 时，需要让 AI 严格返回 JSON。

### 9.1 System Prompt 要求

请在后端准备一个 system prompt，大致内容如下：

```text
你是一个小游戏配置生成器。
用户会输入一句自然语言描述。
你的任务是根据用户输入生成一个 GameSpec JSON。
你只能返回 JSON，不要返回 Markdown，不要返回解释，不要返回代码块。
GameSpec 必须符合指定结构。
如果用户描述不完整，请自动补全合理默认值。
不要生成 JavaScript 代码。
不要生成 HTML/CSS。
不要生成危险内容。
```

### 9.2 AI 返回限制

AI 返回内容必须是纯 JSON，不允许包含：

```text
```json
解释文字
Markdown
JavaScript 代码
HTML 代码
```

后端仍然需要容错：如果 AI 返回了代码块，需要尝试提取 JSON；如果提取失败，使用 fallback。

---

## 10. GameSpec 数据结构

AI 必须返回以下结构：

```json
{
  "title": "游戏标题",
  "description": "游戏说明",
  "scene": {
    "theme": "space",
    "backgroundColor": "#0f172a",
    "groundColor": "#334155"
  },
  "player": {
    "name": "小猫",
    "emoji": "🐱",
    "health": 3,
    "control": "move",
    "speed": 5
  },
  "objects": [
    {
      "name": "陨石",
      "emoji": "☄️",
      "type": "obstacle",
      "behavior": "falling",
      "effect": "damage",
      "points": 0,
      "damage": 1,
      "speed": 3,
      "hp": 1
    },
    {
      "name": "星星",
      "emoji": "⭐",
      "type": "reward",
      "behavior": "falling",
      "effect": "score",
      "points": 10,
      "damage": 0,
      "speed": 2,
      "hp": 1
    }
  ],
  "rules": {
    "timeLimit": 30,
    "scoreTarget": 100,
    "winCondition": "scoreTarget",
    "loseCondition": "healthZero"
  },
  "difficulty": {
    "name": "normal",
    "spawnRate": 1000,
    "objectSpeed": 2.5
  }
}
```

---

## 11. GameSpec 字段取值限制

为了保证前端引擎稳定，必须限制字段取值。

### 11.1 scene.theme

只能是：

```text
space | forest | city | ocean | desert | default
```

### 11.2 player.control

只能是：

```text
move | jump | click | shoot
```

### 11.3 objects.type

只能是：

```text
enemy | reward | obstacle | target
```

### 11.4 objects.behavior

只能是：

```text
falling | movingLeft | randomAppear | static | chase
```

### 11.5 objects.effect

只能是：

```text
score | damage | win | none
```

### 11.6 rules.winCondition

只能是：

```text
scoreTarget | surviveTime | collectAll | defeatAll
```

### 11.7 rules.loseCondition

只能是：

```text
healthZero | timeOut | collision
```

### 11.8 difficulty.name

只能是：

```text
easy | normal | hard
```

---

## 12. 后端 JSON 校验与规范化

请实现：

```js
function validateAndNormalizeGameSpec(rawSpec) {
  // 校验、补全、规范化 AI 返回的 GameSpec
}
```

此函数必须完成：

1. 检查 AI 返回是否为合法对象。
2. 检查必要字段是否存在。
3. 缺失字段时补默认值。
4. 字段值不在允许范围内时改成默认值。
5. 确保 `objects` 至少有一个可交互物体。
6. 确保 `player.health` 是合理数字，例如 1 到 10。
7. 确保 `player.speed` 是合理数字，例如 2 到 12。
8. 确保 `rules.timeLimit` 是合理数字，例如 10 到 120。
9. 确保 `rules.scoreTarget` 是合理数字，例如 10 到 500。
10. 确保 `difficulty.spawnRate` 是合理数字，例如 300 到 3000。
11. 确保 `difficulty.objectSpeed` 是合理数字，例如 1 到 10。
12. 最终返回一个稳定可用的 `GameSpec`。

如果 AI 返回无法解析，请使用 fallback。

---

## 13. fallback GameSpec

请实现：

```js
function createFallbackSpec(prompt) {
  // 返回默认小游戏配置
}
```

默认 fallback：

```json
{
  "title": "默认冒险小游戏",
  "description": "控制角色移动，躲避危险物并收集星星，达到目标分数即可获胜。",
  "scene": {
    "theme": "default",
    "backgroundColor": "#1e293b",
    "groundColor": "#475569"
  },
  "player": {
    "name": "冒险者",
    "emoji": "😀",
    "health": 3,
    "control": "move",
    "speed": 5
  },
  "objects": [
    {
      "name": "危险物",
      "emoji": "⚠️",
      "type": "obstacle",
      "behavior": "falling",
      "effect": "damage",
      "points": 0,
      "damage": 1,
      "speed": 3,
      "hp": 1
    },
    {
      "name": "星星",
      "emoji": "⭐",
      "type": "reward",
      "behavior": "falling",
      "effect": "score",
      "points": 10,
      "damage": 0,
      "speed": 2,
      "hp": 1
    }
  ],
  "rules": {
    "timeLimit": 30,
    "scoreTarget": 100,
    "winCondition": "scoreTarget",
    "loseCondition": "healthZero"
  },
  "difficulty": {
    "name": "normal",
    "spawnRate": 1000,
    "objectSpeed": 2.5
  }
}
```

---

## 14. 前端页面要求

`public/index.html` 需要包含以下区域。

### 14.1 标题区

标题：

```text
一句话生成小游戏
```

副标题：

```text
输入一句话，让 AI 自动生成属于你的小游戏
```

### 14.2 输入区

包含：

- 文本输入框
- “AI 生成游戏”按钮

输入框 placeholder：

```text
例如：小猫在太空中躲避陨石收集星星
```

### 14.3 示例句子按钮

至少包含以下示例，点击后自动填入输入框：

```text
小猫在太空中躲避陨石收集星星
勇士点击怪物获得金币
小狗在森林里跳过木桩向前奔跑
机器人射击外星怪物保护基地
在规定时间内快速点击出现的地鼠
忍者在城市中躲避飞镖并收集宝石
宇航员在宇宙中发射子弹消灭外星怪物
小鸟在森林中躲避蜜蜂收集糖果
```

### 14.4 GameSpec 展示区

展示：

- 游戏标题
- 游戏说明
- 玩家角色
- 场景
- 操作方式
- 主要物体
- 胜利条件
- 失败条件
- 难度

### 14.5 Canvas 游戏区

使用 Canvas。

建议尺寸：

```text
800 x 450
```

要求：

- 居中显示
- 有边框
- 根据 `scene.theme` 改变背景效果
- 使用 emoji 绘制玩家、敌人、障碍物和奖励物

### 14.6 状态栏

显示：

- 分数
- 生命值
- 剩余时间
- 当前状态：未开始 / 生成中 / 已生成 / 运行中 / 暂停 / 胜利 / 失败

### 14.7 控制按钮

包含：

- 开始游戏
- 暂停游戏
- 重新开始

### 14.8 游戏结束提示层

游戏结束时显示：

- 胜利或失败
- 最终分数
- 重新开始按钮

---

## 15. 前端 game.js 主要函数

请在 `public/game.js` 中实现：

```js
async function generateGameWithAI() {
  // 读取输入框内容
  // POST 到 /api/generate-game-spec
  // 获取 gameSpec 或 fallbackSpec
  // 展示 GameSpec
  // 保存为 gameState.currentSpec
}

function runGame(gameSpec) {
  // 根据 GameSpec 初始化并开始游戏
}

function resetGame() {
  // 清理旧游戏状态
}

function updateGame() {
  // 游戏主循环
}

function renderGame() {
  // 渲染游戏画面
}

function endGame(result) {
  // 游戏结束，result 为 "win" 或 "lose"
}

function isColliding(a, b) {
  // 矩形碰撞检测
}
```

建议拆分更多小函数：

```js
initDom()
bindEvents()
showGameSpec(spec)
setupPlayer(spec)
spawnObject()
createRuntimeObject(specObject)
updatePlayer()
updateObjects()
updateBullets()
checkCollisions()
checkWinLose()
drawBackground()
drawPlayer()
drawObjects()
drawBullets()
drawHUD()
```

---

## 16. 前端 gameState

维护统一状态：

```js
const gameState = {
  running: false,
  paused: false,
  score: 0,
  health: 3,
  timeLeft: 30,
  objects: [],
  bullets: [],
  keys: {},
  animationId: null,
  spawnTimer: null,
  countdownTimer: null,
  currentSpec: null,
  result: null,
  defeatedCount: 0
};
```

要求：

每次生成新游戏、开始新游戏、重新开始时，都必须调用 `resetGame()`。

`resetGame()` 必须清理：

- `requestAnimationFrame`
- `setInterval`
- `setTimeout`
- 运行时 objects
- bullets
- keys
- result
- 旧状态

避免多个动画循环或计时器同时运行。

---

## 17. 通用游戏引擎能力

前端通用游戏引擎需要根据 `GameSpec` 动态运行，而不是固定模板。

主要根据这些字段决定玩法：

```text
player.control
objects.type
objects.behavior
objects.effect
rules.winCondition
rules.loseCondition
difficulty.spawnRate
difficulty.objectSpeed
```

---

## 18. control 运行逻辑

### 18.1 control = move

玩法：

- 玩家使用左右方向键移动
- `falling` 物体从上方向下掉落
- `reward` 碰到玩家加分
- `obstacle` / `enemy` 碰到玩家扣生命
- 达到 `scoreTarget` 胜利
- 生命为 0 失败

### 18.2 control = jump

玩法：

- 玩家位于地面上
- 按空格键跳跃
- `movingLeft` 物体从右向左移动
- 碰到 `obstacle` / `enemy` 扣生命或失败
- 存活到 `timeLimit` 或达到分数目标则胜利

### 18.3 control = click

玩法：

- `target` / `enemy` 随机出现在游戏区域
- 玩家点击目标加分
- 如果是 `enemy`，可以有 `hp`
- 点击后目标刷新到随机位置
- 有倒计时
- 达到 `scoreTarget` 或击败足够目标则胜利
- 时间结束未完成目标则失败

### 18.4 control = shoot

玩法：

- 玩家使用左右方向键移动
- 按空格键发射子弹
- `enemy` 从上方出现或追踪玩家
- 子弹击中 `enemy` 后敌人消失并加分
- `enemy` 碰到玩家或到底部扣生命
- 达到目标分数或消灭目标数量则胜利
- 生命为 0 失败

---

## 19. behavior 实现要求

### 19.1 falling

- 物体从上方随机 x 位置生成
- 不断向下移动
- 超出底部后移除

### 19.2 movingLeft

- 物体从右侧生成
- 向左移动
- 超出左侧后移除

### 19.3 randomAppear

- 物体随机出现在游戏区域
- 等待玩家点击
- 点击后刷新位置

### 19.4 static

- 固定位置显示
- 可作为终点、目标或装饰

### 19.5 chase

- 物体缓慢向玩家方向移动
- 碰到玩家后造成伤害

---

## 20. effect 实现要求

### 20.1 score

- 碰撞或点击后加分

### 20.2 damage

- 碰撞后扣生命

### 20.3 win

- 触发胜利

### 20.4 none

- 无效果，仅显示

---

## 21. 碰撞检测要求

实现矩形碰撞检测：

```js
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
```

玩家、物体、子弹都需要有：

```text
x
y
width
height
```

碰撞后根据 `effect` 执行：

- 加分
- 扣生命
- 胜利
- 移除物体

避免同一物体重复触发碰撞。

---

## 22. Canvas 渲染要求

使用 emoji 绘制角色和物体。

需要实现：

```js
drawBackground()
drawPlayer()
drawObjects()
drawBullets()
drawHUD()
```

根据 `scene.theme` 绘制不同背景：

```text
space：深蓝/黑色背景，可画星星
forest：绿色背景，可画地面
city：灰蓝背景，可画简单楼房
ocean：蓝色背景，可画水波
desert：黄色背景，可画沙丘
default：深色渐变背景
```

---

## 23. CSS 风格要求

`public/style.css` 要求：

1. 页面整体美观，适合作为课程项目展示。
2. 使用现代卡片式布局。
3. 背景使用渐变。
4. 按钮有 hover 效果。
5. 输入框清晰美观。
6. GameSpec 展示区像配置卡片。
7. Canvas 居中。
8. 状态栏清晰。
9. 适配常见电脑屏幕。
10. 字体清晰，重点信息突出。

---

## 24. 必须保证以下输入可运行

请确保这些输入都能生成可玩的游戏，并且玩法有明显区别：

### 24.1 小猫在太空中躲避陨石收集星星

预期：

- 角色：小猫
- 场景：太空
- 操作：左右移动
- 陨石造成伤害
- 星星加分

### 24.2 勇士点击怪物获得金币

预期：

- 操作：点击
- 怪物随机出现
- 点击怪物得分
- 有倒计时或目标分数

### 24.3 小狗在森林里跳过木桩向前奔跑

预期：

- 操作：跳跃
- 木桩从右向左移动
- 按空格跳过木桩

### 24.4 机器人射击外星怪物保护基地

预期：

- 操作：射击
- 左右移动
- 空格发射子弹
- 怪物出现
- 击中怪物加分

### 24.5 在规定时间内快速点击出现的地鼠

预期：

- 操作：点击
- 地鼠随机出现
- 点击地鼠加分
- 时间结束结算

### 24.6 忍者在城市中躲避飞镖并收集宝石

预期：

- 操作：左右移动
- 飞镖造成伤害
- 宝石加分
- 城市场景

### 24.7 宇航员在宇宙中发射子弹消灭外星怪物

预期：

- 操作：射击
- 太空/宇宙场景
- 子弹击中外星怪物加分

### 24.8 小鸟在森林中躲避蜜蜂收集糖果

预期：

- 操作：移动
- 森林场景
- 蜜蜂造成伤害
- 糖果加分

---

## 25. 安全要求

必须满足：

1. API Key 只能放在 `.env` 文件。
2. 前端不能出现 API Key。
3. 后端不能直接相信 AI 返回结果。
4. AI 返回的 `GameSpec` 必须经过校验和规范化。
5. 缺少字段时补默认值。
6. 字段非法时替换为允许值。
7. 不允许 `eval`。
8. 不允许执行 AI 返回的代码。
9. AI 只能返回 JSON 配置。
10. AI 失败时使用 fallback 默认游戏。
11. 后端不要把完整错误堆栈返回给前端。
12. 输入 prompt 为空时，应返回友好提示。

---

## 26. README.md 要求

请生成 `README.md`，包含：

1. 项目介绍。
2. 项目运行方式。
3. 如何配置 `.env`。
4. 如何启动后端。
5. 如何访问页面。
6. 项目核心流程。
7. `GameSpec` 设计说明。
8. 为什么 AI 只生成配置、不生成代码。
9. 安全设计说明。
10. 示例输入。

运行方式示例：

```bash
npm install
cp .env.example .env
npm start
```

然后访问：

```text
http://localhost:3000
```

---

## 27. 答辩展示重点

请在页面文案、代码注释和 README 中体现：

1. 本项目是 AI 生成版，不是简单关键词匹配版。
2. 用户输入一句话。
3. 后端调用大模型生成 `GameSpec`。
4. AI 不直接生成游戏代码。
5. 前端通用游戏引擎读取 `GameSpec`。
6. `GameSpec` 决定角色、场景、操作方式、物体行为和胜负条件。
7. 这种设计比固定游戏模板更灵活。
8. 这种设计比直接执行 AI 代码更安全稳定。
9. 后端用于保护 API Key。
10. fallback 保证展示时不容易翻车。

答辩时可概括为：

> 本项目采用 AI + GameSpec + 通用游戏引擎的结构。AI 根据用户输入的一句话生成结构化游戏配置，而不是直接生成代码。前端游戏引擎读取配置后，动态组合角色、场景、操作方式、物体行为和胜负条件，从而生成可玩的小游戏。

---

## 28. 最终交付要求

请根据本文档直接生成完整项目代码。

需要输出并创建以下文件：

```text
package.json
server.js
.env.example
public/index.html
public/style.css
public/game.js
README.md
```

不要只给思路。

不要省略代码。

不要写“其余代码略”。

代码需要可以复制到本地直接运行。

---

## 29. 验收标准

项目完成后应满足：

1. `npm install` 成功。
2. `npm start` 成功启动服务。
3. 浏览器访问 `http://localhost:3000` 可以看到页面。
4. 输入一句话并点击“AI 生成游戏”，前端会请求后端。
5. 后端能调用 AI API 并返回 `GameSpec`。
6. 如果 AI 调用失败，能返回 fallback 游戏配置。
7. 前端能展示 `GameSpec`。
8. 点击“开始游戏”后，Canvas 中小游戏可以运行。
9. 分数、生命值、时间、游戏状态会更新。
10. 暂停、重新开始可用。
11. 胜利或失败时有明确提示。
12. 前端不出现 API Key。
13. 项目没有明显控制台报错。
14. 不使用 `eval` 或执行 AI 返回代码。
15. 至少第 24 节中的 8 个示例输入都能生成可玩的小游戏。

---

## 30. 给 Codex 的执行建议

请优先保证项目能跑通，再优化样式和细节。

建议实现顺序：

1. 创建项目结构和 `package.json`。
2. 实现 Express 静态服务。
3. 实现 `/api/generate-game-spec`。
4. 实现 AI 调用与 fallback。
5. 实现 `validateAndNormalizeGameSpec`。
6. 实现前端页面。
7. 实现前端请求 AI 接口。
8. 实现 Canvas 游戏引擎基础状态。
9. 实现 `move`、`jump`、`click`、`shoot` 四种 control。
10. 实现 `falling`、`movingLeft`、`randomAppear`、`chase`、`static` 行为。
11. 实现胜负判断。
12. 美化 UI。
13. 补充 README。
14. 用 8 个示例输入逐一测试。
