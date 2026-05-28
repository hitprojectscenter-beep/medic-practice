"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS, GameStats, RANKS, getRank, getNextRank, loadStats, resetStats, xpToNextLevel } from "@/lib/gamification";
import StatsBar from "@/components/StatsBar";

export default function StatsPage() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => setStats(loadStats()), []);

  if (!stats) return null;

  const rank = getRank(stats.level);
  const nextRank = getNextRank(stats.level);
  const prog = xpToNextLevel(stats.xp);
  const accuracy = stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const unlockedSet = new Set(stats.achievementsUnlocked);

  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span><span>חזרה</span>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div className="text-center fade-up">
          <div className="text-6xl mb-3">📊</div>
          <h1 className="text-3xl md:text-4xl font-black gradient-text">לוח התקדמות</h1>
        </div>

        {/* Rank card */}
        <div className="card fade-up text-center"
             style={{
               background: `linear-gradient(135deg, ${rank.color}15 0%, ${rank.color}05 100%)`,
               borderColor: `${rank.color}40`
             }}>
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl text-6xl shadow-2xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${rank.color}, ${rank.color}cc)`,
              boxShadow: `0 20px 40px ${rank.color}50`
            }}
          >
            {rank.emoji}
          </div>
          <h2 className="text-3xl font-black mb-1" style={{ color: rank.color }}>
            {rank.title}
          </h2>
          <p className="text-slate-600">רמה {stats.level} · {stats.xp} XP</p>

          <div className="mt-5 max-w-md mx-auto">
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${prog.pct}%`,
                  background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`
                }}
              />
            </div>
            {nextRank ? (
              <div className="text-xs text-slate-600 mt-2">
                עוד <strong>{nextRank.minXp - stats.xp}</strong> XP עד {nextRank.title} {nextRank.emoji}
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-600 mt-2">🎉 הגעת לרמה המקסימלית!</div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
          <div className="card text-center bg-gradient-to-br from-teal-50 to-cyan-50">
            <div className="text-3xl mb-1">📝</div>
            <div className="font-black text-2xl text-teal-700">{stats.totalAnswered}</div>
            <div className="text-xs text-slate-600 font-medium">שאלות</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="text-3xl mb-1">✅</div>
            <div className="font-black text-2xl text-emerald-700">{accuracy}%</div>
            <div className="text-xs text-slate-600 font-medium">דיוק</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="text-3xl mb-1">🔥</div>
            <div className="font-black text-2xl text-orange-700">{stats.bestStreak}</div>
            <div className="text-xs text-slate-600 font-medium">רצף שיא</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-3xl mb-1">🎙️</div>
            <div className="font-black text-2xl text-indigo-700">{stats.totalAnamneses}</div>
            <div className="text-xs text-slate-600 font-medium">אנמנזות</div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card text-center bg-gradient-to-br from-yellow-50 to-amber-50">
            <div className="text-3xl mb-1">🎯</div>
            <div className="font-black text-xl text-amber-700">{stats.totalExamsPassed}</div>
            <div className="text-xs text-slate-600 font-medium">מבחנים שעברתי</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-pink-50 to-rose-50">
            <div className="text-3xl mb-1">📅</div>
            <div className="font-black text-xl text-pink-700">{stats.daysActive.length}</div>
            <div className="text-xs text-slate-600 font-medium">ימי תרגול</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-violet-50 to-purple-50">
            <div className="text-3xl mb-1">⚡</div>
            <div className="font-black text-xl text-violet-700">{stats.currentStreak}</div>
            <div className="text-xs text-slate-600 font-medium">רצף נוכחי</div>
          </div>
        </div>

        {/* Topic accuracy */}
        {Object.keys(stats.topicAccuracy).length > 0 && (
          <div className="card">
            <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
              <span>📚</span>
              <span>דיוק לפי נושא</span>
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.topicAccuracy)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([topic, data]) => {
                  const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
                  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={topic} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{topic}</span>
                        <span className="font-bold">
                          {data.correct}/{data.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="card">
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>הישגים ({stats.achievementsUnlocked.length}/{ACHIEVEMENTS.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedSet.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`p-3 rounded-2xl border-2 transition ${
                    unlocked
                      ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className={`text-3xl mb-1 ${unlocked ? "" : "grayscale"}`}>{a.emoji}</div>
                  <div className={`font-bold text-sm ${unlocked ? "text-amber-900" : "text-slate-600"}`}>
                    {a.title}
                  </div>
                  <div className={`text-xs ${unlocked ? "text-amber-700" : "text-slate-500"}`}>
                    {a.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranks ladder */}
        <div className="card">
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <span>🪜</span>
            <span>סולם הרמות</span>
          </h3>
          <div className="space-y-2">
            {RANKS.map(r => {
              const isCurrent = r.level === stats.level;
              const isUnlocked = stats.xp >= r.minXp;
              return (
                <div
                  key={r.level}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
                    isCurrent
                      ? "border-amber-400 bg-amber-50 shadow-md"
                      : isUnlocked
                      ? "bg-slate-50 border-slate-200"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: isUnlocked ? `${r.color}20` : "#f1f5f9" }}
                  >
                    {r.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-base" style={{ color: isUnlocked ? r.color : "#94a3b8" }}>
                      רמה {r.level} · {r.title}
                    </div>
                    <div className="text-xs text-slate-600">{r.minXp} XP</div>
                  </div>
                  {isCurrent && <span className="badge bg-amber-300 text-amber-900">⭐ נוכחי</span>}
                  {isUnlocked && !isCurrent && <span className="text-emerald-600">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="text-center">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn-ghost text-xs text-slate-400"
            >
              איפוס סטטיסטיקות
            </button>
          ) : (
            <div className="card max-w-md mx-auto bg-red-50 border-red-200">
              <div className="text-sm text-red-900 mb-3 font-bold">
                ⚠️ האם לאפס את כל הסטטיסטיקות?
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setStats(resetStats());
                    setShowResetConfirm(false);
                  }}
                  className="bg-red-500 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-red-600"
                >
                  כן, אפס
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
