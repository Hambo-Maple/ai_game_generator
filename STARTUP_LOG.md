# 本地启动日志

项目名称：一句话生成小游戏  
启动日期：2026-06-12  
启动目录：`D:\ai_game_generator`

## 1. 环境检查

后端技术栈：

```text
Node.js + Express
```

前端技术栈：

```text
原生 HTML + CSS + JavaScript + Canvas
```

依赖隔离方式：

```text
项目本地 node_modules/
```

说明：

```text
依赖通过 npm install 安装在当前项目目录，不使用全局安装。
```

## 2. 环境变量

本地已创建 `.env` 文件。

关键配置：

```env
AI_BASE_URL=https://yunwu.ai/v1
AI_MODEL=gpt-4.1-mini
PORT=3000
```

注意：

```text
AI_API_KEY 只保存在后端 .env 中，前端不会暴露。
```

## 3. 安装依赖

执行命令：

```bash
npm install
```

结果：

```text
依赖安装成功。
依赖安装位置为当前项目的 node_modules/。
未发现 npm 安全漏洞。
```

## 4. 启动服务

执行命令：

```bash
npm start
```

等价于：

```bash
node backend/server.js
```

启动成功后终端应显示：

```text
AI game generator running at http://localhost:3000
```

访问地址：

```text
http://localhost:3000
```

## 5. 已验证接口

首页访问：

```text
GET http://localhost:3000
```

结果：

```text
HTTP 200
```

普通小游戏生成：

```text
小猫在太空中躲避陨石收集星星
```

预期结果：

```text
classification = supported
generationMode = gameSpec
```

五子棋专业模块：

```text
设计一个五子棋游戏
```

预期结果：

```text
classification = builtInModule
generationMode = module
moduleEntry = /modules/gomoku/index.html
```

复杂游戏开发模式：

```text
俄罗斯方块
做一个塔防游戏
```

预期结果：

```text
classification = developmentRequired
generationMode = apiDevelopment
message = 正在调用 API 开发
```

开发完成后：

```text
status = completed
entry = /generated/{taskId}/index.html
```

开发过程中会返回进度：

```text
progress = 5 到 100
stage = 准备开发任务 / 正在调用 AI 开发 / 正在解析开发结果 / 正在进行安全检查 / 正在写入游戏文件 / 开发完成
```

## 8. 游戏操作与画面控制

通用 Canvas 游戏：

```text
move：点击画布聚焦后，← / → 移动。
jump：点击画布聚焦后，Space 或 ↑ 跳跃。
click：直接点击画布目标。
shoot：点击画布聚焦后，← / → 移动，Space 射击。
```

AI 开发生成游戏：

```text
生成游戏必须显示简短介绍和状态。
生成游戏内部不显示开始、暂停、继续、重新开始按钮。
统一使用外层左下角的开始、暂停、重新开始按钮。
操作提示由后端返回 controlsText，并显示在游戏区域下方。
外层按钮通过 GAME_START / GAME_PAUSE / GAME_RESUME / GAME_RESET 消息控制 iframe 游戏。
```

画面控制：

```text
全屏：点击游戏区下方“全屏”按钮。
非全屏缩放：按住 Ctrl + 鼠标滚轮缩放游戏画面。
键盘滚动：游戏运行且鼠标/焦点在游戏区时，方向键和空格不会滚动页面。
```

## 6. 当前实现状态

已实现：

```text
1. Express 后端服务
2. 前端页面
3. GameSpec 生成接口
4. GameSpec 校验和规范化
5. Canvas 通用游戏引擎
6. move / jump / click / shoot 四类玩法
7. 五子棋专业模块
8. API 开发模式状态流
9. fallback 默认小游戏
10. API Key 后端读取
```

当前限制：

```text
API 开发模式会调用 AI 生成 index.html、style.css、game.js。
生成文件会写入 frontend/generated/{taskId}/。
生成内容必须通过安全扫描，否则失败后 fallback。
复杂游戏生成可能需要几十秒。
```

## 7. 常见问题

如果页面打不开：

```bash
npm start
```

确认是否显示：

```text
AI game generator running at http://localhost:3000
```

如果端口被占用：

```powershell
Get-Process node
Stop-Process -Id <进程ID> -Force
npm start
```

如果 AI 不生效：

```text
检查 .env 中 AI_BASE_URL 是否包含 /v1。
当前应为：https://yunwu.ai/v1
检查 AI_API_KEY 是否填写真实值。
修改 .env 后需要重启 npm start。
```

如果输入复杂游戏出现奇怪的普通小游戏：

```text
说明该游戏类型还没有加入复杂游戏路由。
应将关键词加入 backend/services/promptRouter.js 的 DEVELOPMENT_HINTS。
```
