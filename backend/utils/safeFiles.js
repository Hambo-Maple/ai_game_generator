const path = require("path");

const ALLOWED_FILES = new Set(["index.html", "style.css", "game.js"]);
const BLOCKED_PATTERNS = [
  /eval\s*\(/i,
  /new\s+Function/i,
  /<script[^>]+src=["']https?:\/\//i,
  /<link[^>]+href=["']https?:\/\//i,
  /import\s+.*https?:\/\//i,
  /process\.env/i,
  /\.env/i,
  /child_process/i,
  /fs\./i,
  /require\s*\(/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /localStorage/i,
  /sessionStorage/i,
  /document\.cookie/i
];

function isSafeGeneratedPath(rootDir, targetPath) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedRoot);
}

function isAllowedGeneratedFile(fileName) {
  return ALLOWED_FILES.has(fileName);
}

function scanGeneratedContent(content) {
  const value = String(content || "");
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(value));
}

module.exports = {
  isSafeGeneratedPath,
  isAllowedGeneratedFile,
  scanGeneratedContent
};
