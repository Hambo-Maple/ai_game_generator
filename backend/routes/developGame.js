const express = require("express");
const { createFallbackSpec } = require("../fallbacks/fallbackSpec");
const { createDevelopmentTask, getDevelopmentTask } = require("../services/gameDeveloper");

const router = express.Router();

router.post("/", (req, res) => {
  const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({
      success: false,
      status: "failed",
      message: "请输入一句游戏创意。",
      fallbackSpec: createFallbackSpec(prompt)
    });
  }

  const task = createDevelopmentTask(prompt);
  res.json({
    success: true,
    developmentTaskId: task.id,
    status: task.status,
    progress: task.progress,
    stage: task.stage,
    message: "正在调用 API 开发"
  });
});

router.get("/:taskId", (req, res) => {
  const task = getDevelopmentTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      status: "failed",
      message: "开发任务不存在，已使用默认配置。",
      fallbackSpec: createFallbackSpec("")
    });
  }

  if (task.status === "completed") {
    return res.json({
      success: true,
      status: "completed",
      gameType: "custom",
      entry: task.entry,
      controlsText: task.controlsText,
      progress: task.progress,
      stage: task.stage,
      message: "游戏开发完成"
    });
  }

  if (task.status === "failed") {
    return res.json({
      success: false,
      status: "failed",
      progress: task.progress,
      stage: task.stage,
      message: `API 开发失败，已使用默认配置。${task.failedReason ? `原因：${task.failedReason}` : ""}`,
      fallbackSpec: createFallbackSpec(task.prompt)
    });
  }

  return res.json({
    success: true,
    status: "developing",
    progress: task.progress,
    stage: task.stage,
    message: "正在调用 API 开发"
  });
});

module.exports = router;
