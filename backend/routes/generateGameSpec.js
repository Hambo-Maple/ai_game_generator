const express = require("express");
const { createFallbackSpec } = require("../fallbacks/fallbackSpec");
const { generateGameSpec } = require("../services/gameSpecGenerator");
const { routePrompt } = require("../services/promptRouter");
const { createDevelopmentTask } = require("../services/gameDeveloper");

const router = express.Router();

router.post("/", async (req, res) => {
  const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
  const route = routePrompt(prompt);
  console.log(`[generate] prompt="${prompt}" classification=${route.classification} mode=${route.generationMode}`);

  if (route.classification === "invalid") {
    return res.status(400).json({
      success: false,
      classification: "fallback",
      generationMode: "fallback",
      message: "请输入一句游戏创意。",
      fallbackSpec: createFallbackSpec(prompt)
    });
  }

  if (route.classification === "builtInModule") {
    return res.json({
      success: true,
      classification: "builtInModule",
      generationMode: "module",
      moduleEntry: route.moduleEntry,
      moduleName: route.moduleName,
      message: `已加载${route.moduleName}模块。`
    });
  }

  if (route.classification === "developmentRequired") {
    const task = createDevelopmentTask(prompt);
    console.log(`[develop] created task=${task.id} prompt="${prompt}"`);
    return res.json({
      success: true,
      classification: "developmentRequired",
      generationMode: "apiDevelopment",
      developmentTaskId: task.id,
      progress: task.progress,
      stage: task.stage,
      message: "正在调用 API 开发"
    });
  }

  if (route.generationMode === "gameSpec") {
    const result = await generateGameSpec(prompt, route.classification);
    return res.json(result);
  }

  return res.json({
    success: false,
    classification: "fallback",
    generationMode: "fallback",
    message: "生成失败，已加载默认小游戏。",
    fallbackSpec: createFallbackSpec(prompt)
  });
});

module.exports = router;
