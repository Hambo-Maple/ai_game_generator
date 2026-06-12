import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Maximize2,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { gameState } from "../engine/state.js";
import { resetGame, runGame, setPaused } from "../engine/gameSpecEngine.js";

declare global {
  interface Window {
    gameUi?: {
      updateStatus: (value: string) => void;
      updateHud: () => void;
      updatePauseLabel?: (value: string) => void;
      showOverlay: (title: string, message: string, restart?: boolean) => void;
      hideOverlay: () => void;
    };
  }
}

type GenerationMode = "spec" | "module" | "apiDevelopment";

type GameSpec = {
  title?: string;
  description?: string;
  player?: { emoji?: string; name?: string; control?: string; health?: number };
  scene?: { theme?: string };
  objects?: Array<{ name?: string; points?: number; damage?: number }>;
  rules?: { timeLimit?: number; scoreTarget?: number; winCondition?: string; loseCondition?: string };
  difficulty?: { name?: string };
};

type ExternalGame = {
  active: boolean;
  entry: string;
  generated: boolean;
  running: boolean;
  paused: boolean;
  controlsText: string;
};

const examples = [
  "小猫在太空中躲避陨石收集星星",
  "勇士点击怪物获得金币",
  "小狗在森林里跳过木桩向前奔跑",
  "机器人射击外星怪物保护基地",
  "设计一个五子棋游戏",
  "做一个塔防游戏",
];

const emptyExternal: ExternalGame = {
  active: false,
  entry: "",
  generated: false,
  running: false,
  paused: false,
  controlsText: "",
};

function controlHelp(control?: string) {
  const helps: Record<string, string> = {
    move: "点击画布聚焦后，使用方向键移动角色，躲避危险物并收集奖励。",
    jump: "点击画布聚焦后，按 Space 或方向上键跳跃，避开迎面而来的障碍。",
    click: "直接点击画布中出现的目标，尽快达到目标分数。",
    shoot: "点击画布聚焦后，用方向键移动，按 Space 发射子弹。",
  };
  return helps[control || ""] || "点击游戏区域后按页面提示操作。";
}

function normalizeEntry(entry: string) {
  if (!entry) return "";
  return entry.startsWith("/") ? entry : `/${entry}`;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("未开始");
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [mode, setMode] = useState<GenerationMode>("spec");
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyHelp, setKeyHelp] = useState("生成游戏后会显示操作说明。");
  const [overlay, setOverlay] = useState({ visible: true, title: "未开始", message: "输入一句话生成小游戏。", restart: false });
  const [externalGame, setExternalGame] = useState<ExternalGame>(emptyExternal);
  const [scale, setScale] = useState(1);
  const gamePanelRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const specRows = useMemo(() => {
    if (!spec) return [["状态", "等待生成"]];
    return [
      ["标题", spec.title || "-"],
      ["说明", spec.description || "-"],
      ["角色", `${spec.player?.emoji || ""} ${spec.player?.name || ""}`.trim() || "-"],
      ["血量", spec.player?.health ? `${spec.player.health}` : "-"],
      ["场景", spec.scene?.theme || "-"],
      ["操作", spec.player?.control || "-"],
      ["物体", spec.objects?.map((item) => {
        const detail = [
          item.points !== undefined ? `${item.points}分` : "",
          item.damage ? `伤害${item.damage}` : ""
        ].filter(Boolean).join("/");
        return `${item.name || "物体"}${detail ? `(${detail})` : ""}`;
      }).join("、") || "-"],
      ["限时", spec.rules?.timeLimit ? `${spec.rules.timeLimit} 秒` : "-"],
      ["目标", spec.rules?.scoreTarget ? `${spec.rules.scoreTarget} 分` : "-"],
      ["胜利", spec.rules?.winCondition || "-"],
      ["失败", spec.rules?.loseCondition || "-"],
      ["难度", spec.difficulty?.name || "-"],
    ];
  }, [spec]);

  useEffect(() => {
    window.gameUi = {
      updateStatus: (value: string) => setStatus(value),
      updateHud: () => undefined,
      updatePauseLabel: () => undefined,
      showOverlay: (title: string, message: string, restart = true) => setOverlay({ visible: true, title, message, restart }),
      hideOverlay: () => setOverlay((current) => ({ ...current, visible: false })),
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GAME_ZOOM" && !document.fullscreenElement) {
        setScale((current) => Math.max(0.7, Math.min(1.5, current + (event.data.deltaY > 0 ? -0.08 : 0.08))));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      resetGame();
      delete window.gameUi;
    };
  }, []);

  async function generateGame() {
    const value = prompt.trim();
    if (!value) {
      setOverlay({ visible: true, title: "请输入创意", message: "用一句话描述你想玩的小游戏。", restart: false });
      return;
    }

    resetGame();
    setExternalGame(emptyExternal);
    setScale(1);
    setSpec(null);
    setMode("spec");
    setStatus("生成中");
    setOverlay({ visible: false, title: "", message: "", restart: false });
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-game-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      const data = await response.json();

      if (data.generationMode === "module") {
        const moduleSpec = {
          title: data.moduleName,
          description: data.message,
          player: { name: "双人轮流", control: "点击棋盘" },
          scene: { theme: "专业模块" },
          objects: [{ name: "黑白棋子" }],
          rules: { winCondition: "五连", loseCondition: "无" },
          difficulty: { name: "standard" },
        };
        setMode("module");
        setSpec(moduleSpec);
        showModule(data.moduleEntry, false, data.controlsText);
        setStatus("已生成");
        setKeyHelp("点击棋盘交替落子，模块内的重新开始按钮可重置棋局。");
        return;
      }

      if (data.generationMode === "apiDevelopment") {
        setMode("apiDevelopment");
        setStatus("API 开发中");
        setSpec({
          title: "API 开发模式",
          description: data.message,
          player: { name: "系统", control: "等待" },
          scene: { theme: "开发中" },
          objects: [{ name: data.developmentTaskId }],
          rules: { winCondition: "开发完成", loseCondition: "开发失败" },
          difficulty: { name: "custom" },
        });
        setKeyHelp("复杂游戏开发完成后会在此区域加载，具体键位由生成游戏页面显示。");
        pollDevelopmentTask(data.developmentTaskId);
        return;
      }

      const nextSpec = data.gameSpec || data.fallbackSpec;
      gameState.currentSpec = nextSpec;
      setSpec(nextSpec);
      setMode("spec");
      setStatus("已生成");
      setKeyHelp(controlHelp(nextSpec?.player?.control));
      setOverlay({ visible: true, title: "游戏已生成", message: "点击开始运行 Canvas 小游戏。", restart: false });
    } catch {
      setStatus("失败");
      setOverlay({ visible: true, title: "生成失败", message: "请求后端失败，请确认服务正在运行。", restart: false });
    } finally {
      setIsGenerating(false);
    }
  }

  async function pollDevelopmentTask(taskId: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      let data;
      try {
        const response = await fetch(`/api/develop-game/${taskId}`);
        data = await response.json();
      } catch {
        setStatus("失败");
        setOverlay({ visible: true, title: "开发状态获取失败", message: "无法连接后端，请确认服务正在运行。", restart: false });
        return;
      }

      const progress = Math.max(0, Math.min(100, Math.round(data.progress || Math.min(92, 8 + attempt * 2))));
      setOverlay({ visible: true, title: "正在调用 API 开发", message: `${data.stage || data.message || "正在开发"}：${progress}%`, restart: false });

      if (data.status === "completed") {
        showModule(data.entry, true, data.controlsText);
        setStatus("已生成");
        setKeyHelp(data.controlsText || "点击游戏区域聚焦后，按生成游戏页面提示操作。");
        setOverlay({ visible: false, title: "", message: "", restart: false });
        return;
      }

      if (data.status === "failed") {
        loadFallbackAfterDevelopment(data.fallbackSpec, data.message || "已为你加载默认小游戏。");
        return;
      }
    }
    loadFallbackAfterDevelopment(null, "API 开发等待超时，已为你加载默认小游戏。");
  }

  async function loadFallbackAfterDevelopment(fallbackSpec: GameSpec | null, message: string) {
    let fallback = fallbackSpec;
    if (!fallback) {
      try {
        const response = await fetch("/api/generate-game-spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "默认冒险小游戏" }),
        });
        const data = await response.json();
        fallback = data.gameSpec || data.fallbackSpec;
      } catch {
        fallback = null;
      }
    }
    if (fallback) {
      gameState.currentSpec = fallback;
      setSpec(fallback);
      setMode("spec");
      setExternalGame(emptyExternal);
      setStatus("已生成");
      setKeyHelp(controlHelp(fallback?.player?.control));
      setOverlay({ visible: true, title: "API 开发未完成", message, restart: false });
      return;
    }
    setStatus("失败");
    setOverlay({ visible: true, title: "API 开发未完成", message, restart: false });
  }

  function showModule(entry: string, generated: boolean, controlsText = "") {
    resetGame();
    setScale(1);
    setExternalGame({
      active: true,
      entry: normalizeEntry(entry),
      generated,
      running: !generated,
      paused: false,
      controlsText,
    });
    if (generated) {
      setOverlay({ visible: true, title: "游戏已准备好", message: "查看下方操作提示，点击开始运行游戏。", restart: false });
    } else {
      setOverlay({ visible: false, title: "", message: "", restart: false });
    }
  }

  function startGame() {
    if (externalGame.active) {
      postExternalMessage("GAME_START");
      setExternalGame((current) => ({ ...current, running: true, paused: false }));
      frameRef.current?.contentWindow?.focus();
      setOverlay((current) => ({ ...current, visible: false }));
      return;
    }

    if (!gameState.currentSpec) {
      setOverlay({ visible: true, title: "还没有游戏", message: "先输入一句话生成小游戏。", restart: false });
      return;
    }
    runGame(gameState.currentSpec);
  }

  function pauseGame() {
    if (externalGame.active) {
      if (!externalGame.running) return;
      const nextPaused = !externalGame.paused;
      postExternalMessage(nextPaused ? "GAME_PAUSE" : "GAME_RESUME");
      setExternalGame((current) => ({ ...current, paused: nextPaused }));
      setOverlay(nextPaused
        ? { visible: true, title: "已暂停", message: "点击继续按钮恢复游戏。", restart: false }
        : { visible: false, title: "", message: "", restart: false });
      return;
    }
    if (gameState.running) setPaused(!gameState.paused);
  }

  function restartGame() {
    if (externalGame.active) {
      postExternalMessage("GAME_RESET");
      setExternalGame((current) => ({ ...current, running: false, paused: false }));
      setOverlay({ visible: true, title: "游戏已重置", message: "点击开始重新运行游戏。", restart: false });
      return;
    }
    if (gameState.currentSpec) runGame(gameState.currentSpec);
  }

  function postExternalMessage(type: string) {
    frameRef.current?.contentWindow?.postMessage({ type }, window.location.origin);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    gamePanelRef.current?.requestFullscreen?.();
  }

  function prepareEmbeddedGame() {
    try {
      const frameDocument = frameRef.current?.contentDocument;
      if (!frameDocument) return;
      const style = frameDocument.createElement("style");
      style.textContent = "html,body{width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important}canvas{max-width:100%!important;max-height:100%!important}";
      frameDocument.head.appendChild(style);
      frameRef.current?.contentWindow?.focus();
    } catch {
      // Same-origin generated modules should be accessible; ignore browser restrictions.
    }
  }

  const canStart = externalGame.active ? !(externalGame.running && !externalGame.paused) : Boolean(gameState.currentSpec);
  const pauseLabel = externalGame.paused || gameState.paused ? "继续" : "暂停";

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b1020] text-foreground">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(139,92,246,0.34),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(34,211,238,0.24),transparent_30%),linear-gradient(180deg,#0b1020_0%,#111827_58%,#0f172a_100%)]" />
      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-5 py-5 lg:px-8">
        <header className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.06] px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_28px_rgba(139,92,246,0.42)]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">AI Game Studio</h1>
              <p className="text-sm text-muted-foreground">一句话生成、调试并运行小游戏</p>
            </div>
          </div>
          <Badge variant={status === "失败" ? "destructive" : "default"} className="h-8 px-3 text-sm shadow-[0_0_22px_rgba(139,92,246,0.3)]">{status}</Badge>
        </header>

        <section className="grid min-h-[calc(100vh-116px)] gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-0 flex-col gap-4">
            <Card className="rounded-lg border-white/10 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">创意控制台</CardTitle>
                <CardDescription>输入角色、目标、障碍或玩法。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  className="min-h-40 border-white/10 bg-slate-950/70 text-base text-foreground shadow-inner placeholder:text-slate-500"
                  placeholder="例如：小猫在太空中躲避陨石收集星星"
                />
                <Button className="h-11 w-full bg-primary shadow-[0_0_28px_rgba(139,92,246,0.36)]" onClick={generateGame} disabled={isGenerating}>
                  <Wand2 className="size-4" />
                  {isGenerating ? "生成中..." : "AI 生成游戏"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-white/[0.055] backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">灵感模块</CardTitle>
                <CardDescription>点击即可填入提示词。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {examples.map((example) => (
                  <Button key={example} type="button" variant="outline" size="sm" onClick={() => setPrompt(example)} className="h-auto justify-start whitespace-normal border-white/10 bg-slate-950/35 px-3 py-2 text-left text-slate-200 hover:bg-white/10">
                    {example}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section ref={gamePanelRef} className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-slate-950/58 p-4 text-card-foreground shadow-2xl shadow-black/40 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">游戏舞台</h2>
                <p className="text-sm text-muted-foreground">Canvas 引擎和专业模块在这里运行。</p>
              </div>
              <Badge variant="outline" className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100">{mode === "module" ? "模块" : mode === "apiDevelopment" ? "开发中" : "GameSpec"}</Badge>
            </div>
            <div
              className="relative aspect-video w-full overflow-hidden rounded-lg border border-cyan-300/20 bg-[#030712] shadow-[0_0_60px_rgba(34,211,238,0.12)]"
              onWheel={(event) => {
                if (!event.ctrlKey || document.fullscreenElement) return;
                event.preventDefault();
                setScale((current) => Math.max(0.7, Math.min(1.5, current + (event.deltaY > 0 ? -0.08 : 0.08))));
              }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "100%", height: "100%" }}>
                <canvas id="gameCanvas" width="800" height="450" tabIndex={0} aria-label="游戏画布" className={externalGame.active ? "hidden" : "block h-full w-full"} />
                {externalGame.active && (
                  <iframe
                    ref={frameRef}
                    src={externalGame.entry}
                    title={mode === "module" ? "专业游戏模块" : "AI 生成游戏"}
                    scrolling="no"
                    onLoad={prepareEmbeddedGame}
                    className="block h-full w-full border-0 bg-white"
                  />
                )}
              </div>

              <AnimatePresence>
                {overlay.visible && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 grid place-content-center gap-3 bg-slate-950/80 p-6 text-center text-white"
                  >
                    <strong className="text-2xl">{overlay.title}</strong>
                    <span className="max-w-xl text-sm text-white/80">{overlay.message}</span>
                    {overlay.restart && <Button variant="secondary" onClick={restartGame}>重新开始</Button>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={startGame} disabled={!canStart}>
                <Play className="size-4" />
                {externalGame.paused ? "继续" : externalGame.running ? "运行中" : "开始"}
              </Button>
              <Button variant="outline" onClick={pauseGame} disabled={externalGame.active ? !externalGame.running : !gameState.running}>
                <Pause className="size-4" />
                {pauseLabel}
              </Button>
              <Button variant="outline" onClick={restartGame} disabled={externalGame.active ? !externalGame.entry : !gameState.currentSpec}>
                <RefreshCcw className="size-4" />
                重新开始
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullscreen} title="全屏">
                <Maximize2 className="size-4" />
              </Button>
            </div>
            <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground">{keyHelp}</div>
          </section>

          <aside className="min-h-0">
            <Card className="h-full rounded-lg border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">生成结构</CardTitle>
                <CardDescription>后端返回的游戏配置。</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 text-sm">
                  {specRows.map(([label, value]) => (
                    <div key={label} className="rounded-md border border-white/10 bg-slate-950/35 p-3">
                      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                      <dd className="min-w-0 break-words text-slate-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
