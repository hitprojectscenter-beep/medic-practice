"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { questions } from "@/data/questions";
import { cases } from "@/data/cases";
import StatsBar from "@/components/StatsBar";
import { ACHIEVEMENTS, GameStats, getRank, loadStats } from "@/lib/gamification";

const TOPICS = ["מערכת העצבים", "מערכת הנשימה", "לב וכלי דם", "החייאה", "טראומה", "כוויות", "הכשות", "אנפילקסיס", "אסטמה", "סוכרת", "אי ספיקת לב", "אירוע מוחי", "הריון ולידה", "ילדים", "אר\"ן", "טרמינולוגיה"];

const TOPIC_EMOJIS: Record<string, string> = {
  "מערכת העצבים": "🧠",
  "מערכת הנשימה": "🫁",
  "לב וכלי דם": "❤️",
  "החייאה": "🫀",
  "טראומה": "🩹",
  "כוויות": "🔥",
  "הכשות": "🐍",
  "אנפילקסיס": "⚠️",
  "אסטמה": "💨",
  "סוכרת": "🍬",
  "אי ספיקת לב": "💗",
  "אירוע מוחי": "🧠",
  "הריון ולידה": "🤰",
  "ילדים": "👶",
  "אר\"ן": "🚨",
  "טרמינולוגיה": "📖"
};

export default function HomePage() {
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => setStats(loadStats()), []);

  const accuracy = stats && stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const unlockedCount = stats?.achievementsUnlocked.length || 0;
  const rank = getRank(stats?.level || 1);

  return (
    <main className="min-h-screen pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-3xl">🚑</span>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-base md:text-lg gradient-text">תרגול חובשים</span>
              <span className="text-[10px] md:text-xs text-slate-500">קורס רפואת חירום</span>
            </div>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-16 pb-10 text-center fade-up">
        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold mb-6 border border-brand/20 shadow-sm">
          <span className="float-animation">✨</span>
          <span className="gradient-text">תרגול חכם · בעברית מלאה · עם משוב AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          הכנה <span className="gradient-text">מנצחת</span> למבחן
          <br />
          וגם <span className="gradient-text-warm">לשטח</span>
        </h1>
        <p className="text-slate-600 text-base md:text-xl max-w-2xl mx-auto mb-7">
          {questions.length} שאלות · {cases.length} מקרי אנמנזה קוליים · משוב AI חכם · מערכת רמות והישגים
        </p>

        {/* Player card (if has progress) */}
        {stats && stats.totalAnswered > 0 ? (
          <div className="max-w-md mx-auto card-glass p-5 fade-up">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${rank.color}, ${rank.color}cc)`,
                  boxShadow: `0 10px 30px ${rank.color}40`
                }}
              >
                {rank.emoji}
              </div>
              <div className="flex-1 text-right">
                <div className="font-extrabold text-lg" style={{ color: rank.color }}>{rank.title}</div>
                <div className="text-sm text-slate-600">
                  רמה {stats.level} · {stats.xp} XP · דיוק {accuracy}%
                </div>
              </div>
              {stats.currentStreak >= 3 && (
                <div className="flex flex-col items-center bg-orange-50 rounded-2xl px-3 py-2">
                  <span className="text-2xl animate-pulse">🔥</span>
                  <span className="text-xs font-bold text-orange-700">{stats.currentStreak}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {/* Main practice cards */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 stagger">
          <Link
            href="/practice/quiz"
            className="card card-hover group relative overflow-hidden"
          >
            <div className="absolute -left-6 -top-6 text-9xl opacity-5 group-hover:opacity-10 transition">📝</div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-3xl mb-4 shadow-lg shadow-teal-200">
                📝
              </div>
              <h2 className="text-xl font-extrabold mb-2 group-hover:text-brand-dark">שאלות אמריקאיות</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {questions.length} שאלות לפי 20 נושאים. תשובות מיידיות עם הסבר, ואפשרות לחשוף תשובה.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-teal-700 font-bold">
                <span>התחל לתרגל</span>
                <span className="group-hover:-translate-x-1 transition">←</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/anamnesis"
            className="card card-hover group relative overflow-hidden"
          >
            <div className="absolute -left-6 -top-6 text-9xl opacity-5 group-hover:opacity-10 transition">🎙️</div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-3xl mb-4 shadow-lg shadow-indigo-200">
                🎙️
              </div>
              <h2 className="text-xl font-extrabold mb-2 group-hover:text-indigo-600">אנמנזה קולית</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                15 מקרים, האפליקציה מקריאה ואתם עונים בקול. משוב חכם ב-AI על מה כוסה.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-700 font-bold">
                <span>תרגל אנמנזה</span>
                <span className="group-hover:-translate-x-1 transition">←</span>
              </div>
            </div>
          </Link>

          <Link
            href="/exam"
            className="card card-hover group relative overflow-hidden"
          >
            <div className="absolute -left-6 -top-6 text-9xl opacity-5 group-hover:opacity-10 transition">🎯</div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-3xl mb-4 shadow-lg shadow-amber-200">
                🎯
              </div>
              <h2 className="text-xl font-extrabold mb-2 group-hover:text-amber-700">מבחן מעורב</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                40 שאלות בערבוב - אמריקאיות + אנמנזות. ציון, סיכום, ובונוס XP גדול בהשלמה.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 font-bold">
                <span>גש למבחן</span>
                <span className="group-hover:-translate-x-1 transition">←</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Achievements & Stats Strip */}
        {stats ? (
          <div className="mt-8 grid md:grid-cols-4 gap-3 stagger">
            <Link href="/stats" className="card card-hover text-center bg-gradient-to-br from-teal-50 to-cyan-50">
              <div className="text-3xl mb-1">📊</div>
              <div className="font-extrabold text-2xl text-teal-700">{stats.totalAnswered}</div>
              <div className="text-xs text-slate-600 font-medium">שאלות שעניתי</div>
            </Link>
            <Link href="/stats" className="card card-hover text-center bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="text-3xl mb-1">✅</div>
              <div className="font-extrabold text-2xl text-emerald-700">{accuracy}%</div>
              <div className="text-xs text-slate-600 font-medium">דיוק כללי</div>
            </Link>
            <Link href="/stats" className="card card-hover text-center bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="text-3xl mb-1">🔥</div>
              <div className="font-extrabold text-2xl text-orange-700">{stats.bestStreak}</div>
              <div className="text-xs text-slate-600 font-medium">רצף שיא</div>
            </Link>
            <Link href="/stats" className="card card-hover text-center bg-gradient-to-br from-yellow-50 to-amber-50">
              <div className="text-3xl mb-1">🏆</div>
              <div className="font-extrabold text-2xl text-amber-700">{unlockedCount}/{ACHIEVEMENTS.length}</div>
              <div className="text-xs text-slate-600 font-medium">הישגים</div>
            </Link>
          </div>
        ) : null}

        {/* How it works */}
        <section className="mt-12 grid md:grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">💡</div>
              <h3 className="font-extrabold text-xl">איך זה עובד?</h3>
            </div>
            <ol className="text-sm text-slate-700 space-y-2.5 list-none pr-0">
              {[
                "בוחרים מצב תרגול - שאלות, אנמנזה או מבחן מעורב",
                "במצב אנמנזה, האפליקציה מקריאה את המקרה בעברית",
                "לוחצים על המיקרופון ועונים בקול",
                "מקבלים משוב מפורט וצוברים XP, רצפים והישגים",
                "מתקדמים ברמות מ-חניך 🌱 עד אגדה רפואית 👑"
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📚</div>
              <h3 className="font-extrabold text-xl">נושאים בקורס</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <span key={t} className="badge bg-white border border-slate-200 text-slate-700 hover:border-brand transition cursor-default">
                  <span>{TOPIC_EMOJIS[t] || "📌"}</span>
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center">
          <Link href="/stats" className="btn-ghost text-sm">
            📊 לוח התקדמות והישגים →
          </Link>
          <div className="mt-3 text-xs text-slate-400">
            בהצלחה! זכרו - אין תחליף לאימון בשטח.
          </div>
        </footer>
      </section>
    </main>
  );
}
