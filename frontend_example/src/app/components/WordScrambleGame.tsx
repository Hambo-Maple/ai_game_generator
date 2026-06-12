import { useState, useEffect } from "react";

function scrambleWord(word: string): string {
  if (word.length <= 2) return word;
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === word ? scrambleWord(word) : result;
}

export function WordScrambleGame({ sentence }: { sentence: string }) {
  const words = sentence.split(/\s+/).filter((w) => w.length > 2);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (words[currentIdx]) {
      setScrambled(scrambleWord(words[currentIdx]));
      setInput("");
      setFeedback(null);
    }
  }, [currentIdx]);

  if (words.length === 0) return <p className="text-center" style={{ color: "var(--muted-foreground)" }}>句子太短了，请输入更长的句子！</p>;

  const currentWord = words[currentIdx];

  function handleSubmit() {
    if (input.toLowerCase().trim() === currentWord.toLowerCase()) {
      setFeedback("correct");
      setScore((s) => s + 10);
      setTimeout(() => {
        if (currentIdx + 1 >= words.length) setDone(true);
        else setCurrentIdx((i) => i + 1);
      }, 800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div style={{ fontSize: "4rem" }}>🏆</div>
        <h2 style={{ color: "var(--accent)" }}>完成！</h2>
        <p style={{ color: "var(--foreground)" }}>最终得分：<span style={{ color: "var(--accent)", fontWeight: 700 }}>{score}</span></p>
        <button
          onClick={() => { setCurrentIdx(0); setScore(0); setDone(false); }}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: 12, padding: "12px 32px", cursor: "pointer", fontWeight: 700 }}
        >
          再来一次
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex gap-3 items-center">
        <span style={{ color: "var(--muted-foreground)" }}>进度：</span>
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{currentIdx + 1} / {words.length}</span>
        <span style={{ color: "var(--muted-foreground)", marginLeft: 16 }}>得分：</span>
        <span style={{ color: "#22d3ee", fontWeight: 700 }}>{score}</span>
      </div>

      <div style={{
        background: "var(--secondary)",
        border: "2px solid var(--primary)",
        borderRadius: 16,
        padding: "24px 40px",
        letterSpacing: "0.3em",
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--accent)",
        textTransform: "uppercase",
        boxShadow: "0 0 30px rgba(124,58,237,0.3)"
      }}>
        {scrambled.split("").map((ch, i) => (
          <span key={i} style={{ display: "inline-block", margin: "0 2px" }}>{ch}</span>
        ))}
      </div>

      <p style={{ color: "var(--muted-foreground)" }}>将乱序字母还原成正确的单词</p>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="输入答案..."
          style={{
            background: "var(--input-background)",
            border: `2px solid ${feedback === "correct" ? "#22c55e" : feedback === "wrong" ? "#ef4444" : "var(--primary)"}`,
            borderRadius: 12,
            padding: "10px 20px",
            color: "var(--foreground)",
            outline: "none",
            fontSize: "1.1rem",
            transition: "border-color 0.2s",
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            borderRadius: 12,
            padding: "10px 24px",
            cursor: "pointer",
            fontWeight: 700,
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          确认
        </button>
      </div>

      {feedback === "correct" && <p style={{ color: "#22c55e", fontWeight: 700 }}>✓ 正确！+10</p>}
      {feedback === "wrong" && <p style={{ color: "#ef4444", fontWeight: 700 }}>✗ 再试试！</p>}
    </div>
  );
}
