"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { questions, topics, shuffle } from "@/data/questions";
import QuizCard from "@/components/QuizCard";
import StatsBar from "@/components/StatsBar";
import Celebration from "@/components/Celebration";
import AchievementToast from "@/components/AchievementToast";
import { useGameStats } from "@/hooks/useGameStats";
import { correctEmoji, wrongEmoji } from "@/lib/gamification";

const TOPIC_EMOJIS: Record<string, string> = {
  "תפקיד החובש": "🚑",
  "טרמינולוגיה רפואית": "📖",
  "אנטומיה ופיזיולוגיה": "🫀",
  "הערכת נפגע": "🩺",
  "החייאה ודפיברילטור": "⚡",
  "מערכת הנשימה": "🫁",
  "אסטמה": "💨",
  "אנפילקסיס": "⚠️",
  "מערכת הלב וכלי הדם": "❤️",
  "אוטם שריר הלב (ACS)": "💔",
  "אי ספיקת לב ובצקת ריאות": "💗",
  "אירוע מוחי": "🧠",
  "סוכרת": "🍬",
  "כוויות": "🔥",
  "טראומה": "🩹",
  "הכשות והרעלות": "🐍",
  "כאב בטן": "🤢",
  "ילדים, יילודים והריון": "👶",
  'אר"ן וטריאז\'': "🚨",
  "מתן תרופות ועירוי": "💉"
};

export default function QuizPracticePage() {
  const [topic, setTopic] = useState<string>("all");
  const [count, setCount] = useState<number>(10);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<{ emoji: string; correct: boolean } | null>(null);
  const [localStats, setLocalStats] = useState<{ correct: number; total: number; wrong: { qid: string; topic: string; question: string }[] }>(
    { correct: 0, total: 0, wrong: [] }
  );
  const { stats, lastChange, onAnswer, clearChange } = useGameStats();

  const session = useMemo(() => {
    if (!started) return [];
    const pool = topic === "all" ? questions : questions.filter(q => q.topic === topic);
    return shuffle(pool).slice(0, count);
  }, [started, topic, count]);

  if (!started) {
    return (
      <main className="min-h-screen pb-12">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
              <span>←</span>
              <span>חזרה</span>
            </Link>
            <StatsBar stats={stats} compact />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8 fade-up">
            <div className="text-6xl mb-3 float-animation">📝</div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 gradient-text">תרגול שאלות אמריקאיות</h1>
            <p className="text-slate-600">בחרו נושא וכמות שאלות, וצברו XP על כל תשובה נכונה!</p>
          </div>

          <div className="card space-y-5">
            <label className="block">
              <div className="text-sm font-extrabold mb-2 flex items-center gap-2">
                <span>🎯</span>
                <span>נושא</span>
              </div>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base font-medium focus:border-brand focus:outline-none transition pl-10"
              >
                <option value="all">🌟 כל הנושאים ({questions.length} שאלות)</option>
                {topics.map(t => {
                  const n = questions.filter(q => q.topic === t).length;
                  return (
                    <option key={t} value={t} disabled={n === 0}>
                      {TOPIC_EMOJIS[t] || "📌"} {t} ({n})
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-extrabold mb-2 flex items-center gap-2">
                <span>🔢</span>
                <span>כמה שאלות?</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 40].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`py-3 rounded-xl border-2 font-bold transition ${
                      count === n
                        ? "bg-gradient-to-l from-teal-500 to-cyan-500 text-white border-transparent shadow-lg shadow-teal-200"
                        : "bg-white border-slate-200 hover:border-teal-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </label>

            <button onClick={() => setStarted(true)} className="btn-primary w-full text-lg">
              🚀 התחל תרגול
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (index >= session.length) {
    const pct = localStats.total ? Math.round((localStats.correct / localStats.total) * 100) : 0;
    const verdict =
      pct >= 90 ? { emoji: "🏆", text: "מצוין!", color: "text-amber-600" } :
      pct >= 75 ? { emoji: "🥇", text: "כל הכבוד!", color: "text-emerald-600" } :
      pct >= 60 ? { emoji: "🥈", text: "טוב!", color: "text-blue-600" } :
      pct >= 40 ? { emoji: "🥉", text: "סביר", color: "text-amber-600" } :
      { emoji: "📚", text: "לחזור על החומר", color: "text-slate-600" };

    return (
      <main className="min-h-screen pb-12">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-sm font-bold text-brand-dark">← חזרה</Link>
            <StatsBar stats={stats} compact />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <div className="card text-center fade-up">
            <div className="text-8xl mb-4 pop-in">{verdict.emoji}</div>
            <h2 className="text-3xl font-black mb-2">{verdict.text}</h2>
            <div className={`text-5xl font-black my-4 ${verdict.color}`}>
              {pct}%
            </div>
            <p className="text-slate-600 mb-6">
              ענית נכון על <strong>{localStats.correct}</strong> מתוך <strong>{localStats.total}</strong> שאלות
            </p>

            {localStats.wrong.length > 0 && (
              <details className="text-right mb-6 group">
                <summary className="cursor-pointer btn-ghost text-sm font-bold">
                  📖 הצג שאלות שטעיתי בהן ({localStats.wrong.length})
                </summary>
                <div className="mt-3 space-y-1 max-h-60 overflow-auto text-sm">
                  {localStats.wrong.map(w => (
                    <div key={w.qid} className="p-2 rounded-lg bg-red-50 border border-red-100">
                      <span className="text-xs text-red-700 font-bold">[{w.topic}]</span> {w.question}
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => {
                  setIndex(0);
                  setLocalStats({ correct: 0, total: 0, wrong: [] });
                  setStarted(false);
                }}
                className="btn-secondary"
              >
                🔄 סבב נוסף
              </button>
              <Link href="/" className="btn-primary">🏠 חזרה לבית</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const q = session[index];
  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span>
            <span>יציאה</span>
          </Link>
          <div className="text-xs text-slate-600 font-bold">
            ✓ {localStats.correct} / {localStats.total}
          </div>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      <Celebration
        change={lastChange}
        isCorrect={feedbackEmoji?.correct}
        emoji={feedbackEmoji?.emoji}
        onDone={() => {
          setFeedbackEmoji(null);
          clearChange();
        }}
      />
      <AchievementToast achievements={lastChange?.unlockedAchievements || []} onDone={clearChange} />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <QuizCard
          q={q}
          index={index}
          total={session.length}
          currentStreak={stats?.currentStreak || 0}
          onAnswer={(_, correct) => {
            setLocalStats(s => ({
              correct: s.correct + (correct ? 1 : 0),
              total: s.total + 1,
              wrong: correct ? s.wrong : [...s.wrong, { qid: q.id, topic: q.topic, question: q.question }]
            }));
            onAnswer({ kind: "quiz", topic: q.topic, correct });
            setFeedbackEmoji({
              emoji: correct ? correctEmoji((stats?.currentStreak || 0) + 1) : wrongEmoji(),
              correct
            });
          }}
          onNext={() => setIndex(i => i + 1)}
        />
      </div>
    </main>
  );
}
