import { useState, useEffect } from "react";

const EMOJI_SETS: Record<string, string[]> = {
  animal: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
  food: ["🍎", "🍕", "🍔", "🌮", "🍜", "🍣", "🍩", "🧁"],
  nature: ["🌲", "🌸", "🌊", "⭐", "🌙", "☀️", "🌈", "🍀"],
  space: ["🚀", "🛸", "🌍", "💫", "🌟", "🪐", "☄️", "👽"],
  sport: ["⚽", "🏀", "🎾", "🏓", "🥊", "🎯", "🏆", "🎮"],
  default: ["🎲", "🎴", "🃏", "🎰", "🎭", "🎨", "🎬", "🎤"],
};

function detectTheme(sentence: string): string {
  const s = sentence.toLowerCase();
  if (/dog|cat|animal|bird|fish|bear|lion|tiger|wolf|rabbit/.test(s)) return "animal";
  if (/food|eat|pizza|burger|cake|cook|restaurant|meal/.test(s)) return "food";
  if (/tree|flower|ocean|star|moon|sun|nature|forest|rain/.test(s)) return "nature";
  if (/space|rocket|star|planet|galaxy|cosmos|universe|alien/.test(s)) return "space";
  if (/sport|game|ball|run|play|team|win|race/.test(s)) return "sport";
  return "default";
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export function MemoryCardGame({ sentence }: { sentence: string }) {
  const theme = detectTheme(sentence);
  const emojis = EMOJI_SETS[theme].slice(0, 6);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  function initCards() {
    const doubled = [...emojis, ...emojis]
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5)
      .map((c, i) => ({ ...c, id: i }));
    setCards(doubled);
    setSelected([]);
    setMoves(0);
    setWon(false);
  }

  useEffect(() => { initCards(); }, [sentence]);

  function flip(id: number) {
    if (selected.length === 2) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected;
      if (newCards[a].emoji === newCards[b].emoji) {
        const matched = newCards.map((c) => newSelected.includes(c.id) ? { ...c, matched: true } : c);
        setCards(matched);
        setSelected([]);
        if (matched.every((c) => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSelected.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
      }
    }
  }

  const themeLabels: Record<string, string> = {
    animal: "动物主题", food: "美食主题", nature: "自然主题",
    space: "宇宙主题", sport: "运动主题", default: "游戏主题"
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex gap-6 items-center">
        <span style={{ color: "var(--muted-foreground)" }}>主题：<span style={{ color: "var(--accent)", fontWeight: 700 }}>{themeLabels[theme]}</span></span>
        <span style={{ color: "var(--muted-foreground)" }}>翻牌：<span style={{ color: "#22d3ee", fontWeight: 700 }}>{moves}</span></span>
      </div>

      {won ? (
        <div className="flex flex-col items-center gap-4">
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <h3 style={{ color: "var(--accent)" }}>太棒了！用了 {moves} 次翻牌完成！</h3>
          <button onClick={initCards} style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 12, padding: "10px 28px", cursor: "pointer", fontWeight: 700 }}>
            再玩一次
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                border: `2px solid ${card.matched ? "#22c55e" : card.flipped ? "var(--accent)" : "var(--border)"}`,
                background: card.flipped || card.matched ? "var(--secondary)" : "var(--input-background)",
                fontSize: "2rem",
                cursor: card.matched ? "default" : "pointer",
                transition: "all 0.2s",
                boxShadow: card.flipped ? "0 0 20px rgba(245,158,11,0.4)" : "none",
                transform: card.flipped || card.matched ? "scale(1.05)" : "scale(1)",
              }}
            >
              {card.flipped || card.matched ? card.emoji : "❓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
