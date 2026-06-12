import { useState, useEffect, useRef, useCallback } from "react";

const ITEM_SETS: Record<string, string[]> = {
  star: ["⭐", "🌟", "💫", "✨", "🌠"],
  rain: ["💧", "🌧️", "❄️", "🌨️", "💦"],
  food: ["🍎", "🍊", "🍋", "🍇", "🍓"],
  money: ["💰", "💎", "🪙", "💵", "🏆"],
  fruit: ["🍎", "🍊", "🍋", "🍇", "🍓"],
  default: ["🎁", "⭐", "💎", "🏆", "🪙"],
};

function detectItems(sentence: string): string[] {
  const s = sentence.toLowerCase();
  if (/star|shine|bright|sky|night/.test(s)) return ITEM_SETS.star;
  if (/rain|water|snow|drop|fall/.test(s)) return ITEM_SETS.rain;
  if (/food|eat|fruit|hungry|meal/.test(s)) return ITEM_SETS.food;
  if (/money|rich|gold|treasure|diamond/.test(s)) return ITEM_SETS.money;
  return ITEM_SETS.default;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
}

const CANVAS_W = 400;
const CANVAS_H = 400;
const BASKET_W = 70;
const BASKET_H = 30;

export function CatchingGame({ sentence }: { sentence: string }) {
  const items = detectItems(sentence);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    basketX: CANVAS_W / 2 - BASKET_W / 2,
    falling: [] as FallingItem[],
    score: 0,
    lives: 3,
    running: false,
    nextId: 0,
    frame: 0,
    level: 1,
  });
  const [display, setDisplay] = useState({ score: 0, lives: 3, running: false, won: false });
  const animRef = useRef<number | null>(null);
  const mouseXRef = useRef(CANVAS_W / 2);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = "rgba(124,58,237,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Spawn items
    s.frame++;
    const spawnRate = Math.max(30, 80 - s.level * 5);
    if (s.frame % spawnRate === 0) {
      s.falling.push({
        id: s.nextId++,
        x: Math.random() * (CANVAS_W - 40) + 20,
        y: -20,
        emoji: items[Math.floor(Math.random() * items.length)],
        speed: 2 + Math.random() * 2 + s.level * 0.5,
      });
    }

    // Update & draw items
    s.falling = s.falling.filter((item) => {
      item.y += item.speed;

      // Check catch
      const bx = s.basketX;
      if (item.y + 20 >= CANVAS_H - BASKET_H - 10 && item.y + 20 <= CANVAS_H - 10 &&
        item.x >= bx - 10 && item.x <= bx + BASKET_W + 10) {
        s.score += 10;
        if (s.score >= 200) {
          s.running = false;
          setDisplay({ score: s.score, lives: s.lives, running: false, won: true });
        }
        setDisplay((d) => ({ ...d, score: s.score }));
        return false;
      }

      if (item.y > CANVAS_H + 20) {
        s.lives--;
        setDisplay((d) => ({ ...d, lives: s.lives }));
        if (s.lives <= 0) {
          s.running = false;
          setDisplay({ score: s.score, lives: 0, running: false, won: false });
        }
        return false;
      }

      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.fillText(item.emoji, item.x, item.y);
      return true;
    });

    // Basket
    const grd = ctx.createLinearGradient(s.basketX, CANVAS_H - BASKET_H - 10, s.basketX, CANVAS_H - 10);
    grd.addColorStop(0, "#7c3aed");
    grd.addColorStop(1, "#4c1d95");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.roundRect(s.basketX, CANVAS_H - BASKET_H - 10, BASKET_W, BASKET_H, 8);
    ctx.fill();
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (s.running) {
      animRef.current = requestAnimationFrame(drawFrame);
    }
  }, [items]);

  function startGame() {
    stateRef.current = {
      basketX: CANVAS_W / 2 - BASKET_W / 2,
      falling: [],
      score: 0,
      lives: 3,
      running: true,
      nextId: 0,
      frame: 0,
      level: 1,
    };
    setDisplay({ score: 0, lives: 3, running: true, won: false });
    animRef.current = requestAnimationFrame(drawFrame);
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      stateRef.current.basketX = Math.max(0, Math.min(CANVAS_W - BASKET_W, x - BASKET_W / 2));
    };
    const handleTouch = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      stateRef.current.basketX = Math.max(0, Math.min(CANVAS_W - BASKET_W, x - BASKET_W / 2));
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleTouch);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex gap-8">
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.4rem" }}>{display.score}</div>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>得分</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "1.4rem" }}>{"❤️".repeat(Math.max(0, display.lives))}</div>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>生命</div>
        </div>
      </div>

      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "2px solid var(--primary)", boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
        {!display.running && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 16,
            background: "rgba(13,13,26,0.85)"
          }}>
            {display.score > 0 && (
              <p style={{ color: display.won ? "var(--accent)" : "#ef4444", fontWeight: 700, fontSize: "1.3rem" }}>
                {display.won ? "🏆 胜利！" : "💀 游戏结束"} 得分：{display.score}
              </p>
            )}
            <button onClick={startGame} style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 12, padding: "12px 32px", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>
              {display.score > 0 ? "再来一次" : "开始游戏"}
            </button>
            {display.score === 0 && <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>移动鼠标控制篮子接住掉落物品</p>}
          </div>
        )}
      </div>
    </div>
  );
}
