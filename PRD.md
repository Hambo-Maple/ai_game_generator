# 一句话生成小游戏 PRD

## 1. 产品概述

### 1.1 产品名称

一句话生成小游戏

英文名：One-Sentence AI Mini Game Generator

### 1.2 产品定位

一句话生成小游戏是一款 AI 驱动的轻量级小游戏创作产品。

用户输入一句自然语言创意后，系统通过后端调用大模型生成结构化 `GameSpec`，再由前端通用 Canvas 游戏引擎读取配置并即时运行小游戏。产品目标是降低小游戏创作门槛，让用户无需编程也能快速生成、试玩和迭代小游戏原型。

### 1.3 产品一句话介绍

用户输入一句话，AI 自动生成游戏配置，前端引擎即时运行一个可玩的小游戏。

### 1.4 核心价值

1. 降低创作门槛：用户不需要写代码，只需要描述游戏创意。
2. 即时可玩：生成结果不是策划文本，而是可运行的小游戏。
3. 安全可控：AI 只生成配置，不生成也不执行代码。
4. 灵活扩展：通过 `GameSpec` 扩展角色、场景、玩法、物体和规则。
5. 稳定体验：AI 失败时使用 fallback，保证产品基础体验可用。

---

## 2. 背景与问题

### 2.1 用户痛点

很多用户有小游戏创意，但缺少编程能力、素材能力或游戏开发经验，无法快速把想法变成可玩的 Demo。

传统小游戏开发需要完成：

1. 玩法设计
2. 角色和物体定义
3. 规则设计
4. 前端渲染
5. 交互逻辑
6. 状态管理
7. 胜负判断

这对普通用户来说门槛较高。

### 2.2 产品机会

大模型可以理解自然语言创意，并将其转换成结构化数据。通过“AI 生成配置 + 通用游戏引擎运行”的方式，可以在保证安全性的前提下，让用户快速生成可玩的小游戏。

---

## 3. 产品目标

### 3.1 MVP 目标

1. 用户可以输入一句话生成小游戏。
2. 后端可以调用大模型生成 `GameSpec`。
3. 前端可以展示 `GameSpec`。
4. Canvas 游戏引擎可以根据 `GameSpec` 动态运行游戏。
5. 支持移动、跳跃、点击、射击四类基础玩法。
6. 支持不同场景、角色、物体、行为和胜负条件。
7. AI 失败时返回 fallback 游戏，保证产品可用。

### 3.2 非目标

MVP 阶段暂不支持：

1. 用户账号系统
2. 作品保存与发布
3. 多关卡编辑器
4. 多人联机
5. 复杂物理引擎
6. 商业化支付
7. AI 直接生成并执行游戏代码
8. 图片素材生成

---

## 4. 目标用户

### 4.1 普通创意用户

有小游戏想法，但不会编程，希望快速把想法变成可试玩 Demo。

### 4.2 小游戏创作者

需要快速验证轻量玩法原型，降低早期试错成本。

### 4.3 教育与培训用户

用于理解游戏规则、交互逻辑、AI 结构化输出和配置驱动架构。

### 4.4 内容运营用户

需要快速生成活动小游戏、互动内容或营销玩法原型。

---

## 5. 核心用户流程

```text
用户输入一句游戏创意
→ 前端提交 prompt 给后端
→ 后端调用大模型 API
→ AI 返回 GameSpec JSON
→ 后端校验、补全、规范化 GameSpec
→ 前端接收并展示 GameSpec
→ 用户点击开始游戏
→ Canvas 通用游戏引擎读取 GameSpec
→ 动态运行小游戏
→ 用户试玩、暂停、重开或重新生成
```

---

## 6. 产品功能需求

### 6.1 首页

首页直接展示产品核心功能，不做单独营销落地页。

页面需要包含：

1. 产品标题
2. 产品副标题
3. 游戏创意输入框
4. AI 生成游戏按钮
5. 示例句子按钮
6. `GameSpec` 配置展示区
7. Canvas 游戏运行区
8. 游戏状态栏
9. 游戏控制按钮
10. 游戏结束提示层

### 6.2 创意输入

用户可以输入一句自然语言描述，例如：

```text
小猫在太空中躲避陨石收集星星
```

输入框 placeholder：

```text
例如：小猫在太空中躲避陨石收集星星
```

输入为空时，需要给出友好提示，不应向 AI 发起无效请求。

### 6.3 示例句子

页面需要内置示例句子，点击后自动填入输入框。

示例：

1. 小猫在太空中躲避陨石收集星星
2. 勇士点击怪物获得金币
3. 小狗在森林里跳过木桩向前奔跑
4. 机器人射击外星怪物保护基地
5. 在规定时间内快速点击出现的地鼠
6. 忍者在城市中躲避飞镖并收集宝石
7. 宇航员在宇宙中发射子弹消灭外星怪物
8. 小鸟在森林中躲避蜜蜂收集糖果

### 6.4 AI 生成游戏

用户点击“AI 生成游戏”后：

1. 前端读取输入内容。
2. 前端请求后端 `/api/generate-game-spec`。
3. 后端调用大模型。
4. 后端返回校验后的 `GameSpec`。
5. 前端展示配置。
6. 前端保存配置到当前游戏状态。

生成过程中页面状态显示为“生成中”。

### 6.5 GameSpec 展示

页面需要展示当前游戏配置的关键信息：

1. 游戏标题
2. 游戏说明
3. 玩家角色
4. 场景
5. 操作方式
6. 主要物体
7. 胜利条件
8. 失败条件
9. 难度

展示区应面向普通用户可读，而不是只展示原始 JSON。

### 6.6 Canvas 游戏区

Canvas 推荐尺寸：

```text
800 x 450
```

要求：

1. 居中显示
2. 有清晰边框
3. 根据 `scene.theme` 绘制不同背景
4. 使用 emoji 绘制玩家、敌人、障碍物和奖励物
5. 游戏运行时持续渲染玩家、物体、子弹和状态信息

### 6.7 状态栏

状态栏展示：

1. 分数
2. 生命值
3. 剩余时间
4. 当前状态

状态枚举：

```text
未开始 / 生成中 / 已生成 / 运行中 / 暂停 / 胜利 / 失败
```

### 6.8 控制按钮

页面需要包含：

1. 开始游戏
2. 暂停游戏
3. 重新开始

规则：

1. 未生成游戏时，开始游戏不可用或给出提示。
2. 运行中可以暂停。
3. 暂停后可以继续。
4. 重新开始需要清理旧游戏状态并基于当前 `GameSpec` 重开。

### 6.9 游戏结束提示

胜利或失败时显示提示层。

提示层包含：

1. 胜利或失败结果
2. 最终分数
3. 重新开始按钮

---

## 7. GameSpec 设计

### 7.1 设计原则

`GameSpec` 是 AI 和游戏引擎之间的协议。

AI 只负责生成结构化配置，前端只负责读取配置并运行游戏。这样可以避免执行 AI 代码带来的安全风险，同时保留 AI 创意生成能力。

### 7.2 标准结构

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

### 7.3 字段枚举

`scene.theme`：

```text
space | forest | city | ocean | desert | default
```

`player.control`：

```text
move | jump | click | shoot
```

`objects.type`：

```text
enemy | reward | obstacle | target
```

`objects.behavior`：

```text
falling | movingLeft | randomAppear | static | chase
```

`objects.effect`：

```text
score | damage | win | none
```

`rules.winCondition`：

```text
scoreTarget | surviveTime | collectAll | defeatAll
```

`rules.loseCondition`：

```text
healthZero | timeOut | collision
```

`difficulty.name`：

```text
easy | normal | hard
```

---

## 8. 游戏引擎需求

### 8.1 通用引擎原则

前端不能针对每个小游戏写死模板。

正确方式是：

```text
同一套 Canvas 游戏引擎
读取不同 GameSpec
动态运行不同小游戏
```

引擎主要根据以下字段决定玩法：

1. `player.control`
2. `objects.type`
3. `objects.behavior`
4. `objects.effect`
5. `rules.winCondition`
6. `rules.loseCondition`
7. `difficulty.spawnRate`
8. `difficulty.objectSpeed`

### 8.2 支持的 control

#### move

移动躲避类玩法：

1. 玩家使用左右方向键移动。
2. 物体从上方掉落。
3. 奖励物碰撞后加分。
4. 障碍物或敌人碰撞后扣生命。
5. 达到目标分数胜利。
6. 生命为 0 失败。

#### jump

跳跃跑酷类玩法：

1. 玩家位于地面。
2. 空格键跳跃。
3. 障碍物从右向左移动。
4. 碰到障碍物扣生命或失败。
5. 存活到时间结束或达到目标分数胜利。

#### click

点击反应类玩法：

1. 目标随机出现在游戏区域。
2. 玩家点击目标得分。
3. 敌人可拥有生命值。
4. 点击后目标刷新位置。
5. 达到目标分数或击败足够目标胜利。
6. 时间结束未达成目标失败。

#### shoot

射击类玩法：

1. 玩家左右移动。
2. 空格键发射子弹。
3. 敌人从上方出现或追踪玩家。
4. 子弹击中敌人后敌人消失并加分。
5. 敌人碰到玩家或到底部扣生命。
6. 达到目标分数或击败目标数量胜利。
7. 生命为 0 失败。

### 8.3 支持的 behavior

#### falling

物体从上方随机 x 位置生成，持续向下移动，超出底部后移除。

#### movingLeft

物体从右侧生成，持续向左移动，超出左侧后移除。

#### randomAppear

物体随机出现在游戏区域，等待玩家点击，点击后刷新位置。

#### static

物体固定位置显示，可作为终点、目标或装饰。

#### chase

物体缓慢向玩家方向移动，碰到玩家后造成伤害。

### 8.4 支持的 effect

#### score

碰撞或点击后增加分数。

#### damage

碰撞后扣除生命值。

#### win

触发胜利。

#### none

无效果，仅显示。

---

## 9. 技术需求

### 9.1 技术栈

前端：

1. 原生 HTML
2. CSS
3. JavaScript
4. Canvas

后端：

1. Node.js
2. Express
3. dotenv
4. cors

限制：

1. 不使用 React / Vue / Angular
2. 不使用 TypeScript
3. 不使用数据库
4. 不依赖外部 CDN
5. 不使用图片素材
6. 不引入复杂 SDK，优先使用 Node.js 原生 `fetch`

### 9.2 项目结构

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

### 9.3 package.json

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

### 9.4 环境变量

`.env.example`：

```env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
PORT=3000
```

要求：

1. API Key 只能保存在 `.env`。
2. 前端不能出现 API Key。
3. `server.js` 从 `process.env.AI_API_KEY` 读取 key。
4. 未配置 API Key 时后端返回明确错误，不崩溃。

---

## 10. 后端接口需求

### 10.1 静态服务

后端托管 `public/` 目录。

支持：

```text
GET /
GET /index.html
GET /style.css
GET /game.js
```

默认访问地址：

```text
http://localhost:3000
```

### 10.2 生成 GameSpec

接口：

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
  "gameSpec": {}
}
```

失败响应：

```json
{
  "success": false,
  "message": "AI 生成失败，已使用默认配置。",
  "fallbackSpec": {}
}
```

要求：

1. 后端不能把完整错误堆栈暴露给前端。
2. AI 失败时返回 fallback。
3. prompt 为空时返回友好提示。
4. AI 返回内容必须经过 JSON 解析、校验和规范化。

---

## 11. AI 调用需求

### 11.1 System Prompt 要求

后端需要准备 system prompt，要求模型：

1. 扮演小游戏配置生成器。
2. 根据用户一句话生成 `GameSpec` JSON。
3. 只能返回 JSON。
4. 不返回 Markdown。
5. 不返回解释。
6. 不返回代码块。
7. 不生成 JavaScript。
8. 不生成 HTML/CSS。
9. 不生成危险内容。
10. 用户描述不完整时自动补全合理默认值。

### 11.2 AI 返回容错

模型理想输出为纯 JSON。

如果模型返回代码块，后端需要尝试提取 JSON。

如果无法解析或结构不合法，使用 fallback。

---

## 12. 后端校验与 fallback

### 12.1 validateAndNormalizeGameSpec

必须实现：

```js
function validateAndNormalizeGameSpec(rawSpec) {
  // 校验、补全、规范化 AI 返回的 GameSpec
}
```

函数职责：

1. 检查 AI 返回是否为合法对象。
2. 检查必要字段是否存在。
3. 缺失字段补默认值。
4. 字段值不在允许范围内时替换为默认值。
5. 确保 `objects` 至少有一个可交互物体。
6. 确保 `player.health` 范围为 1 到 10。
7. 确保 `player.speed` 范围为 2 到 12。
8. 确保 `rules.timeLimit` 范围为 10 到 120。
9. 确保 `rules.scoreTarget` 范围为 10 到 500。
10. 确保 `difficulty.spawnRate` 范围为 300 到 3000。
11. 确保 `difficulty.objectSpeed` 范围为 1 到 10。
12. 返回稳定可用的 `GameSpec`。

### 12.2 createFallbackSpec

必须实现：

```js
function createFallbackSpec(prompt) {
  // 返回默认小游戏配置
}
```

fallback 触发场景：

1. 未配置 API Key
2. AI API 请求失败
3. AI 返回无法解析
4. AI 返回结构不合法
5. 字段缺失严重

fallback 默认游戏：

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

## 13. 前端实现需求

### 13.1 主要函数

`public/game.js` 需要实现：

```js
async function generateGameWithAI() {}
function runGame(gameSpec) {}
function resetGame() {}
function updateGame() {}
function renderGame() {}
function endGame(result) {}
function isColliding(a, b) {}
```

建议拆分：

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

### 13.2 gameState

统一维护状态：

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

每次生成新游戏、开始新游戏、重新开始时，都必须调用 `resetGame()`。

`resetGame()` 必须清理：

1. `requestAnimationFrame`
2. `setInterval`
3. `setTimeout`
4. runtime objects
5. bullets
6. keys
7. result
8. 旧状态

---

## 14. Canvas 渲染需求

使用 emoji 绘制角色和物体。

必须实现：

```js
drawBackground()
drawPlayer()
drawObjects()
drawBullets()
drawHUD()
```

不同 `scene.theme` 的背景表现：

1. `space`：深蓝或黑色背景，可绘制星星。
2. `forest`：绿色背景，可绘制地面。
3. `city`：灰蓝背景，可绘制简单楼房。
4. `ocean`：蓝色背景，可绘制水波。
5. `desert`：黄色背景，可绘制沙丘。
6. `default`：深色渐变背景。

---

## 15. 安全需求

必须满足：

1. API Key 只能放在 `.env` 文件。
2. 前端不能出现 API Key。
3. 后端不能直接相信 AI 返回结果。
4. AI 返回的 `GameSpec` 必须经过校验和规范化。
5. 缺失字段补默认值。
6. 非法字段替换为允许值。
7. 不允许使用 `eval`。
8. 不允许使用 `new Function`。
9. 不允许执行 AI 返回代码。
10. AI 只能返回 JSON 配置。
11. AI 失败时使用 fallback。
12. 后端不返回完整错误堆栈。
13. prompt 为空时返回友好提示。

---

## 16. UI 与体验需求

### 16.1 视觉风格

页面应具备产品感，而不是调试工具感。

要求：

1. 整体美观、清晰。
2. 使用现代卡片式布局。
3. 背景使用渐变。
4. 按钮有 hover 效果。
5. 输入框清晰易用。
6. `GameSpec` 展示区像配置卡片。
7. Canvas 居中。
8. 状态栏清晰。
9. 适配常见电脑屏幕。
10. 字体清晰，重点信息突出。

### 16.2 文案风格

文案应体现产品化表达：

1. 强调“一句话生成”。
2. 强调“AI 生成配置”。
3. 强调“即时试玩”。
4. 强调“AI 不生成代码，更安全稳定”。

---

## 17. 验收标准

### 17.1 基础运行

1. `npm install` 成功。
2. `npm start` 成功启动服务。
3. 浏览器访问 `http://localhost:3000` 可以看到页面。
4. 页面无明显控制台报错。

### 17.2 AI 生成

1. 输入一句话后，前端请求后端。
2. 后端调用 AI API。
3. 成功时返回 `gameSpec`。
4. 失败时返回 `fallbackSpec`。
5. 前端可以展示返回的配置。
6. 前端不出现 API Key。

### 17.3 游戏运行

1. 点击“开始游戏”后 Canvas 中小游戏可以运行。
2. 分数会更新。
3. 生命值会更新。
4. 剩余时间会更新。
5. 游戏状态会更新。
6. 暂停可用。
7. 重新开始可用。
8. 胜利或失败时有明确提示。

### 17.4 安全

1. 不使用 `eval`。
2. 不使用 `new Function`。
3. 不执行 AI 返回代码。
4. AI 返回内容必须经过校验和规范化。
5. 后端不暴露完整错误堆栈。

### 17.5 示例可玩

以下输入都需要生成可玩的游戏，并且玩法有明显区别：

1. 小猫在太空中躲避陨石收集星星
2. 勇士点击怪物获得金币
3. 小狗在森林里跳过木桩向前奔跑
4. 机器人射击外星怪物保护基地
5. 在规定时间内快速点击出现的地鼠
6. 忍者在城市中躲避飞镖并收集宝石
7. 宇航员在宇宙中发射子弹消灭外星怪物
8. 小鸟在森林中躲避蜜蜂收集糖果

---

## 18. README 需求

README 需要包含：

1. 项目介绍
2. 项目运行方式
3. 如何配置 `.env`
4. 如何启动后端
5. 如何访问页面
6. 项目核心流程
7. `GameSpec` 设计说明
8. 为什么 AI 只生成配置、不生成代码
9. 安全设计说明
10. 示例输入

运行方式示例：

```bash
npm install
cp .env.example .env
npm start
```

访问：

```text
http://localhost:3000
```

---

## 19. 产品后续规划

### 19.1 版本 1.1

1. 支持保存生成结果。
2. 支持再次编辑 `GameSpec`。
3. 支持重新生成同一创意的多个版本。
4. 增加更多场景主题。
5. 增加更多物体行为。

### 19.2 版本 1.2

1. 增加作品分享链接。
2. 增加游戏封面生成。
3. 增加用户作品库。
4. 增加基础模板市场。

### 19.3 版本 2.0

1. 支持账号系统。
2. 支持云端保存。
3. 支持关卡编辑器。
4. 支持多人协作。
5. 支持发布到小游戏平台。

---

## 20. 产品对外介绍

一句话生成小游戏是一款 AI 驱动的小游戏创作产品。用户输入一句自然语言创意，系统自动生成结构化 `GameSpec`，并通过通用 Canvas 游戏引擎即时运行，让用户无需编程也能快速创建和试玩小游戏原型。

本产品采用“AI 生成配置 + 通用游戏引擎运行”的架构。AI 不直接生成代码，前端也不执行 AI 返回代码，而是通过标准化配置动态组合角色、场景、操作方式、物体行为和胜负条件。这种设计兼顾了 AI 创作的灵活性、产品运行的稳定性和安全性。

---

## 21. 超出引擎能力时的 API 开发保底机制

### 21.1 设计目标

用户输入是开放的。用户可能要求生成五子棋、象棋、塔防、经营模拟、解谜、卡牌、回合制战斗等当前通用 Canvas 引擎没有准备好的游戏类型。

产品不能简单把所有需求都降级成 `move`、`jump`、`click`、`shoot` 四类小游戏。对于和现有游戏板块差距过大的需求，系统应进入“AI 开发模式”，调用后端 API 生成新的游戏模块或新的可执行游戏文件，并在页面上明确显示“正在调用 API 开发”。

核心原则：

```text
能用现有引擎完成的，走 GameSpec 生成
差距较小的，允许映射到现有玩法
差距过大的，进入 API 开发模式
API 开发过程中，前端明确显示开发状态
开发失败时，再使用默认 fallback 保证页面可用
```

### 21.2 需求分类

后端需要先对用户输入进行能力分类。

分类结果包括：

1. `supported`：现有 GameSpec 引擎可直接支持。
2. `mappable`：与现有玩法接近，可映射到现有板块。
3. `developmentRequired`：与现有板块差距过大，需要调用 API 开发。
4. `invalid`：输入为空、恶意输入或无法理解。

分类可以由大模型完成，也可以由后端规则和大模型共同完成。

### 21.3 supported：直接生成 GameSpec

当用户需求属于移动躲避、跳跃跑酷、点击目标、射击消灭等已支持玩法时，系统直接走原有流程：

```text
用户输入
→ 后端调用 AI
→ AI 生成 GameSpec
→ 后端校验和规范化
→ 前端通用引擎运行
```

示例：

```text
小猫在太空中躲避陨石收集星星
```

结果：

```text
classification = supported
generationMode = gameSpec
```

### 21.4 mappable：轻度映射

当用户需求和现有板块比较接近，但不是完全匹配时，可以映射到现有玩法。

示例：

```text
做一个钓鱼小游戏
```

可映射为：

```text
点击随机出现的鱼获得分数
```

结果：

```text
classification = mappable
generationMode = gameSpec
```

要求：

1. 轻度映射必须保证用户仍能感知到原始主题。
2. 不能把差距过大的复杂游戏强行映射成简单点击游戏。
3. 前端可以显示轻提示：`已根据当前引擎能力生成可玩版本。`

### 21.5 developmentRequired：API 开发模式

当用户需求与现有游戏板块差距过大时，系统进入 API 开发模式。

典型场景：

1. 五子棋
2. 象棋
3. 围棋
4. 扑克或卡牌战斗
5. 塔防
6. 经营模拟
7. 复杂解谜
8. 回合制 RPG
9. 平台闯关编辑器
10. 多关卡剧情游戏

这类需求不应强行压缩为现有 `click` 或 `shoot` 玩法，而应调用 API 进行开发。

### 21.6 API 开发模式的产品流程

流程：

```text
用户输入复杂游戏需求
→ 后端识别为 developmentRequired
→ 前端状态切换为“调用 API 开发中”
→ 后端调用开发 API
→ API 返回新游戏模块、页面代码或模块化实现结果
→ 后端进行安全检查和文件落地
→ 前端加载新生成的游戏
→ 用户试玩
```

页面必须明确显示状态：

```text
正在调用 API 开发
```

建议状态文案：

```text
正在调用 API 开发新的游戏模块，请稍候...
```

开发完成后：

```text
游戏开发完成，正在加载...
```

开发失败后：

```text
API 开发失败，已为你加载默认小游戏。
```

### 21.7 前端状态要求

游戏状态栏需要新增状态：

```text
API开发中
```

完整状态枚举更新为：

```text
未开始 / 生成中 / API开发中 / 已生成 / 运行中 / 暂停 / 胜利 / 失败
```

当后端返回 `generationMode = "apiDevelopment"` 或前端收到开发任务开始事件时，页面状态必须显示：

```text
API开发中
```

同时在 Canvas 或游戏区域展示：

```text
正在调用 API 开发
```

### 21.8 后端响应字段

`POST /api/generate-game-spec` 的响应建议扩展为：

```json
{
  "success": true,
  "classification": "supported",
  "generationMode": "gameSpec",
  "gameSpec": {},
  "message": ""
}
```

当需要 API 开发时：

```json
{
  "success": true,
  "classification": "developmentRequired",
  "generationMode": "apiDevelopment",
  "message": "该需求超出现有游戏引擎能力，正在调用 API 开发新的游戏模块。",
  "developmentTaskId": "dev_123456"
}
```

当 API 开发完成后，可以通过轮询接口获取结果。

### 21.9 新增 API 开发接口

建议新增接口：

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

查询开发结果：

```http
GET /api/develop-game/:taskId
```

开发中响应：

```json
{
  "success": true,
  "status": "developing",
  "message": "正在调用 API 开发"
}
```

开发完成响应：

```json
{
  "success": true,
  "status": "completed",
  "gameType": "custom",
  "entry": "/generated/dev_123456/index.html",
  "message": "游戏开发完成"
}
```

开发失败响应：

```json
{
  "success": false,
  "status": "failed",
  "message": "API 开发失败，已使用默认配置。",
  "fallbackSpec": {}
}
```

### 21.10 API 开发产物要求

API 开发模式可以生成新的游戏模块，但必须满足安全约束。

要求：

1. 生成产物必须保存在服务端指定目录，例如 `public/generated/{taskId}/`。
2. 不能在前端暴露 API Key。
3. 后端需要限制生成文件类型。
4. 后端需要拒绝危险代码和危险路径。
5. 生成内容不得写入项目根目录以外的位置。
6. 生成内容不得读取 `.env`。
7. 生成内容不得访问服务器敏感文件。
8. 前端只能通过受控路径加载生成结果。

建议允许的文件：

```text
index.html
style.css
game.js
```

建议禁止：

```text
eval
new Function
外部脚本 CDN
读取本地敏感文件
跨目录写入
后端命令执行
```

### 21.11 五子棋示例

用户输入：

```text
设计一个五子棋游戏
```

系统判断：

```text
五子棋需要棋盘网格、双方轮流落子、黑白棋子、禁止重复落子、五连胜负检测。
这些能力超出现有 GameSpec 小游戏引擎。
```

处理结果：

```text
classification = developmentRequired
generationMode = apiDevelopment
```

前端显示：

```text
正在调用 API 开发
```

API 开发目标：

```text
生成一个独立的五子棋游戏模块，包含棋盘绘制、点击落子、双方轮流、五连检测、重新开始。
```

开发完成后，前端加载生成的五子棋页面或模块。

### 21.12 失败兜底

API 开发模式失败时，系统才进入默认 fallback。

失败场景：

1. 开发 API 调用失败。
2. 开发结果为空。
3. 生成文件安全检查不通过。
4. 生成文件无法加载。
5. 开发超时。

失败处理：

```text
显示：API 开发失败，已为你加载默认小游戏。
加载：createFallbackSpec(prompt)
```

注意：

```text
默认 fallback 是最后兜底，不是复杂游戏需求的优先处理方式。
```

### 21.13 验收标准补充

需要额外验证以下输入：

1. 设计一个五子棋游戏
2. 做一个象棋游戏
3. 做一个塔防游戏
4. 做一个经营奶茶店游戏
5. 做一个密室逃脱游戏

预期结果：

1. 系统不能强行把五子棋降级成普通点击游戏。
2. 后端应返回 `classification = developmentRequired`。
3. 前端应显示 `API开发中`。
4. 游戏区域应显示 `正在调用 API 开发`。
5. API 开发成功后加载新游戏模块。
6. API 开发失败后加载默认 fallback。
7. 全流程不暴露 API Key。
8. 生成产物必须经过安全检查。

---

## 22. 游戏能力分层与扩展机制

### 22.1 设计目标

产品需要支持持续扩展游戏种类。扩展方式不能只有一种，否则轻量玩法会被拆得过碎，复杂游戏又会被硬塞进通用引擎。

因此产品采用三层游戏能力架构：

```text
第一层：通用 GameSpec 引擎
第二层：专业游戏模块
第三层：API 开发模式
```

三层的作用：

1. 通用 GameSpec 引擎：处理轻量、通用、可参数化的小游戏。
2. 专业游戏模块：处理规则完整、结构独立的复杂游戏。
3. API 开发模式：处理当前既没有通用能力支持，也没有专业模块覆盖的新需求。

### 22.2 通用 GameSpec 引擎

通用引擎不是 `GameSpec` 本身。

二者关系：

```text
GameSpec = 游戏配置数据
通用引擎 = 读取 GameSpec 并运行游戏的代码
```

通用引擎位置：

```text
public/game.js
```

通用引擎负责：

1. Canvas 初始化
2. DOM 事件绑定
3. 游戏状态管理
4. 玩家创建与控制
5. 物体生成与更新
6. 子弹逻辑
7. 碰撞检测
8. 分数和生命值更新
9. 胜负判断
10. Canvas 渲染
11. 暂停、重开和结束逻辑

当前通用引擎支持的基础 control：

```text
move | jump | click | shoot
```

当前通用引擎支持的 behavior：

```text
falling | movingLeft | randomAppear | static | chase
```

当前通用引擎支持的 effect：

```text
score | damage | win | none
```

### 22.3 通用引擎适合扩展什么

通用引擎适合扩展轻量、可复用、可被 `GameSpec` 参数化描述的基础玩法能力。

适合加入通用引擎的能力：

1. `drag`：拖拽
2. `swipe`：滑动
3. `hold`：长按
4. `aim`：瞄准
5. `match`：匹配
6. `catch`：接物
7. `pathMove`：简单路径移动

示例：

```text
拖拽垃圾到正确垃圾桶
拖拽食材完成订单
滑动角色躲避障碍
长按蓄力发射
点击或拖拽完成配对
```

这些玩法可以复用同一套底层逻辑，因此适合沉淀到 `public/game.js`。

### 22.4 扩展通用引擎的操作步骤

如果要新增一个轻量玩法，例如 `drag`，需要修改：

1. `PRD.md`：补充新的玩法定义和验收标准。
2. `server.js`：后端校验允许新的枚举值。
3. AI system prompt：告诉 AI 什么时候可以生成新 control 或 behavior。
4. `public/game.js`：实现新的输入、更新、碰撞和渲染逻辑。
5. `public/index.html`：如有需要，补充操作提示或状态展示。
6. `README.md`：补充新增能力说明。
7. 测试用例：增加对应示例输入。

示例：

```text
新增 player.control = drag
```

需要同步修改：

```js
const ALLOWED_CONTROLS = ["move", "jump", "click", "shoot", "drag"];
```

前端通用引擎需要新增：

```js
if (gameSpec.player.control === "drag") {
  // 监听鼠标按下、移动、松开
  // 拖动物体
  // 判断是否放到目标区域
  // 根据结果加分、扣分或触发胜利
}
```

### 22.5 专业游戏模块

专业模块用于承载复杂、规则独立、不能很好用通用 `GameSpec` 描述的游戏类型。

建议目录：

```text
public/modules/
```

示例：

```text
public/modules/gomoku/
├── index.html
├── style.css
└── game.js

public/modules/tower-defense/
├── index.html
├── style.css
└── game.js

public/modules/card-battle/
├── index.html
├── style.css
└── game.js
```

适合做成专业模块的游戏：

1. 五子棋
2. 象棋
3. 围棋
4. 扫雷
5. 俄罗斯方块
6. 塔防
7. 卡牌战斗
8. 回合制 RPG
9. 复杂经营模拟
10. 复杂解谜游戏

这些游戏有独立规则，不应强行塞进 `move`、`jump`、`click`、`shoot`。

### 22.6 专业模块注册表

产品需要维护一个模块注册表，用于识别用户输入并加载已有模块。

示例：

```js
const gameModules = {
  gomoku: {
    name: "五子棋",
    entry: "/modules/gomoku/index.html",
    keywords: ["五子棋", "连珠", "黑白棋子"]
  },
  towerDefense: {
    name: "塔防",
    entry: "/modules/tower-defense/index.html",
    keywords: ["塔防", "防守", "基地", "水晶"]
  },
  cardBattle: {
    name: "卡牌战斗",
    entry: "/modules/card-battle/index.html",
    keywords: ["卡牌", "牌组", "回合制"]
  }
};
```

当用户输入命中已有专业模块时，系统优先加载模块，而不是重新调用 API 开发。

示例：

```text
用户输入：设计一个五子棋游戏
如果 gomoku 模块存在：直接加载 /modules/gomoku/index.html
如果 gomoku 模块不存在：进入 API 开发模式
```

### 22.7 扩展专业模块的操作步骤

如果要新增一个复杂游戏类型，例如五子棋，需要：

1. 新增目录：`public/modules/gomoku/`
2. 实现模块页面：`index.html`
3. 实现模块样式：`style.css`
4. 实现模块逻辑：`game.js`
5. 在模块注册表登记 `gomoku`
6. 后端识别五子棋类输入
7. 前端支持加载 `moduleEntry`
8. README 和 PRD 补充模块说明
9. 添加验收测试

五子棋模块至少需要支持：

1. 棋盘绘制
2. 点击落子
3. 黑白双方轮流
4. 禁止重复落子
5. 横竖斜五连检测
6. 胜负提示
7. 重新开始

### 22.8 API 开发生成模块的沉淀机制

API 开发模式生成的新游戏默认放在：

```text
public/generated/{taskId}/
```

示例：

```text
public/generated/dev_123456/
├── index.html
├── style.css
└── game.js
```

如果某个生成结果稳定、常用、体验较好，可以人工或自动审核后沉淀为专业模块：

```text
public/generated/dev_123456/
→ public/modules/gomoku/
```

沉淀为专业模块后，需要加入模块注册表。后续用户再输入同类需求时，直接加载专业模块，不再重复调用 API 开发。

### 22.9 用户输入路由逻辑

系统需要根据用户输入选择合适路径。

推荐顺序：

```text
1. 基础校验
2. 检查是否命中已有专业模块
3. 判断是否可由通用 GameSpec 引擎支持
4. 判断是否可轻度映射到通用引擎
5. 判断是否需要 API 开发
6. 失败时使用默认 fallback
```

伪代码：

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

### 22.10 后端响应模式

不同路径返回不同响应。

通用引擎：

```json
{
  "success": true,
  "classification": "supported",
  "generationMode": "gameSpec",
  "gameSpec": {}
}
```

专业模块：

```json
{
  "success": true,
  "classification": "builtInModule",
  "generationMode": "module",
  "moduleEntry": "/modules/gomoku/index.html",
  "message": "已加载五子棋模块。"
}
```

API 开发：

```json
{
  "success": true,
  "classification": "developmentRequired",
  "generationMode": "apiDevelopment",
  "developmentTaskId": "dev_123456",
  "message": "正在调用 API 开发"
}
```

默认 fallback：

```json
{
  "success": false,
  "classification": "fallback",
  "generationMode": "fallback",
  "message": "生成失败，已加载默认小游戏。",
  "fallbackSpec": {}
}
```

### 22.11 扩展策略总结

新增游戏种类时，按以下规则选择扩展方式：

| 需求类型 | 推荐方式 | 示例 |
|---|---|---|
| 轻量、可参数化玩法 | 扩展通用引擎 | 拖拽、滑动、长按、匹配 |
| 复杂、规则独立游戏 | 新增专业模块 | 五子棋、塔防、卡牌、扫雷 |
| 临时未知复杂需求 | API 开发模式 | 用户提出未覆盖的新游戏 |
| API 生成后稳定常用 | 沉淀为专业模块 | generated 转 modules |

一句话原则：

```text
轻玩法进通用引擎
复杂玩法进专业模块
未知复杂玩法走 API 开发
稳定 API 产物沉淀为专业模块
```
