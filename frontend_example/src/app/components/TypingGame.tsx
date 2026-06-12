import { useState, useEffect, useRef } from "react";

export function TypingGame({ sentence }: { sentence: string }) {
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function start() {
    setInput("");
    setStarted(true);
    setFinished(false);
    setErrors(0);
    const t = Date.now();
    setStartTime(t);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - t);
    }, 100);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleChange(val: string) {
    if (!started || finished) return;
    setInput(val);
    const target = sentence.slice(0, val.length);
    let err = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== sentence[i]) err++;
    }
    setErrors(err);
    if (val === sentence) {
      setFinished(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(Date.now() - startTime);
    }
  }

  const wpm = finished && elapsed > 0
    ? Math.round((sentence.split(" ").length / (elapsed / 60000)))
    : 0;

  const accuracy = input.length > 0
    ? Math.round(((input.length - errors) / input.length) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-6 py-4 w-full max-w-xl mx-auto">
      <div className="flex gap-6 justify-center">
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.5rem" }}>
            {finished ? (elapsed / 1000).toFixed(1) : (elapsed / 1000).toFixed(1)}s
          </div>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>时间</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#22d3ee", fontWeight: 700, fontSize: "1.5rem" }}>{wpm || "—"}</div>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>词/分</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: errors > 0 ? "#ef4444" : "#22c55e", fontWeight: 700, fontSize: "1.5rem" }}>{accuracy}%</div>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>准确率</div>
        </div>
      </div>

      {/* Text display */}
      <div style={{
        background: "var(--secondary)",
        border: "2px solid var(--primary)",
        borderRadius: 14,
        padding: "20px 24px",
        fontSize: "1.1rem",
        lineHeight: 1.8,
        fontFamily: "monospace",
        letterSpacing: "0.05em",
        minHeight: 80,
      }}>
        {sentence.split("").map((ch, i) => {
          let color = "var(--muted-foreground)";
          if (i < input.length) {
            color = input[i] === ch ? "#22c55e" : "#ef4444";
          } else if (i === input.length && started) {
            color = "var(--foreground)";
          }
          return (
            <span key={i} style={{
              color,
              background: i === input.length && started ? "rgba(124,58,237,0.4)" : "transparent",
              borderRadius: 2,
            }}>{ch}</span>
          );
        })}
      </div>

      {!started ? (
        <button
          onClick={start}
          style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 12, padding: "12px 32px", cursor: "pointer", fontWeight: 700, margin: "0 auto" }}
        >
          开始打字
        </button>
      ) : finished ? (
        <div className="flex flex-col items-center gap-4">
          <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.2rem" }}>🎉 完成！速度 {wpm} 词/分钟</p>
          <button onClick={start} style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 12, padding: "10px 28px", cursor: "pointer", fontWeight: 700 }}>
            再试一次
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          disabled={finished}
          placeholder="开始输入..."
          style={{
            background: "var(--input-background)",
            border: "2px solid var(--primary)",
            borderRadius: 12,
            padding: "12px 20px",
            color: "var(--foreground)",
            outline: "none",
            fontSize: "1rem",
            fontFamily: "monospace",
          }}
        />
      )}
    </div>
  );
}
