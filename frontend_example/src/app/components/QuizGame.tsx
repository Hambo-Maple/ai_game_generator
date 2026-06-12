import { useState } from "react";

function generateQuestions(sentence: string) {
  const words = sentence.split(/\s+/).filter((w) => w.length > 1);
  const questions = [];

  // Q1: Word count
  questions.push({
    question: `句子 "${sentence.slice(0, 40)}..." 共有多少个单词？`,
    options: [
      words.length - 2,
      words.length - 1,
      words.length,
      words.length + 1,
    ].map(String),
    answer: String(words.length),
  });

  // Q2: First word
  const firstWord = words[0] || "?";
  const fakeWords = words.filter((w) => w !== firstWord).slice(0, 3);
  while (fakeWords.length < 3) fakeWords.push("???");
  const opts2 = [firstWord, ...fakeWords.slice(0, 3)].sort(() => Math.random() - 0.5);
  questions.push({
    question: "句子的第一个单词是什么？",
    options: opts2,
    answer: firstWord,
  });

  // Q3: Last word
  const lastWord = words[words.length - 1] || "?";
  const fakeWords2 = words.filter((w) => w !== lastWord).slice(0, 3);
  while (fakeWords2.length < 3) fakeWords2.push("???");
  const opts3 = [lastWord, ...fakeWords2.slice(0, 3)].sort(() => Math.random() - 0.5);
  questions.push({
    question: "句子的最后一个单词是什么？",
    options: opts3,
    answer: lastWord,
  });

  // Q4: Character count
  const charCount = sentence.replace(/\s/g, "").length;
  questions.push({
    question: "去掉空格后，句子共有多少个字符？",
    options: [charCount - 3, charCount - 1, charCount, charCount + 2].map(String),
    answer: String(charCount),
  });

  return questions;
}

export function QuizGame({ sentence }: { sentence: string }) {
  const questions = generateQuestions(sentence);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function select(opt: string) {
    if (chosen) return;
    setChosen(opt);
    if (opt === questions[current].answer) setScore((s) => s + 25);
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true);
      else { setCurrent((c) => c + 1); setChosen(null); }
    }, 900);
  }

  function restart() {
    setCurrent(0); setScore(0); setChosen(null); setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div style={{ fontSize: "3.5rem" }}>{score >= 75 ? "🏆" : score >= 50 ? "🥈" : "🥉"}</div>
        <h3 style={{ color: "var(--accent)" }}>答题完成！得分：{score}/100</h3>
        <p style={{ color: "var(--muted-foreground)" }}>{score >= 75 ? "你的记忆力很强！" : score >= 50 ? "还不错！" : "继续加油！"}</p>
        <button onClick={restart} style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 12, padding: "10px 28px", cursor: "pointer", fontWeight: 700 }}>
          再来一次
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="flex flex-col gap-6 py-4 w-full max-w-md mx-auto">
      <div className="flex gap-4 items-center">
        <span style={{ color: "var(--muted-foreground)" }}>第 {current + 1} / {questions.length} 题</span>
        <div style={{ flex: 1, height: 6, background: "var(--secondary)", borderRadius: 99 }}>
          <div style={{ height: "100%", borderRadius: 99, background: "var(--primary)", width: `${((current) / questions.length) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>得分：{score}</span>
      </div>

      <div style={{ background: "var(--secondary)", border: "2px solid var(--primary)", borderRadius: 16, padding: "20px 24px" }}>
        <p style={{ color: "var(--foreground)", lineHeight: 1.7 }}>{q.question}</p>
      </div>

      <div className="flex flex-col gap-3">
        {q.options.map((opt) => {
          let bg = "var(--input-background)";
          let border = "var(--border)";
          let color = "var(--foreground)";
          if (chosen) {
            if (opt === q.answer) { bg = "rgba(34,197,94,0.15)"; border = "#22c55e"; color = "#22c55e"; }
            else if (opt === chosen && opt !== q.answer) { bg = "rgba(239,68,68,0.15)"; border = "#ef4444"; color = "#ef4444"; }
          }
          return (
            <button
              key={opt}
              onClick={() => select(opt)}
              style={{
                background: bg, border: `2px solid ${border}`, borderRadius: 12,
                padding: "12px 20px", cursor: chosen ? "default" : "pointer",
                color, textAlign: "left", fontWeight: chosen && opt === q.answer ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
