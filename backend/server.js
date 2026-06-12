const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const generateGameSpecRouter = require("./routes/generateGameSpec");
const developGameRouter = require("./routes/developGame");
const modulesRouter = require("./routes/modules");

const app = express();
const port = Number(process.env.PORT) || 3000;
const legacyFrontendRoot = path.join(__dirname, "..", "frontend");
const reactFrontendRoot = path.join(__dirname, "..", "frontend_example", "dist");
const frontendRoot = require("fs").existsSync(reactFrontendRoot) ? reactFrontendRoot : legacyFrontendRoot;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api/")) {
      console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - startedAt}ms`);
    }
  });
  next();
});
app.use(express.static(frontendRoot));
app.use("/assets", express.static(path.join(legacyFrontendRoot, "assets")));
app.use("/modules", express.static(path.join(legacyFrontendRoot, "modules")));
app.use("/generated", express.static(path.join(legacyFrontendRoot, "generated")));

app.use("/api/generate-game-spec", generateGameSpecRouter);
app.use("/api/develop-game", developGameRouter);
app.use("/api/modules", modulesRouter);

app.use((req, res) => {
  res.sendFile(path.join(frontendRoot, "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({
    success: false,
    message: "服务器处理失败，请稍后重试。"
  });
});

app.listen(port, () => {
  console.log(`AI game generator running at http://localhost:${port}`);
});
