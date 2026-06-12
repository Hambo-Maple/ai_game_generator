# 一句话生成小游戏 Demo 开发提示词

这份文档用于让其他人跟着提示词，从零开发一个可运行的 demo。每一段都可以直接复制给 Codex 或其他 AI 编程助手执行。

目标 demo：用户输入一句话，后端生成 `GameSpec`，前端用 Canvas 引擎运行小游戏。AI 只生成配置，不生成也不执行代码。

---

## 使用方式

建议按阶段逐条发送提示词。不要一次性把所有阶段塞给 AI，否则容易生成一大坨难维护代码。

推荐流程：

```text
阶段 1：项目骨架
阶段 2：后端 API 和 fallback
阶段 3：GameSpec 校验
阶段 4：前端页面
阶段 5：Canvas 通用引擎
阶段 6：AI 生成接入
阶段 7：专业模块和复杂需求路由
阶段 8：安全检查和 README
```

---

## 总提示词

先把这段作为项目总目标发给 AI：

```text
我要开发一个“一句话生成小游戏”的 demo。

用户输入一句自然语言游戏创意，例如“小猫在太空中躲避陨石收集星星”。后端调用大模型生成结构化 GameSpec JSON，前端不执行 AI 返回代码，只用通用 Canvas 游戏引擎读取 GameSpec 并运行小游戏。

核心原则：
1. AI 只生成 JSON 配置，不生成 JavaScript/HTML/CSS 代码。
2. 前端不能出现 API Key。
3. 后端必须校验和规范化 AI 返回的 GameSpec。
4. AI 调用失败或未配置 API Key 时，使用 fallback GameSpec。
5. 不使用 eval，不使用 new Function。
6. 支持 move、jump、click、shoot 四类基础玩法。
7. 支持 falling、movingLeft、randomAppear、static、chase 五类物体行为。
8. 必须根据用户输入动态调整血量、限时、获胜条件、目标分数，以及每个得分物体的 points。

技术栈：
后端 Node.js + Express + dotenv + cors。
前端可以先用原生 HTML/CSS/JS + Canvas 做 MVP。
不要使用数据库。
项目需要可以 npm install、npm start 后访问 http://localhost:3000。
```

---

## 阶段 1：项目骨架

```text
请先创建一个最小可运行项目骨架。

目录结构：
ai-game-generator/
├── backend/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── main.js
├── package.json
├── .env.example
├── .gitignore
└── README.md

要求：
1. package.json 包含 start 和 dev 脚本，入口是 backend/server.js。
2. 依赖 express、dotenv、cors。
3. backend/server.js 托管 frontend 静态目录。
4. 访问 http://localhost:3000 能看到首页。
5. .env.example 包含 AI_API_KEY、AI_BASE_URL、AI_MODEL、PORT。
6. .gitignore 忽略 node_modules、.env、npm-debug.log。
```

---

## 阶段 2：后端 API 和 fallback

```text
请实现后端生成接口和 fallback。

新增接口：
POST /api/generate-game-spec

请求体：
{
  "prompt": "小猫在太空中躲避陨石收集星星"
}

当前阶段先不接真实 AI。请先返回 fallbackSpec，保证前后端链路可跑通。

请创建：
backend/fallbacks/fallbackSpec.js
backend/routes/generateGameSpec.js

fallback GameSpec 必须包含：
title、description、scene、player、objects、rules、difficulty。

默认玩法：
玩家左右移动，躲避危险物，收集星星，达到目标分数胜利，生命为 0 失败。
```

---

## 阶段 3：GameSpec 协议和校验

```text
请定义并实现 GameSpec 校验与规范化。

新增文件：
backend/validators/gameSpecValidator.js

实现函数：
validateAndNormalizeGameSpec(rawSpec)

GameSpec 标准结构：
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

枚举限制：
scene.theme = space | forest | city | ocean | desert | default
player.control = move | jump | click | shoot
objects.type = enemy | reward | obstacle | target
objects.behavior = falling | movingLeft | randomAppear | static | chase
objects.effect = score | damage | win | none
rules.winCondition = scoreTarget | surviveTime | collectAll | defeatAll
rules.loseCondition = healthZero | timeOut | collision
difficulty.name = easy | normal | hard

数值限制：
player.health 1 到 10
player.speed 2 到 12
rules.timeLimit 10 到 120
rules.scoreTarget 10 到 500
difficulty.spawnRate 300 到 3000
difficulty.objectSpeed 1 到 10

任何缺失或非法字段都要补成稳定可玩的默认值。
```

---

## 阶段 4：前端页面

```text
请实现前端页面。

frontend/index.html 需要包含：
1. 标题：一句话生成小游戏
2. 副标题：输入一句话，让 AI 自动生成属于你的小游戏
3. 文本输入框
4. “AI 生成游戏”按钮
5. 示例句子按钮
6. GameSpec 展示区
7. Canvas 游戏区，尺寸 800 x 450
8. 状态栏
9. 开始、暂停、重新开始按钮
10. 游戏结束提示层

frontend/main.js 需要先实现：
1. 读取输入框。
2. 请求 POST /api/generate-game-spec。
3. 展示返回的 gameSpec 或 fallbackSpec。
4. 保存当前 gameSpec。
5. 按钮状态能随生成、运行、暂停变化。

frontend/style.css 要做成适合课程展示的现代卡片布局。
```

---

## 阶段 5：Canvas 通用游戏引擎

```text
请把前端游戏逻辑拆成通用 Canvas 引擎。

可以先放在 frontend/main.js，或者拆成：
frontend/engine/state.js
frontend/engine/gameSpecEngine.js
frontend/engine/renderer.js
frontend/engine/controls.js
frontend/engine/objects.js
frontend/engine/rules.js
frontend/engine/collision.js

必须实现：
runGame(gameSpec)
resetGame()
renderGame()
endGame(result)
isColliding(a, b)

gameState 至少包含：
running、paused、score、health、timeLeft、objects、bullets、keys、animationId、spawnTimer、countdownTimer、currentSpec、result、defeatedCount。

必须支持四种 control：
1. move：左右移动，掉落物碰撞加分或扣血。
2. jump：空格跳跃，障碍物从右向左移动。
3. click：目标随机出现，点击得分。
4. shoot：左右移动，空格射击敌人。

必须支持五种 behavior：
falling、movingLeft、randomAppear、static、chase。

必须支持四种 effect：
score、damage、win、none。

resetGame 必须清理 requestAnimationFrame、setInterval、setTimeout 和旧状态，避免多个循环同时运行。
```

---

## 阶段 6：接入真实 AI 生成

```text
请接入真实 AI 生成 GameSpec。

新增文件：
backend/services/aiClient.js
backend/services/gameSpecGenerator.js
backend/utils/json.js

aiClient.js：
1. 从 process.env.AI_API_KEY 读取 API Key。
2. 从 AI_BASE_URL、AI_MODEL 读取模型配置。
3. 使用 fetch 调用兼容 OpenAI Chat Completions 的接口。
4. 未配置 API Key 时抛出可控错误，不让服务崩溃。

gameSpecGenerator.js：
1. 准备 system prompt。
2. 要求模型只能返回纯 JSON。
3. 明确禁止返回 Markdown、解释、代码块、JavaScript、HTML/CSS。
4. 调用 AI 后解析 JSON。
5. 解析失败时返回 fallback。
6. AI 返回必须经过 validateAndNormalizeGameSpec。

system prompt 核心内容：
你是小游戏配置生成器。用户输入一句自然语言描述。你的任务是生成 GameSpec JSON。只能返回 JSON，不要返回 Markdown、解释、代码块或任何代码。不要生成 JavaScript，不要生成 HTML/CSS。字段必须符合指定枚举和结构。用户描述不完整时请自动补全合理默认值。
```

---

## 阶段 7：专业模块和复杂需求路由

```text
请增加复杂游戏路由能力。

新增文件：
backend/services/promptRouter.js
backend/services/moduleRegistry.js
backend/routes/modules.js

路由顺序：
1. prompt 为空或过短：invalid
2. 命中已有专业模块：builtInModule
3. 能由 GameSpec 引擎支持：supported
4. 可轻度映射到 GameSpec：mappable
5. 复杂且未支持：developmentRequired
6. 兜底：fallback

先实现一个专业模块：五子棋。

目录：
frontend/modules/gomoku/
├── index.html
├── style.css
└── game.js

五子棋模块要求：
1. Canvas 棋盘。
2. 点击落子。
3. 黑白轮流。
4. 禁止重复落子。
5. 横竖斜五连检测。
6. 胜负提示。
7. 重新开始。

当用户输入包含“五子棋”“连珠”等关键词时，后端返回：
{
  "success": true,
  "classification": "builtInModule",
  "generationMode": "module",
  "moduleEntry": "/modules/gomoku/index.html"
}

前端收到 module 后，用 iframe 加载 moduleEntry。
```

---

## 阶段 8：API 开发模式

```text
请实现复杂未知需求的 API 开发模式骨架。

新增接口：
POST /api/develop-game
GET /api/develop-game/:taskId

当用户输入“塔防”“象棋”“经营”“密室逃脱”等当前没有专业模块的复杂游戏时：
1. /api/generate-game-spec 返回 generationMode = "apiDevelopment"。
2. 前端状态显示“API开发中”。
3. 游戏区域显示“正在调用 API 开发”。
4. 前端轮询 /api/develop-game/:taskId。
5. 成功后加载 /generated/{taskId}/index.html。
6. 失败后加载 fallbackSpec。

生成产物只能写入：
frontend/generated/{taskId}/

允许文件：
index.html
style.css
game.js

禁止：
eval
new Function
外部 CDN
跨目录写入
读取 .env
读取服务器敏感文件
后端命令执行
```

---

## 阶段 9：安全检查

```text
请对项目做安全检查和修复。

检查项：
1. 前端没有 API Key。
2. .env 被 .gitignore 忽略。
3. 不存在 eval。
4. 不存在 new Function。
5. AI 返回内容不会被当作代码执行。
6. GameSpec 必须经过 validateAndNormalizeGameSpec。
7. 后端错误响应不暴露完整堆栈。
8. frontend/generated 只能通过安全路径写入。
9. prompt 为空时返回友好提示。
10. fallback 能保证页面可用。

请修复发现的问题，并说明修复点。
```

---

## 阶段 10：验收测试

```text
请帮我跑通并检查这个 demo。

必须验证：
1. npm install 成功。
2. npm start 成功。
3. http://localhost:3000 可以打开。
4. 输入一句话后会请求 /api/generate-game-spec。
5. 未配置 API Key 时使用 fallback，不崩溃。
6. 配置 API Key 后能生成 GameSpec。
7. 点击开始后 Canvas 游戏能运行。
8. 暂停、继续、重新开始可用。
9. 胜利或失败时有提示层。
10. 输入“五子棋”能加载专业模块。
11. 输入“塔防游戏”能进入 API开发中状态。

必测输入：
小猫在太空中躲避陨石收集星星
勇士点击怪物获得金币
小狗在森林里跳过木桩向前奔跑
机器人射击外星怪物保护基地
在规定时间内快速点击出现的地鼠
忍者在城市中躲避飞镖并收集宝石
宇航员在宇宙中发射子弹消灭外星怪物
小鸟在森林中躲避蜜蜂收集糖果
设计一个五子棋游戏
做一个塔防游戏
```

---

## 可选：React 前端迁移提示词

如果想把原生前端迁移到 React/Vite，可以用这段：

```text
请把现有 frontend 原生页面迁移到 frontend_example 的 React/Vite 前端。

要求：
1. 复用 frontend_example 里的 UI 组件。
2. 保留后端 API：/api/generate-game-spec、/api/develop-game、/api/modules。
3. 保留原 Canvas 游戏引擎能力，可以把 engine 复制到 frontend_example/src/engine。
4. React App 负责输入、生成、状态、GameSpec 展示、iframe 模块加载和控制按钮。
5. Vite dev server 代理 /api、/modules、/generated 到 http://localhost:3000。
6. Express 生产环境优先服务 frontend_example/dist。
7. /modules 和 /generated 仍然从旧 frontend 目录静态服务，保证 iframe 模块可用。
8. 非全屏时 canvas 容器必须保持 16:9，避免画面变形。
9. npm run build 必须通过。
```

---

## 一句话复述

给别人介绍这个 demo 时，可以这样说：

```text
这个项目不是让 AI 直接写并执行游戏代码，而是让 AI 把一句话创意转换成安全可校验的 GameSpec JSON。前端通用 Canvas 引擎读取 GameSpec 后动态运行小游戏。这样既能体现 AI 生成能力，又能避免执行不可信代码。
```
