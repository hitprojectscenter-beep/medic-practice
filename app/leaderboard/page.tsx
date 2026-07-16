"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatsBar from "@/components/StatsBar";
import {
  LeaderboardEntry,
  RankInfo,
  buildLeaderboard,
  buildYourEntry,
  computeMyRank,
  fetchRealLeaderboard,
  formatLastActive,
  formatStudyTime,
  syncMyStats
} from "@/lib/leaderboard";
import { loadStats, GameStats } from "@/lib/gamification";
import { loadProfile, computeSkillLevel, computeTrend, computeTopicMastery, SkillLevel, TrendInfo, TopicMastery } from "@/lib/userProfile";

export default function LeaderboardPage() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
  const [shareToLeaderboard, setShareToLeaderboard] = useState(false);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [trend, setTrend] = useState<TrendInfo | null>(null);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = loadStats();
    setStats(s);
    const p = loadProfile();
    setSkillLevel(computeSkillLevel(p));
    setTrend(computeTrend(p));
    setTopicMastery(computeTopicMastery(p));

    const sharePref = localStorage.getItem("share-leaderboard") === "true";
    setShareToLeaderboard(sharePref);

    (async () => {
      const realUsers = sharePref ? await fetchRealLeaderboard() : [];
      const merged = buildLeaderboard(realUsers);
      setBoard(merged);
      setRankInfo(computeMyRank(merged));
      setLoading(false);

      // If sharing is on, upload our current stats
      if (sharePref) {
        const me = buildYourEntry();
        if (me) await syncMyStats(me);
      }
    })();
  }, []);

  const toggleSharing = async (on: boolean) => {
    setShareToLeaderboard(on);
    localStorage.setItem("share-leaderboard", on ? "true" : "false");
    if (on) {
      const me = buildYourEntry();
      if (me) await syncMyStats(me);
      const realUsers = await fetchRealLeaderboard();
      const merged = buildLeaderboard(realUsers);
      setBoard(merged);
      setRankInfo(computeMyRank(merged));
    } else {
      const merged = buildLeaderboard([]);
      setBoard(merged);
      setRankInfo(computeMyRank(merged));
    }
  };

  const myEntry = board.find(e => e.isYou);
  const top10 = board.slice(0, 10);
  // Show your row + 2 above + 2 below if you're not in top 10
  const youInTop10 = top10.some(e => e.isYou);
  let aroundYou: LeaderboardEntry[] = [];
  if (!youInTop10 && myEntry && rankInfo) {
    const idx = rankInfo.rank - 1;
    const start = Math.max(0, idx - 2);
    const end = Math.min(board.length, idx + 3);
    aroundYou = board.slice(start, end);
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span><span>חזרה</span>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div className="text-center fade-up">
          <div className="text-6xl mb-3 float-animation">🏆</div>
          <h1 className="text-3xl md:text-4xl font-black gradient-text-warm">דשבורד הישגים</h1>
          <p className="text-slate-600 mt-2">מיקומך בסרגל מול {board.length} משתמשים</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">טוען...</div>
        ) : (
          <>
            {/* Your rank hero */}
            {rankInfo && myEntry && (
              <div className="card fade-up bg-gradient-to-bl from-amber-50 via-yellow-50 to-orange-50 border-amber-300">
                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-center md:text-right">
                    <div className="text-xs text-amber-700 font-bold uppercase">המיקום שלך</div>
                    <div className="text-5xl md:text-6xl font-black text-amber-700 my-1">#{rankInfo.rank}</div>
                    <div className="text-sm text-slate-600">מתוך {rankInfo.totalUsers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-emerald-700 font-bold uppercase">אחוזון</div>
                    <div className="text-5xl md:text-6xl font-black text-emerald-700 my-1">
                      {rankInfo.percentile}%
                    </div>
                    <div className="text-sm text-slate-600">
                      טוב יותר מ-{rankInfo.betterThanCount} משתמשים
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-xs text-violet-700 font-bold uppercase">זמן השקעה</div>
                    <div className="text-3xl md:text-4xl font-black text-violet-700 my-1">
                      {formatStudyTime(myEntry.totalStudyTimeMs)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {myEntry.daysActive} ימי תרגול
                    </div>
                  </div>
                </div>

                {/* Progress bar - percentile */}
                <div className="mt-4">
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-emerald-500 to-amber-500 transition-all duration-1000 ease-out"
                      style={{ width: `${rankInfo.percentile}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-1 text-center">
                    {rankInfo.percentile >= 90 ? "🔥 אתה ב-10% המובילים!" :
                     rankInfo.percentile >= 75 ? "💪 רמה גבוהה" :
                     rankInfo.percentile >= 50 ? "👍 מעל הממוצע" :
                     rankInfo.percentile >= 25 ? "📚 עוד יש לאן לעלות" :
                     "🌱 רק התחלת - המשך לתרגל"}
                  </div>
                </div>
              </div>
            )}

            {/* My stats grid */}
            {myEntry && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
                <div className="card text-center bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
                  <div className="text-3xl mb-1">⚡</div>
                  <div className="text-xs text-slate-600 font-bold">XP</div>
                  <div className="text-2xl font-black text-violet-700">{myEntry.xp}</div>
                </div>
                <div className="card text-center bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                  <div className="text-3xl mb-1">🎯</div>
                  <div className="text-xs text-slate-600 font-bold">דיוק</div>
                  <div className="text-2xl font-black text-emerald-700">{myEntry.accuracy}%</div>
                </div>
                <div className="card text-center bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                  <div className="text-3xl mb-1">📝</div>
                  <div className="text-xs text-slate-600 font-bold">שאלות</div>
                  <div className="text-2xl font-black text-teal-700">{myEntry.questionsAnswered}</div>
                </div>
                <div className="card text-center bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                  <div className="text-3xl mb-1">📊</div>
                  <div className="text-xs text-slate-600 font-bold">ממוצע מבחנים</div>
                  <div className="text-2xl font-black text-amber-700">{myEntry.examScoresAvg}</div>
                </div>
              </div>
            )}

            {/* Skill level + trend cards */}
            {(skillLevel || trend) && (
              <div className="grid md:grid-cols-2 gap-3">
                {skillLevel && (
                  <div className="card flex items-center gap-3 bg-gradient-to-l from-violet-50 to-purple-50 border border-violet-200">
                    <div className="text-5xl">{skillLevel.emoji}</div>
                    <div className="flex-1">
                      <div className="text-xs text-violet-700 font-bold">רמת מיומנות</div>
                      <div className="font-extrabold text-xl text-violet-900">{skillLevel.title}</div>
                      <div className="text-xs text-violet-700">רמה {skillLevel.level}/5 · {skillLevel.description}</div>
                    </div>
                  </div>
                )}
                {trend && trend.direction !== "no-data" && (
                  <div className={`card flex items-center gap-3 ${
                    trend.direction === "up" ? "bg-emerald-50 border border-emerald-200" :
                    trend.direction === "down" ? "bg-red-50 border border-red-200" :
                    "bg-slate-50 border border-slate-200"
                  }`}>
                    <div className="text-5xl">
                      {trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➡️"}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">מגמת התקדמות</div>
                      <div className="font-extrabold text-xl">
                        {trend.direction === "up" ? "משתפר!" : trend.direction === "down" ? "ירידה קלה" : "יציב"}
                      </div>
                      <div className="text-xs">
                        {trend.delta > 0 ? "+" : ""}{trend.delta} נקודות · {trend.recentAvg}% ב-3 אחרונים
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Share toggle */}
            <div className="card bg-gradient-to-l from-indigo-50 to-blue-50 border border-indigo-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareToLeaderboard}
                  onChange={e => toggleSharing(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-indigo-900 flex items-center gap-2">
                    <span>🌐</span>
                    <span>השתתפות בדירוג חי</span>
                  </div>
                  <div className="text-xs text-indigo-700">
                    הסטטיסטיקות שלך יוצגו לדירוג מול משתמשים אחרים. בלי שיתוף - מוצגת התפלגות ייחוס.
                  </div>
                </div>
              </label>
            </div>

            {/* Leaderboard table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-xl flex items-center gap-2">
                  <span>🥇</span>
                  <span>טבלת המובילים</span>
                </h2>
                <span className="text-xs text-slate-500">{board.length} משתתפים</span>
              </div>

              <div className="space-y-2">
                {top10.map((e, i) => (
                  <LeaderboardRow key={e.userId} entry={e} position={i + 1} />
                ))}
                {!youInTop10 && aroundYou.length > 0 && (
                  <>
                    <div className="text-center text-slate-400 text-xs py-1">…</div>
                    {aroundYou.map((e, i) => {
                      const pos = (rankInfo!.rank - 2 + i) + 1 - 1; // approximate ordinal
                      const realPos = board.findIndex(b => b.userId === e.userId) + 1;
                      return <LeaderboardRow key={e.userId} entry={e} position={realPos} />;
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Topic mastery breakdown */}
            {topicMastery.filter(t => t.answered > 0).length > 0 && (
              <div className="card">
                <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2">
                  <span>📚</span>
                  <span>שליטה בנושאים</span>
                </h2>
                <div className="space-y-2">
                  {topicMastery
                    .filter(t => t.answered > 0)
                    .slice(0, 15)
                    .map(m => (
                      <div key={m.topic} className="text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              m.mastery === "strong" ? "bg-emerald-500" :
                              m.mastery === "developing" ? "bg-amber-500" : "bg-red-500"
                            }`} />
                            {m.topic}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            {m.correct}/{m.answered} ({Math.round(m.accuracy * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              m.mastery === "strong" ? "bg-emerald-500" :
                              m.mastery === "developing" ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.round(m.accuracy * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center pt-4">
          <Link href="/stats" className="btn-ghost text-sm">
            📊 לוח התקדמות מלא →
          </Link>
        </div>
      </div>
    </main>
  );
}

function LeaderboardRow({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;
  return (
    <div
      className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition ${
        entry.isYou
          ? "bg-gradient-to-l from-amber-100 to-yellow-100 border-amber-400 shadow-md"
          : position <= 3
          ? "bg-gradient-to-l from-slate-50 to-white border-slate-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="text-center w-10 shrink-0">
        {medal ? (
          <div className="text-2xl">{medal}</div>
        ) : (
          <div className={`text-sm font-black ${entry.isYou ? "text-amber-700" : "text-slate-500"}`}>
            #{position}
          </div>
        )}
      </div>
      <div className="text-2xl shrink-0">{entry.rankEmoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold truncate ${entry.isYou ? "text-amber-900" : "text-slate-900"}`}>
            {entry.username}
          </span>
          {entry.isYou && <span className="badge bg-amber-300 text-amber-900 text-[10px]">⭐ אני</span>}
          {entry.isGhost && <span className="text-[10px] text-slate-400">בוט</span>}
        </div>
        <div className="text-xs text-slate-500">
          {entry.rankTitle} · {entry.questionsAnswered} שאלות · {formatStudyTime(entry.totalStudyTimeMs)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-black text-lg ${entry.isYou ? "text-amber-700" : "text-violet-700"}`}>
          {entry.xp}
        </div>
        <div className="text-[10px] text-slate-500">XP · {entry.accuracy}%</div>
      </div>
    </div>
  );
}
