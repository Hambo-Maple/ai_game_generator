const gameModules = {
  gomoku: {
    id: "gomoku",
    name: "五子棋",
    entry: "/modules/gomoku/index.html",
    keywords: ["五子棋", "连珠", "黑白棋子", "gomoku"]
  },
  tetris: {
    id: "tetris",
    name: "俄罗斯方块",
    entry: "/modules/tetris/index.html",
    keywords: ["俄罗斯方块", "方块", "tetris", "消行"]
  }
};

function matchBuiltInModule(prompt) {
  const value = String(prompt || "").toLowerCase();
  return Object.values(gameModules).find((module) =>
    module.keywords.some((keyword) => value.includes(keyword.toLowerCase()))
  );
}

function listModules() {
  return Object.values(gameModules).map(({ id, name, entry, keywords }) => ({
    id,
    name,
    entry,
    keywords
  }));
}

module.exports = { gameModules, matchBuiltInModule, listModules };
