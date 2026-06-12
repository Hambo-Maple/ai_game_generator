const { createFallbackSpec } = require("../fallbacks/fallbackSpec");

const ALLOWED = {
  themes: ["space", "forest", "city", "ocean", "desert", "default"],
  controls: ["move", "jump", "click", "shoot"],
  objectTypes: ["enemy", "reward", "obstacle", "target"],
  behaviors: ["falling", "movingLeft", "randomAppear", "static", "chase"],
  effects: ["score", "damage", "win", "none"],
  winConditions: ["scoreTarget", "surviveTime", "collectAll", "defeatAll"],
  loseConditions: ["healthZero", "timeOut", "collision"],
  difficulties: ["easy", "normal", "hard"]
};

function pick(value, list, fallback) {
  return list.includes(value) ? value : fallback;
}

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 60) : fallback;
}

function emoji(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 4) : fallback;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function normalizeObject(rawObject, index) {
  const fallback = createFallbackSpec().objects[index % 2];
  const object = rawObject && typeof rawObject === "object" ? rawObject : {};
  const type = pick(object.type, ALLOWED.objectTypes, fallback.type);
  const behavior = pick(object.behavior, ALLOWED.behaviors, fallback.behavior);
  const effect = pick(object.effect, ALLOWED.effects, type === "reward" || type === "target" ? "score" : "damage");

  return {
    name: text(object.name, fallback.name),
    emoji: emoji(object.emoji, fallback.emoji),
    type,
    behavior,
    effect,
    points: numberInRange(object.points, fallback.points, 0, 100),
    damage: numberInRange(object.damage, fallback.damage, 0, 5),
    speed: numberInRange(object.speed, fallback.speed, 0.5, 12),
    hp: numberInRange(object.hp, fallback.hp, 1, 20)
  };
}

function normalizeObjectsForControl(control, objects) {
  if (control === "click") {
    const target = objects.find((object) => object.effect === "score" || object.type === "target") || objects[0];
    return [
      {
        ...target,
        type: "target",
        behavior: "randomAppear",
        effect: "score",
        points: target.points || 10,
        damage: 0
      }
    ];
  }

  if (control === "jump") {
    return objects.map((object) => ({
      ...object,
      type: object.type === "reward" ? "reward" : "obstacle",
      behavior: "movingLeft",
      effect: object.type === "reward" || object.effect === "score" ? "score" : "damage"
    }));
  }

  if (control === "shoot") {
    const enemies = objects.filter((object) => object.type === "enemy" || object.effect === "damage");
    const source = enemies.length ? enemies : objects;
    return source.map((object) => ({
      ...object,
      type: "enemy",
      behavior: object.behavior === "chase" ? "chase" : "falling",
      effect: "damage",
      points: object.points || 10,
      damage: object.damage || 1
    }));
  }

  const hasDamage = objects.some((object) => object.effect === "damage");
  const hasScore = objects.some((object) => object.effect === "score");
  const normalized = objects.map((object) => ({
    ...object,
    behavior: "falling"
  }));

  if (!hasDamage) {
    normalized.push(normalizeObject({ name: "危险物", emoji: "⚠️", type: "obstacle", behavior: "falling", effect: "damage" }, 0));
  }
  if (!hasScore) {
    normalized.push(normalizeObject({ name: "奖励", emoji: "⭐", type: "reward", behavior: "falling", effect: "score", points: 10 }, 1));
  }

  return normalized;
}

function normalizeRulesForControl(control, rules, fallback) {
  const normalized = {
    timeLimit: numberInRange(rules.timeLimit, fallback.rules.timeLimit, 10, 120),
    scoreTarget: numberInRange(rules.scoreTarget, fallback.rules.scoreTarget, 10, 500),
    winCondition: pick(rules.winCondition, ALLOWED.winConditions, fallback.rules.winCondition),
    loseCondition: pick(rules.loseCondition, ALLOWED.loseConditions, fallback.rules.loseCondition)
  };

  if (control === "click") {
    normalized.winCondition = "scoreTarget";
    normalized.loseCondition = "timeOut";
  } else if (control === "jump") {
    normalized.winCondition = "surviveTime";
    normalized.loseCondition = "healthZero";
  } else if (control === "shoot") {
    normalized.winCondition = "scoreTarget";
    normalized.loseCondition = "healthZero";
  } else {
    normalized.winCondition = "scoreTarget";
    normalized.loseCondition = "healthZero";
  }

  return normalized;
}

function validateAndNormalizeGameSpec(rawSpec) {
  const fallback = createFallbackSpec();
  const raw = rawSpec && typeof rawSpec === "object" && !Array.isArray(rawSpec) ? rawSpec : {};
  const scene = raw.scene && typeof raw.scene === "object" ? raw.scene : {};
  const player = raw.player && typeof raw.player === "object" ? raw.player : {};
  const rules = raw.rules && typeof raw.rules === "object" ? raw.rules : {};
  const difficulty = raw.difficulty && typeof raw.difficulty === "object" ? raw.difficulty : {};
  const objects = Array.isArray(raw.objects) ? raw.objects.filter(Boolean).slice(0, 8) : [];
  const control = pick(player.control, ALLOWED.controls, fallback.player.control);
  const normalizedObjects = normalizeObjectsForControl(control, objects.length ? objects.map(normalizeObject) : fallback.objects);
  const normalizedRules = normalizeRulesForControl(control, rules, fallback);

  return {
    title: text(raw.title, fallback.title),
    description: text(raw.description, fallback.description),
    scene: {
      theme: pick(scene.theme, ALLOWED.themes, fallback.scene.theme),
      backgroundColor: text(scene.backgroundColor, fallback.scene.backgroundColor),
      groundColor: text(scene.groundColor, fallback.scene.groundColor)
    },
    player: {
      name: text(player.name, fallback.player.name),
      emoji: emoji(player.emoji, fallback.player.emoji),
      health: numberInRange(player.health, fallback.player.health, 1, 10),
      control,
      speed: numberInRange(player.speed, fallback.player.speed, 2, 12)
    },
    objects: normalizedObjects,
    rules: normalizedRules,
    difficulty: {
      name: pick(difficulty.name, ALLOWED.difficulties, fallback.difficulty.name),
      spawnRate: numberInRange(difficulty.spawnRate, fallback.difficulty.spawnRate, 300, 3000),
      objectSpeed: numberInRange(difficulty.objectSpeed, fallback.difficulty.objectSpeed, 1, 10)
    }
  };
}

module.exports = { validateAndNormalizeGameSpec, ALLOWED };
