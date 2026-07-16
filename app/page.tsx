"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { questions, topics as ALL_TOPICS } from "@/data/questions";
import { cases } from "@/data/cases";
import StatsBar from "@/components/StatsBar";
import { ACHIEVEMENTS, GameStats, getRank, loadStats } from "@/lib/gamification";
import {
  loadProfile,
  computeSkillLevel,
  computeTopicMastery,
  computeTrend,
  setUsername,
  UserProfile,
  SkillLevel,
  TrendInfo,
  TopicMastery
} from "@/lib/userProfile";

const TOPIC_EMOJIS: Record<string, string> = {
  "תפקיד החובש": "🚑",
  "טרמינולוגיה רפואית": "📖",
  "אנטומיה ופיזיולוגיה": "🫀",
  "הערכת נפגע": "🩺",
  "החייאה ודפיברילטור": "⚡",
  "מערכת הנשימה": "🫁",
  "אסטמה": "💨",
  "COPD ומחלות נשימה": "🚭",
  "תסחיף ריאתי": "🩸",
  "אנפילקסיס": "⚠️",
  "חנק וחסימת נתיב אוויר": "🫁",
  "מערכת הלב וכלי הדם": "❤️",
  "אוטם שריר הלב (ACS)": "💔",
  "אי ספיקת לב ובצקת ריאות": "💗",
  "אירוע מוחי": "🧠",
  "עילפון ופרכוסים": "😵",
  "סוכרת": "🍬",
  "כוויות": "🔥",
  "טראומה": "🩹",
  "הכשות והרעלות": "🐍",
  "כאב בטן": "🤢",
  "בטן חריפה ומערכת העיכול": "🍽️",
  "ילדים, יילודים והריון": "👶",
  "גריאטריה - קשישים": "👴",
  "סטורציה ומדדים חיוניים": "📊",
  "אר\"ן וטריאז'": "🚨",
  "מתן תרופות ועירוי": "💉"
};

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [trend, setTrend] = useState<TrendInfo | null>(null);
  const [weakTopics, setWeakTopics] = useState<TopicMastery[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  // Hide UI until we've decided whether to redirect to /welcome, so
  // first-time visitors never see a flash of the home page.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // First-visit redirect: send new users to the marketing page.
    if (typeof window !== "undefined" && !localStorage.getItem("has-seen-welcome")) {
      router.replace("/welcome");
      return;
    }
    setStats(loadStats());
    const p = loadProfile();
    setProfile(p);
    setNameInput(p.username);
    setSkillLevel(computeSkillLevel(p));
    setTrend(computeTrend(p));
    const mastery = computeTopicMastery(p);
    setWeakTopics(mastery.filter(m => m.answered > 0).slice(0, 3));
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">טוען...</div>
      </main>
    );
  }

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const p = setUsername(nameInput);
    setProfile(p);
    setEditingName(false);
  };

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

        {/* Player profile card */}
        {profile && (
          <div className="max-w-2xl mx-auto card-glass p-5 fade-up space-y-3">
            {/* Username row */}
            <div className="flex items-center gap-2 justify-center">
              {editingName ? (
                <>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="rounded-xl border-2 border-slate-200 px-3 py-1.5 text-sm font-medium focus:border-brand focus:outline-none max-w-[200px]"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="text-xs bg-emerald-500 text-white rounded-lg px-3 py-1.5 font-bold">שמור</button>
                  <button onClick={() => { setEditingName(false); setNameInput(profile.username); }} className="text-xs btn-ghost">ביטול</button>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-500">שלום,</span>
                  <span className="text-base font-extrabold text-slate-800">{profile.username}</span>
                  <button onClick={() => setEditingName(true)} className="text-xs text-slate-400 hover:text-brand">✏️ ערוך</button>
                </>
              )}
            </div>

            {/* Skill level + trend */}
            {skillLevel && (
              <div className="flex flex-wrap items-center gap-3 justify-center">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
                  <span className="text-2xl">{skillLevel.emoji}</span>
                  <div className="text-right">
                    <div className="text-xs text-violet-700 font-bold">רמה {skillLevel.level}</div>
                    <div className="text-sm font-extrabold text-violet-900">{skillLevel.title}</div>
                  </div>
                </div>
                {trend && trend.direction !== "no-data" && (
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
                    trend.direction === "up" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                    trend.direction === "down" ? "bg-red-50 border-red-200 text-red-700" :
                    "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    <span className="text-xl">
                      {trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➡️"}
                    </span>
                    <div className="text-xs">
                      <div className="font-bold">
                        {trend.direction === "up" ? "מגמת שיפור" : trend.direction === "down" ? "מגמת ירידה" : "מגמה יציבה"}
                      </div>
                      <div>
                        {trend.delta > 0 ? "+" : ""}{trend.delta} נקודות · {trend.recentAvg}% ב-3 אחרונים
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {skillLevel && (
              <p className="text-xs text-center text-slate-600 leading-relaxed">
                {skillLevel.description}
              </p>
            )}

            {/* Weak topics quick access */}
            {weakTopics.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2 text-center">
                  💪 נושאים לחיזוק (לחץ לתרגול מיידי):
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {weakTopics.map(t => (
                    <Link
                      key={t.topic}
                      href={`/practice/quiz?topic=${encodeURIComponent(t.topic)}`}
                      className={`badge active:scale-95 transition ${
                        t.mastery === "weak"
                          ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                          : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      <span>{TOPIC_EMOJIS[t.topic] || "📌"}</span>
                      <span>{t.topic}</span>
                      <span className="text-[10px] opacity-70">({Math.round(t.accuracy * 100)}%)</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game stats card (gamification) */}
        {stats && stats.totalAnswered > 0 ? (
          <div className="max-w-md mx-auto card-glass p-5 fade-up mt-4">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger">
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
                55 מקרים, האפליקציה מקריאה ואתם עונים בקול. משוב חכם ב-AI על מה כוסה.
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

          <Link
            href="/practice/scenario"
            className="card card-hover group relative overflow-hidden border-orange-200 bg-gradient-to-bl from-orange-50/40 to-amber-50/30"
          >
            <div className="absolute -left-6 -top-6 text-9xl opacity-5 group-hover:opacity-10 transition">🚨</div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 text-white text-3xl mb-4 shadow-lg shadow-orange-200">
                🚨
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <h2 className="text-xl font-extrabold group-hover:text-orange-600">מקרים ותגובות</h2>
                <span className="badge bg-red-100 text-red-700 text-[10px] font-extrabold">חדש!</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                34 תרחישי שטח PHTLS מלאים - 7 שלבים מקליטה לפינוי. מקרים, מדדים, טיפול.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-700 font-bold">
                <span>תרגל תרחיש</span>
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
              <h3 className="font-extrabold text-xl">בחרו נושא לתרגול ממוקד</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">לחיצה על נושא תפתח תרגול ממוקד בו 🎯</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TOPICS.map(t => {
                const n = questions.filter(q => q.topic === t).length;
                if (n === 0) return null;
                return (
                  <Link
                    key={t}
                    href={`/practice/quiz?topic=${encodeURIComponent(t)}`}
                    className="badge bg-white border border-slate-200 text-slate-700 hover:border-brand hover:bg-brand/5 hover:text-brand-dark active:scale-95 transition inline-flex items-center gap-1.5"
                  >
                    <span>{TOPIC_EMOJIS[t] || "📌"}</span>
                    <span>{t}</span>
                    <span className="text-[10px] text-slate-400">({n})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center space-y-2">
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/games/abdomen" className="btn-primary text-sm bg-gradient-to-l from-violet-500 to-purple-500">
              🎮 משחק רבעי הבטן →
            </Link>
            <Link href="/leaderboard" className="btn-primary text-sm">
              🏆 דשבורד ודירוג →
            </Link>
            <Link href="/stats" className="btn-ghost text-sm">
              📊 לוח התקדמות →
            </Link>
            <Link
              href="/welcome"
              className="btn-ghost text-sm inline-flex items-center gap-1.5"
              title="הכירו את האפליקציה, פרטי המפתח וטיפים לשימוש"
            >
              <span>ℹ️</span>
              <span>אודות היישום</span>
            </Link>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            בהצלחה! זכרו - אין תחליף לאימון בשטח.
          </div>
        </footer>
      </section>
    </main>
  );
}
