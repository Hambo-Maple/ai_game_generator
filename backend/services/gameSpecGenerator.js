const { callAi } = require("./aiClient");
const { extractJsonObject } = require("../utils/json");
const { validateAndNormalizeGameSpec } = require("../validators/gameSpecValidator");
const { createFallbackSpec } = require("../fallbacks/fallbackSpec");

const SYSTEM_PROMPT = `你是一个小游戏配置生成器。
只能返回 JSON，不要返回 Markdown、解释、代码块、JavaScript、HTML 或 CSS。
根据用户输入生成 GameSpec：
title, description, scene, player, objects, rules, difficulty。
枚举限制：
scene.theme: space | forest | city | ocean | desert | default
player.control: move | jump | click | shoot
objects.type: enemy | reward | obstacle | target
objects.behavior: falling | movingLeft | randomAppear | static | chase
objects.effect: score | damage | win | none
rules.winCondition: scoreTarget | surviveTime | collectAll | defeatAll
rules.loseCondition: healthZero | timeOut | collision
difficulty.name: easy | normal | hard
视觉风格要求：
scene.backgroundColor 和 scene.groundColor 应适合主题。
对象名称和 emoji 要有区分度，便于前端绘制可辨识素材。`;

function createHeuristicSpec(prompt) {
  const value = String(prompt || "");
  const spec = createFallbackSpec(prompt);

  if (value.includes("太空") || value.includes("宇宙") || value.includes("外星")) {
    spec.scene.theme = "space";
    spec.scene.backgroundColor = "#10172a";
  }
  if (value.includes("森林")) {
    spec.scene.theme = "forest";
    spec.scene.backgroundColor = "#14532d";
  }
  if (value.includes("城市")) {
    spec.scene.theme = "city";
    spec.scene.backgroundColor = "#334155";
  }
  if (value.includes("海") || value.includes("水")) {
    spec.scene.theme = "ocean";
    spec.scene.backgroundColor = "#075985";
  }

  if (value.includes("点击") || value.includes("地鼠")) {
    spec.title = "快速点击挑战";
    spec.description = "点击随机出现的目标获得分数，在时间结束前达到目标。";
    spec.player.control = "click";
    spec.objects = [
      {
        name: value.includes("地鼠") ? "地鼠" : "目标",
        emoji: value.includes("地鼠") ? "🐹" : "👾",
        type: "target",
        behavior: "randomAppear",
        effect: "score",
        points: 10,
        damage: 0,
        speed: 1,
        hp: 1
      }
    ];
    spec.rules.loseCondition = "timeOut";
  } else if (value.includes("射击") || value.includes("发射") || value.includes("子弹")) {
    spec.title = "射击防卫战";
    spec.description = "左右移动并发射子弹，消灭不断出现的敌人。";
    spec.player.control = "shoot";
    spec.player.emoji = value.includes("宇航") ? "🧑‍🚀" : "🤖";
    spec.objects = [
      {
        name: "外星怪物",
        emoji: "👾",
        type: "enemy",
        behavior: "falling",
        effect: "damage",
        points: 15,
        damage: 1,
        speed: 2.5,
        hp: 1
      }
    ];
    spec.rules.winCondition = "defeatAll";
    spec.rules.scoreTarget = 120;
  } else if (value.includes("跳") || value.includes("奔跑")) {
    spec.title = "跳跃奔跑挑战";
    spec.description = "按空格跳过迎面而来的障碍，尽量坚持到时间结束。";
    spec.player.control = "jump";
    spec.player.emoji = value.includes("小狗") ? "🐶" : "🏃";
    spec.objects = [
      {
        name: "木桩",
        emoji: "🪵",
        type: "obstacle",
        behavior: "movingLeft",
        effect: "damage",
        points: 0,
        damage: 1,
        speed: 3,
        hp: 1
      }
    ];
    spec.rules.winCondition = "surviveTime";
  } else {
    spec.title = "躲避收集小游戏";
    spec.description = "左右移动躲避危险并收集奖励，达到目标分数即可获胜。";
    spec.player.control = "move";
    spec.player.emoji = value.includes("小猫") ? "🐱" : value.includes("忍者") ? "🥷" : value.includes("小鸟") ? "🐦" : "😀";
    spec.objects[0].name = value.includes("飞镖") ? "飞镖" : value.includes("蜜蜂") ? "蜜蜂" : "陨石";
    spec.objects[0].emoji = value.includes("飞镖") ? "🗡️" : value.includes("蜜蜂") ? "🐝" : "☄️";
    spec.objects[1].name = value.includes("宝石") ? "宝石" : value.includes("糖果") ? "糖果" : "星星";
    spec.objects[1].emoji = value.includes("宝石") ? "💎" : value.includes("糖果") ? "🍬" : "⭐";
  }

  return validateAndNormalizeGameSpec(spec);
}

async function generateGameSpec(prompt, classification = "supported") {
  try {
    const content = await callAi([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    const rawSpec = extractJsonObject(content);
    if (!rawSpec) {
      throw new Error("AI returned invalid JSON");
    }

    return {
      success: true,
      classification,
      generationMode: "gameSpec",
      gameSpec: validateAndNormalizeGameSpec(rawSpec),
      message: classification === "mappable" ? "已根据当前引擎能力生成可玩版本。" : ""
    };
  } catch (error) {
    return {
      success: true,
      classification,
      generationMode: "gameSpec",
      gameSpec: createHeuristicSpec(prompt),
      message: "AI 暂不可用，已使用本地规则生成可玩 GameSpec。"
    };
  }
}

module.exports = { generateGameSpec, createHeuristicSpec };
