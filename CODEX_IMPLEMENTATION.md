# Codex 实现文档：一句话生成小游戏

本文档用于交给 Codex 直接阅读和执行。目标是根据当前 PRD 实现一个产品化的“一句话生成小游戏”项目。

---

## 1. 项目目标

实现一个 AI 驱动的小游戏生成产品。

用户输入一句自然语言描述后，系统根据输入选择不同生成路径：

```text
普通轻量小游戏 → AI 生成 GameSpec → 通用 Canvas 引擎运行
已有复杂游戏 → 加载专业模块
未知复杂游戏 → 调用 API 开发模式 → 显示“正在调用 API 开发”
失败情况 → fallback 默认小游戏
```

核心要求：

1. 前后端分离目录。
2. 前端使用原生 HTML、CSS、JavaScript。
3. 游戏渲染使用 Canvas。
4. 后端使用 Node.js + Express。
5. AI API Key 只能在后端 `.env` 中读取。
6. 普通游戏由 `GameSpec` 驱动。
7. 通用引擎和专业模块都可扩展。
8. 复杂未知需求进入 API 开发模式。
9. AI 返回内容必须校验。
10. 不允许执行 AI 返回的任意代码。

---

## 2. 推荐项目结构

请按以下结构创建项目：

```text
ai-game-generator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── engine/
│   │   ├── gameSpecEngine.js
│   │   ├── state.js
│   │   ├── renderer.js
│   │   ├── controls.js
│   │   ├── objects.js
│   │   ├── collision.js
│   │   └── rules.js
│   ├── modules/
│   │   └── gomoku/
│   │       ├── index.html
│   │       ├── style.css
│   │       └── game.js
│   └── generated/
│       └── .gitkeep
│
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── generateGameSpec.js
│   │   ├── developGame.js
│   │   └── modules.js
│   ├── services/
│   │   ├── aiClient.js
│   │   ├── promptRouter.js
│   │   ├── gameSpecGenerator.js
│   │   ├── gameDeveloper.js
│   │   └── moduleRegistry.js
│   ├── validators/
│   │   └── gameSpecValidator.js
│   ├── fallbacks/
│   │   └── fallbackSpec.js
│   └── utils/
│       ├── json.js
│       ├── safeFiles.js
│       └── ids.js
│
├── package.json
├── .env.example
├── README.md
├── PRD.md
└── CODEX_IMPLEMENTATION.md
```

---

## 3. 技术栈

必须使用：

```text
前端：原生 HTML + CSS + JavaScript
游戏渲染：Canvas
后端：Node.js + Express
环境变量：dotenv
跨域：cors
数据库：不需要
前端框架：不使用 React / Vue / Angular
TypeScript：不使用
```

依赖：

```json
{
  "dependencies": {
    "express": "latest",
    "dotenv": "latest",
    "cors": "latest"
  }
}
```

---

## 4. package.json 要求

根目录创建 `package.json`：

```json
{
  "name": "ai-game-generator",
  "version": "1.0.0",
  "description": "一句话生成小游戏：AI 生成 GameSpec，通用引擎和专业模块运行小游戏。",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "node backend/server.js"
  },
  "dependencies": {
    "express": "latest",
    "dotenv": "latest",
    "cors": "latest"
  }
}
```

---

## 5. 环境变量

创建 `.env.example`：

```env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
PORT=3000
```

要求：

1. API Key 只能放在 `.env`。
2. 前端不能出现 API Key。
3. 后端从 `process.env.AI_API_KEY` 读取 key。
4. 未配置 API Key 时不能崩溃，需要返回 fallback 或明确提示。

---

## 6. 后端职责

后端位于：

```text
backend/
```

后端负责：

1. 启动 Express 服务。
2. 托管 `frontend/` 静态文件。
3. 接收用户 prompt。
4. 判断 prompt 走哪条生成路径。
5. 调用 AI 生成 `GameSpec`。
6. 校验和规范化 `GameSpec`。
7. 返回 fallback。
8. 维护专业模块注册表。
9. 处理 API 开发模式。
10. 检查生成文件安全性。

---

## 7. 后端接口

### 7.1 生成游戏入口

```http
POST /api/generate-game-spec
```

请求体：

```json
{
  "prompt": "小猫在太空中躲避陨石收集星星"
}
```

后端需要先调用 `routePrompt(prompt)` 判断路径。

可能响应一：普通 GameSpec

```json
{
  "success": true,
  "classification": "supported",
  "generationMode": "gameSpec",
  "gameSpec": {}
}
```

可能响应二：专业模块

```json
{
  "success": true,
  "classification": "builtInModule",
  "generationMode": "module",
  "moduleEntry": "/modules/gomoku/index.html",
  "message": "已加载五子棋模块。"
}
```

可能响应三：API 开发模式

```json
{
  "success": true,
  "classification": "developmentRequired",
  "generationMode": "apiDevelopment",
  "developmentTaskId": "dev_123456",
  "message": "正在调用 API 开发"
}
```

可能响应四：fallback

```json
{
  "success": false,
  "classification": "fallback",
  "generationMode": "fallback",
  "message": "生成失败，已加载默认小游戏。",
  "fallbackSpec": {}
}
```

### 7.2 API 开发接口

```http
POST /api/develop-game
```

请求体：

```json
{
  "prompt": "设计一个五子棋游戏"
}
```

响应：

```json
{
  "success": true,
  "developmentTaskId": "dev_123456",
  "status": "developing",
  "message": "正在调用 API 开发"
}
```

### 7.3 查询开发结果

```http
GET /api/develop-game/:taskId
```

开发中：

```json
{
  "success": true,
  "status": "developing",
  "message": "正在调用 API 开发"
}
```

开发完成：

```json
{
  "success": true,
  "status": "completed",
  "gameType": "custom",
  "entry": "/generated/dev_123456/index.html",
  "message": "游戏开发完成"
}
```

开发失败：

```json
{
  "success": false,
  "status": "failed",
  "message": "API 开发失败，已使用默认配置。",
  "fallbackSpec": {}
}
```

---

## 8. Prompt 路由逻辑

实现文件：

```text
backend/services/promptRouter.js
```

需要导出：

```js
function routePrompt(prompt) {}
```

分类结果：

```text
invalid
supported
mappable
builtInModule
developmentRequired
fallback
```

推荐逻辑：

```js
function routePrompt(prompt) {
  if (!isValidPrompt(prompt)) {
    return { classification: "invalid" };
  }

  const module = matchBuiltInModule(prompt);
  if (module) {
    return {
      classification: "builtInModule",
      generationMode: "module",
      moduleEntry: module.entry
    };
  }

  if (isSupportedByGameSpecEngine(prompt)) {
    return {
      classification: "supported",
      generationMode: "gameSpec"
    };
  }

  if (isMappableToGameSpecEngine(prompt)) {
    return {
      classification: "mappable",
      generationMode: "gameSpec"
    };
  }

  if (requiresDevelopment(prompt)) {
    return {
      classification: "developmentRequired",
      generationMode: "apiDevelopment"
    };
  }

  return {
    classification: "fallback",
    generationMode: "fallback"
  };
}
```

复杂需求示例：

```text
五子棋
象棋
围棋
塔防
卡牌
回合制 RPG
复杂经营
复杂解谜
```

这些如果没有命中专业模块，应进入 API 开发模式。

---

## 9. 专业模块机制

实现文件：

```text
backend/services/moduleRegistry.js
```

示例：

```js
const gameModules = {
  gomoku: {
    name: "五子棋",
    entry: "/modules/gomoku/index.html",
    keywords: ["五子棋", "连珠", "黑白棋子"]
  }
};
```

要求：

1. 命中已有专业模块时，不走 GameSpec。
2. 命中已有专业模块时，不走 API 开发。
3. 前端通过 iframe 或容器加载 `moduleEntry`。

先实现一个五子棋模块：

```text
frontend/modules/gomoku/
├── index.html
├── style.css
└── game.js
```

五子棋模块至少支持：

1. 棋盘绘制。
2. 点击落子。
3. 黑白双方轮流。
4. 禁止重复落子。
5. 横竖斜五连检测。
6. 胜负提示。
7. 重新开始。

---

## 10. GameSpec 结构

普通小游戏使用 `GameSpec` 驱动。

标准结构：

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

枚举限制：

```text
scene.theme = space | forest | city | ocean | desert | default
player.control = move | jump | click | shoot
objects.type = enemy | reward | obstacle | target
objects.behavior = falling | movingLeft | randomAppear | static | chase
objects.effect = score | damage | win | none
rules.winCondition = scoreTarget | surviveTime | collectAll | defeatAll
rules.loseCondition = healthZero | timeOut | collision
difficulty.name = easy | normal | hard
```

---

## 11. GameSpec 校验

实现文件：

```text
backend/validators/gameSpecValidator.js
```

必须实现：

```js
function validateAndNormalizeGameSpec(rawSpec) {}
```

要求：

1. 检查 AI 返回是否为合法对象。
2. 缺失字段补默认值。
3. 非法枚举替换默认值。
4. `objects` 至少有一个可交互物体。
5. `player.health` 限制在 1 到 10。
6. `player.speed` 限制在 2 到 12。
7. `rules.timeLimit` 限制在 10 到 120。
8. `rules.scoreTarget` 限制在 10 到 500。
9. `difficulty.spawnRate` 限制在 300 到 3000。
10. `difficulty.objectSpeed` 限制在 1 到 10。
11. 最终返回稳定可用的 `GameSpec`。

---

## 12. fallback

实现文件：

```text
backend/fallbacks/fallbackSpec.js
```

必须实现：

```js
function createFallbackSpec(prompt) {}
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

## 13. 前端职责

前端位于：

```text
frontend/
```

前端负责：

1. 展示产品页面。
2. 收集用户输入。
3. 调用后端接口。
4. 展示 `GameSpec`。
5. 运行通用 GameSpec 引擎。
6. 加载专业模块。
7. 显示 API 开发状态。
8. 轮询开发任务。
9. 显示 fallback 游戏。

---

## 14. 前端页面要求

`frontend/index.html` 包含：

1. 标题：一句话生成小游戏
2. 副标题：输入一句话，让 AI 自动生成属于你的小游戏
3. 输入框
4. AI 生成游戏按钮
5. 示例句子按钮
6. GameSpec 展示区
7. Canvas 游戏区
8. 模块 iframe 或模块容器
9. 状态栏
10. 开始 / 暂停 / 重新开始按钮
11. 游戏结束提示层

状态枚举：

```text
未开始 / 生成中 / API开发中 / 已生成 / 运行中 / 暂停 / 胜利 / 失败
```

当进入 API 开发模式，页面必须显示：

```text
正在调用 API 开发
```

---

## 15. 通用 GameSpec 引擎

实现目录：

```text
frontend/engine/
```

核心函数：

```js
runGame(gameSpec)
resetGame()
updateGame()
renderGame()
endGame(result)
isColliding(a, b)
```

支持 control：

```text
move
jump
click
shoot
```

支持 behavior：

```text
falling
movingLeft
randomAppear
static
chase
```

支持 effect：

```text
score
damage
win
none
```

`gameState`：

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

`resetGame()` 必须清理：

1. `requestAnimationFrame`
2. `setInterval`
3. `setTimeout`
4. objects
5. bullets
6. keys
7. result
8. 旧状态

---

## 16. API 开发模式

实现文件：

```text
backend/services/gameDeveloper.js
backend/routes/developGame.js
backend/utils/safeFiles.js
```

生成目录：

```text
frontend/generated/{taskId}/
```

允许生成：

```text
index.html
style.css
game.js
```

禁止：

```text
eval
new Function
外部 CDN
跨目录写入
读取 .env
读取服务器敏感文件
后端命令执行
```

开发失败时：

```text
显示：API 开发失败，已为你加载默认小游戏。
加载：createFallbackSpec(prompt)
```

---

## 17. 开发顺序

请按以下顺序实现：

### 阶段 1：项目初始化

1. 创建前后端目录。
2. 创建 `package.json`。
3. 创建 `.env.example`。
4. 创建 Express 服务。
5. 托管 `frontend/`。

验收：

```text
npm start
http://localhost:3000 可以打开页面
```

### 阶段 2：前端基础页面

1. 实现 `frontend/index.html`。
2. 实现 `frontend/style.css`。
3. 实现 `frontend/main.js` 基础事件。

验收：

```text
输入框、示例按钮、状态栏、Canvas、控制按钮可见。
```

### 阶段 3：后端 fallback 链路

1. 实现 `/api/generate-game-spec`。
2. 先直接返回 fallback。
3. 前端展示 fallback。

验收：

```text
点击生成后可以看到默认 GameSpec。
```

### 阶段 4：GameSpec 校验

1. 实现 `validateAndNormalizeGameSpec`。
2. 实现 JSON 提取工具。
3. 测试非法字段和缺失字段。

验收：

```text
任何不完整对象都能补成稳定 GameSpec。
```

### 阶段 5：AI 生成 GameSpec

1. 实现 `aiClient.js`。
2. 实现 `gameSpecGenerator.js`。
3. 配置 system prompt。
4. 接入后端接口。

验收：

```text
配置 API Key 后可以生成 GameSpec。
未配置 API Key 时返回 fallback。
```

### 阶段 6：通用引擎

1. 实现 Canvas 主循环。
2. 实现 move。
3. 实现 jump。
4. 实现 click。
5. 实现 shoot。
6. 实现物体行为和碰撞。
7. 实现胜负判断。

验收：

```text
8 个基础示例输入都能生成可玩的小游戏。
```

### 阶段 7：Prompt 路由

1. 实现 `promptRouter.js`。
2. 实现 `moduleRegistry.js`。
3. 接入 `/api/generate-game-spec`。

验收：

```text
普通小游戏走 GameSpec。
五子棋优先命中专业模块或进入 API 开发模式。
```

### 阶段 8：专业模块

1. 实现 `frontend/modules/gomoku/`。
2. 后端注册 gomoku。
3. 前端加载 moduleEntry。

验收：

```text
输入“五子棋”可以加载五子棋模块。
```

### 阶段 9：API 开发模式

1. 实现 `/api/develop-game`。
2. 实现 `/api/develop-game/:taskId`。
3. 前端显示 API开发中。
4. 前端轮询任务状态。
5. 成功后加载 generated。
6. 失败后 fallback。

验收：

```text
未知复杂需求显示“正在调用 API 开发”。
```

### 阶段 10：安全和收尾

1. 实现 `safeFiles.js`。
2. 检查不出现 `eval`。
3. 检查不出现 `new Function`。
4. 检查前端没有 API Key。
5. 完善 README。
6. 完整测试。

---

## 18. 必测输入

基础 GameSpec：

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

专业模块或 API 开发：

```text
设计一个五子棋游戏
做一个象棋游戏
做一个塔防游戏
做一个经营奶茶店游戏
做一个密室逃脱游戏
```

---

## 19. 最终验收标准

1. `npm install` 成功。
2. `npm start` 成功。
3. `http://localhost:3000` 能访问。
4. 前端不暴露 API Key。
5. 普通输入能生成 GameSpec。
6. GameSpec 能被前端通用引擎运行。
7. 复杂已支持游戏能加载专业模块。
8. 未支持复杂游戏能进入 API 开发模式。
9. API 开发中页面显示“正在调用 API 开发”。
10. API 开发失败能 fallback。
11. 不使用 `eval`。
12. 不使用 `new Function`。
13. 后端不返回完整错误堆栈。
14. README 完整。

---

## 20. 实现提醒

优先级：

```text
先跑通 GameSpec MVP
再做专业模块
最后做 API 开发模式
```

不要一开始就把所有代码写在一个文件里。后端按 routes、services、validators、fallbacks、utils 拆分；前端按 main、engine、modules、generated 拆分。

如果实现过程中发现 PRD 与可落地实现冲突，优先保证：

1. 项目能运行。
2. API Key 安全。
3. GameSpec 可校验。
4. 前端不执行 AI 任意代码。
5. 用户始终有可用结果。
