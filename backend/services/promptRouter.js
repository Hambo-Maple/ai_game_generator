const { matchBuiltInModule } = require("./moduleRegistry");

const SUPPORTED_HINTS = [
  "躲避",
  "收集",
  "点击",
  "跳",
  "奔跑",
  "射击",
  "发射",
  "消灭",
  "保护",
  "地鼠",
  "金币",
  "星星",
  "宝石",
  "糖果"
];

const DEVELOPMENT_HINTS = [
  "象棋",
  "围棋",
  "塔防",
  "俄罗斯方块",
  "方块",
  "tetris",
  "扫雷",
  "数独",
  "2048",
  "平台",
  "闯关",
  "卡牌",
  "扑克牌",
  "回合制",
  "rpg",
  "经营",
  "密室",
  "解谜",
  "奶茶店"
];

function isValidPrompt(prompt) {
  return typeof prompt === "string" && prompt.trim().length >= 2;
}

function routePrompt(prompt) {
  if (!isValidPrompt(prompt)) {
    return { classification: "invalid", generationMode: "fallback" };
  }

  const module = matchBuiltInModule(prompt);
  if (module) {
    return {
      classification: "builtInModule",
      generationMode: "module",
      moduleEntry: module.entry,
      moduleName: module.name
    };
  }

  const normalized = prompt.toLowerCase();
  if (DEVELOPMENT_HINTS.some((hint) => normalized.includes(hint))) {
    return { classification: "developmentRequired", generationMode: "apiDevelopment" };
  }

  if (SUPPORTED_HINTS.some((hint) => normalized.includes(hint))) {
    return { classification: "supported", generationMode: "gameSpec" };
  }

  return { classification: "mappable", generationMode: "gameSpec" };
}

module.exports = { routePrompt };
