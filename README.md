# 一句话生成小游戏

一个 AI 驱动的小游戏生成器。用户输入一句自然语言描述后，后端生成并校验 `GameSpec`，前端通用 Canvas 引擎读取配置并运行小游戏。复杂且已有支持的游戏会加载专业模块，例如五子棋。

## 运行方式

本项目后端是 Node.js + Express，依赖隔离方式是项目本地 `node_modules/`，不要使用全局安装。`npm install` 会把依赖安装到当前项目目录，不会装进全局环境。

```bash
npm install
copy .env.example .env
npm install --prefix frontend_example
npm run build
npm start
```

可以用下面的命令确认依赖位置应指向本项目目录：

```bash
npm root
```

预期类似：

```text
D:\ai_game_generator\node_modules
```

访问：

```text
http://localhost:3000
```

## 环境变量

`.env` 示例：

```env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
PORT=3000
```

未配置 `AI_API_KEY` 时，后端不会崩溃，会使用本地规则生成可玩的 `GameSpec`。

## 核心流程

```text
用户输入一句话
→ 后端路由 prompt
→ 普通小游戏生成 GameSpec
→ 后端校验和规范化 GameSpec
→ 前端 Canvas 引擎运行
```

复杂路径：

```text
五子棋 → 加载 frontend/modules/gomoku/
塔防/俄罗斯方块/经营等未知复杂需求 → API 开发模式 → 生成 frontend/generated/{taskId}/
```

## 安全设计

- API Key 只从后端 `.env` 读取。
- 前端不包含 API Key。
- AI 只允许返回结构化 `GameSpec`。
- 后端校验枚举、数值范围和缺失字段。
- 前端不执行 AI 返回的任意代码。
- 项目不使用 `eval` 或 `new Function`。

## GameSpec 能力

支持的基础操作：

```text
move | jump | click | shoot
```

支持的物体行为：

```text
falling | movingLeft | randomAppear | static | chase
```

支持的物体效果：

```text
score | damage | win | none
```

## 示例输入

- 小猫在太空中躲避陨石收集星星
- 勇士点击怪物获得金币
- 小狗在森林里跳过木桩向前奔跑
- 机器人射击外星怪物保护基地
- 设计一个五子棋游戏
- 俄罗斯方块
- 做一个塔防游戏
