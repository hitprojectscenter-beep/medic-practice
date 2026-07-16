"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import StatsBar from "@/components/StatsBar";
import { loadStats, GameStats } from "@/lib/gamification";

// ============ Game data ============
type Quadrant = "RUQ" | "LUQ" | "RLQ" | "LLQ";

type Organ = {
  id: string;
  name: string;
  quadrant: Quadrant;
  emoji: string;
};

// Spec from user — some organs appear in multiple quadrants (separate cards)
const ORGANS: Organ[] = [
  // RUQ
  { id: "liver", name: "כבד", quadrant: "RUQ", emoji: "🟫" },
  { id: "gallbladder", name: "כיס מרה", quadrant: "RUQ", emoji: "🟢" },
  { id: "pancreas-head", name: "ראש הלבלב", quadrant: "RUQ", emoji: "🥚" },
  { id: "transverse-colon-r", name: "מעי גס רוחבי - ימין", quadrant: "RUQ", emoji: "🟠" },
  { id: "right-kidney", name: "כליה ימנית", quadrant: "RUQ", emoji: "🫘" },
  // LUQ
  { id: "spleen", name: "טחול", quadrant: "LUQ", emoji: "🟣" },
  { id: "pancreas-tail", name: "זנב הלבלב", quadrant: "LUQ", emoji: "🥚" },
  { id: "stomach", name: "קיבה", quadrant: "LUQ", emoji: "🟡" },
  { id: "transverse-colon-l", name: "מעי גס רוחבי - שמאל", quadrant: "LUQ", emoji: "🟠" },
  { id: "left-kidney", name: "כליה שמאלית", quadrant: "LUQ", emoji: "🫘" },
  // RLQ
  { id: "small-intestine-r", name: "מעי דק - ימין", quadrant: "RLQ", emoji: "🌀" },
  { id: "ascending-colon", name: "מעי גס עולה", quadrant: "RLQ", emoji: "🟧" },
  { id: "appendix", name: "תוספתן", quadrant: "RLQ", emoji: "📍" },
  { id: "right-ovary", name: "שחלה וחצוצרה ימניים", quadrant: "RLQ", emoji: "🌸" },
  // LLQ
  { id: "small-intestine-l", name: "מעי דק - שמאל", quadrant: "LLQ", emoji: "🌀" },
  { id: "descending-colon", name: "מעי גס יורד", quadrant: "LLQ", emoji: "🟧" },
  { id: "left-ovary", name: "שחלה וחצוצרה שמאליים", quadrant: "LLQ", emoji: "🌸" },
  { id: "sigmoid", name: "סיגמואיד", quadrant: "LLQ", emoji: "〰️" }
];

const QUADRANT_LABELS: Record<Quadrant, { hebrew: string; short: string; color: string; bg: string }> = {
  RUQ: { hebrew: "רביע ימין עליון", short: "RUQ", color: "#0E7C7B", bg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)" },
  LUQ: { hebrew: "רביע שמאל עליון", short: "LUQ", color: "#7C3AED", bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)" },
  RLQ: { hebrew: "רביע ימין תחתון", short: "RLQ", color: "#D97706", bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" },
  LLQ: { hebrew: "רביע שמאל תחתון", short: "LLQ", color: "#DB2777", bg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)" }
};

// Anatomical view: looking at patient from front
// Patient's RIGHT = viewer's LEFT side
// So RUQ goes top-LEFT, LUQ goes top-RIGHT
const QUADRANT_POSITIONS: Record<Quadrant, { gridArea: string }> = {
  RUQ: { gridArea: "1 / 2" }, // top-left in viewer's view (= patient right top)
  LUQ: { gridArea: "1 / 1" }, // top-right in viewer's view (= patient left top)
  RLQ: { gridArea: "2 / 2" }, // bottom-left
  LLQ: { gridArea: "2 / 1" }  // bottom-right
};

// ============ Component ============
type PlacedLabel = { id: string; name: string; quadrant: Quadrant };

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function AbdomenGamePage() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [remaining, setRemaining] = useState<Organ[]>([]);
  const [placed, setPlaced] = useState<PlacedLabel[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hoverQuadrant, setHoverQuadrant] = useState<Quadrant | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [showLearn, setShowLearn] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "correct" | "wrong"; text: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const quadrantRefs = useRef<Record<Quadrant, HTMLDivElement | null>>({ RUQ: null, LUQ: null, RLQ: null, LLQ: null });

  useEffect(() => {
    setStats(loadStats());
    setRemaining(shuffle(ORGANS));
  }, []);

  const total = ORGANS.length;
  const done = total - remaining.length;
  const won = remaining.length === 0;
  const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;

  // ============ Pointer-based drag (works on touch + mouse + pen) ============
  const handlePointerDown = (e: React.PointerEvent, organ: Organ) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(organ.id);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    // Detect which quadrant we're over
    let foundQ: Quadrant | null = null;
    for (const q of Object.keys(quadrantRefs.current) as Quadrant[]) {
      const el = quadrantRefs.current[q];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        foundQ = q;
        break;
      }
    }
    setHoverQuadrant(foundQ);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const organ = ORGANS.find(o => o.id === draggingId);
    const target = hoverQuadrant;
    if (organ && target) {
      if (organ.quadrant === target) {
        setScore(s => s + 10);
        setPlaced(p => [...p, { id: organ.id, name: organ.name, quadrant: organ.quadrant }]);
        setRemaining(r => r.filter(o => o.id !== organ.id));
        flashFeedback("correct", `מצוין! ${organ.name} ב-${QUADRANT_LABELS[target].short}`);
      } else {
        setMistakes(m => m + 1);
        flashFeedback("wrong", `לא נכון. ${organ.name} שייך ל-${QUADRANT_LABELS[organ.quadrant].short}`);
      }
    }
    setDraggingId(null);
    setDragPos(null);
    setHoverQuadrant(null);
  };

  const flashFeedback = (kind: "correct" | "wrong", text: string) => {
    setFeedback({ kind, text });
    setTimeout(() => setFeedback(null), 1800);
  };

  const reset = () => {
    setRemaining(shuffle(ORGANS));
    setPlaced([]);
    setScore(0);
    setMistakes(0);
    setShowLearn(false);
  };

  // ============ Render ============
  return (
    <main className="min-h-screen pb-12" style={{ background: "linear-gradient(180deg, #f0fdfa 0%, #eff6ff 100%)" }}>
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span><span>חזרה</span>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Title */}
        <div className="text-center mb-6 fade-up">
          <div className="text-5xl mb-2">🫁</div>
          <h1 className="text-2xl md:text-3xl font-black mb-1 gradient-text">משחק רבעי הבטן</h1>
          <p className="text-slate-600 text-sm">גרור את האיברים לרביע הנכון</p>
        </div>

        {/* HUD: score, mistakes, progress */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card text-center bg-gradient-to-br from-teal-50 to-cyan-50 py-3">
            <div className="text-xs text-teal-700 font-bold">ניקוד</div>
            <div className="text-2xl font-black text-teal-700">{score}</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-orange-50 to-amber-50 py-3">
            <div className="text-xs text-amber-700 font-bold">טעויות</div>
            <div className="text-2xl font-black text-amber-700">{mistakes}</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-purple-50 to-pink-50 py-3">
            <div className="text-xs text-purple-700 font-bold">התקדמות</div>
            <div className="text-2xl font-black text-purple-700">{done}/{total}</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>

        {won ? (
          <VictoryScreen score={score} mistakes={mistakes} stars={stars} onReplay={reset} />
        ) : (
          <>
            {/* Game board - abdomen with 4 quadrants */}
            <div
              ref={boardRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative mx-auto mb-6"
              style={{ maxWidth: 460, touchAction: draggingId ? "none" : "auto" }}
            >
              {/* Abdomen silhouette (SVG) */}
              <svg
                viewBox="0 0 400 460"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
              >
                {/* Torso outline */}
                <path
                  d="M 100,30 Q 60,40 50,90 L 40,200 Q 30,310 60,410 Q 100,450 200,452 Q 300,450 340,410 Q 370,310 360,200 L 350,90 Q 340,40 300,30 Q 250,20 200,22 Q 150,20 100,30 Z"
                  fill="#FED7AA"
                  stroke="#9A3412"
                  strokeWidth="3"
                  opacity="0.4"
                />
                {/* Belly button */}
                <circle cx="200" cy="240" r="6" fill="#9A3412" opacity="0.6" />
                {/* Quadrant dividers */}
                <line x1="200" y1="60" x2="200" y2="430" stroke="#1F2937" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                <line x1="50" y1="240" x2="350" y2="240" stroke="#1F2937" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
              </svg>

              {/* 2×2 quadrant grid overlay */}
              <div
                className="relative grid grid-cols-2 grid-rows-2 gap-2"
                style={{ height: 460 }}
              >
                {(["LUQ", "RUQ", "LLQ", "RLQ"] as Quadrant[]).map(q => {
                  const placedInThis = placed.filter(p => p.quadrant === q);
                  const isHover = hoverQuadrant === q;
                  return (
                    <div
                      key={q}
                      ref={el => { quadrantRefs.current[q] = el; }}
                      className={`relative rounded-2xl border-2 transition-all flex flex-col items-stretch justify-start p-2 overflow-hidden ${
                        isHover
                          ? "border-emerald-500 scale-[1.02] shadow-lg shadow-emerald-200"
                          : "border-slate-300 border-dashed"
                      }`}
                      style={{ background: isHover ? `${QUADRANT_LABELS[q].color}30` : QUADRANT_LABELS[q].bg }}
                    >
                      {/* Quadrant header */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                          style={{ background: QUADRANT_LABELS[q].color, color: "white" }}
                        >
                          {QUADRANT_LABELS[q].short}
                        </span>
                        <span className="text-[10px] text-slate-600 font-bold">
                          {QUADRANT_LABELS[q].hebrew}
                        </span>
                      </div>
                      {/* Placed organ labels */}
                      <div className="flex flex-wrap gap-1">
                        {placedInThis.map(p => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-white/90 rounded-md px-1.5 py-0.5 font-medium border"
                            style={{ borderColor: QUADRANT_LABELS[q].color, color: QUADRANT_LABELS[q].color }}
                          >
                            ✓ {p.name.replace(" - ימין", "").replace(" - שמאל", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghost drag preview */}
              {draggingId && dragPos && (() => {
                const org = ORGANS.find(o => o.id === draggingId)!;
                return (
                  <div
                    className="fixed pointer-events-none z-50 px-3 py-2 rounded-xl bg-white shadow-2xl border-2 border-teal-500 font-bold text-sm"
                    style={{
                      left: dragPos.x,
                      top: dragPos.y,
                      transform: "translate(-50%, -50%)",
                      direction: "rtl"
                    }}
                  >
                    {org.emoji} {org.name}
                  </div>
                );
              })()}
            </div>

            {/* Organ cards pool */}
            <div className="card">
              <div className="text-sm font-extrabold mb-2 flex items-center gap-2">
                <span>🃏</span>
                <span>איברים ({remaining.length} נותרו)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {remaining.map(o => (
                  <button
                    key={o.id}
                    onPointerDown={e => handlePointerDown(e, o)}
                    className={`text-right rounded-xl border-2 px-3 py-2.5 font-bold text-sm bg-white transition-all flex items-center gap-2 ${
                      draggingId === o.id
                        ? "opacity-30 border-teal-500"
                        : "border-slate-200 hover:border-teal-400 active:scale-95"
                    }`}
                    style={{ touchAction: "none", cursor: "grab" }}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <span className="flex-1">{o.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              <button onClick={reset} className="btn-ghost text-sm">
                🔄 התחל מחדש
              </button>
              <button onClick={() => setShowLearn(s => !s)} className="btn-ghost text-sm">
                {showLearn ? "🙈 הסתר" : "📖 מצב לימוד"}
              </button>
            </div>

            {/* Learn mode */}
            {showLearn && (
              <div className="card mt-4 fade-up">
                <h3 className="font-extrabold text-base mb-3 flex items-center gap-2">
                  <span>📚</span>
                  <span>איברים לפי רביע</span>
                </h3>
                {(["RUQ", "LUQ", "RLQ", "LLQ"] as Quadrant[]).map(q => (
                  <div key={q} className="mb-3 last:mb-0">
                    <div
                      className="text-xs font-extrabold mb-1 inline-block px-2 py-0.5 rounded-full"
                      style={{ background: QUADRANT_LABELS[q].color, color: "white" }}
                    >
                      {QUADRANT_LABELS[q].short} · {QUADRANT_LABELS[q].hebrew}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ORGANS.filter(o => o.quadrant === q).map(o => (
                        <span
                          key={o.id}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-medium"
                        >
                          {o.emoji} {o.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Floating feedback */}
        {feedback && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-50 pop-in px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm max-w-xs text-center"
            style={{
              bottom: "20%",
              background: feedback.kind === "correct" ? "#10B981" : "#EF4444",
              color: "white"
            }}
          >
            {feedback.kind === "correct" ? "✅" : "❌"} {feedback.text}
          </div>
        )}
      </div>
    </main>
  );
}

function VictoryScreen({ score, mistakes, stars, onReplay }: { score: number; mistakes: number; stars: number; onReplay: () => void }) {
  return (
    <div className="card text-center fade-up bg-gradient-to-bl from-amber-50 via-yellow-50 to-orange-50 border-amber-300">
      <div className="text-7xl mb-3 pop-in">{stars === 3 ? "🏆" : stars === 2 ? "🥇" : "🥉"}</div>
      <h2 className="text-3xl font-black mb-2 gradient-text-warm">סיימת!</h2>
      <div className="flex justify-center gap-1 my-4 text-4xl">
        {[1, 2, 3].map(i => (
          <span key={i} className={i <= stars ? "" : "opacity-20"}>⭐</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 my-5">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <div className="text-xs text-slate-500 font-bold">ניקוד</div>
          <div className="text-2xl font-black text-teal-700">{score}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <div className="text-xs text-slate-500 font-bold">טעויות</div>
          <div className="text-2xl font-black text-amber-700">{mistakes}</div>
        </div>
      </div>
      <p className="text-slate-600 text-sm mb-4">
        {stars === 3 ? "מושלם! כל האיברים במקום הנכון בלי טעויות. 🎯" :
         stars === 2 ? "כל הכבוד! עוד תרגול ותהיה מושלם." :
         "סיימת בהצלחה. נסה שוב לשפר את הציון!"}
      </p>
      <div className="flex justify-center gap-2 flex-wrap">
        <button onClick={onReplay} className="btn-primary">🔄 שחק שוב</button>
        <Link href="/" className="btn-ghost">🏠 חזרה לבית</Link>
      </div>
    </div>
  );
}
