function createFallbackSpec(prompt = "") {
  return {
    title: prompt ? "默认冒险小游戏" : "默认冒险小游戏",
    description: "控制角色移动，躲避危险物并收集星星，达到目标分数即可获胜。",
    scene: {
      theme: "default",
      backgroundColor: "#1e293b",
      groundColor: "#475569"
    },
    player: {
      name: "冒险者",
      emoji: "😀",
      health: 3,
      control: "move",
      speed: 5
    },
    objects: [
      {
        name: "危险物",
        emoji: "⚠️",
        type: "obstacle",
        behavior: "falling",
        effect: "damage",
        points: 0,
        damage: 1,
        speed: 3,
        hp: 1
      },
      {
        name: "星星",
        emoji: "⭐",
        type: "reward",
        behavior: "falling",
        effect: "score",
        points: 10,
        damage: 0,
        speed: 2,
        hp: 1
      }
    ],
    rules: {
      timeLimit: 30,
      scoreTarget: 100,
      winCondition: "scoreTarget",
      loseCondition: "healthZero"
    },
    difficulty: {
      name: "normal",
      spawnRate: 1000,
      objectSpeed: 2.5
    }
  };
}

module.exports = { createFallbackSpec };
