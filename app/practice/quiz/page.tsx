"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { questions, topics, shuffle } from "@/data/questions";
import QuizCard from "@/components/QuizCard";
import StatsBar from "@/components/StatsBar";
import Celebration from "@/components/Celebration";
import AchievementToast from "@/components/AchievementToast";
import { useGameStats } from "@/hooks/useGameStats";
import { correctEmoji, wrongEmoji } from "@/lib/gamification";
import { buildAdaptiveQuizPool, recordAnswer, recordExam } from "@/lib/userProfile";
import { track } from "@/lib/track";

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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">טוען...</div>}>
      <QuizPracticeInner />
    </Suspense>
  );
}

function QuizPracticeInner() {
  const params = useSearchParams();
  // Initial selection: support ?topics=a,b,c (multi) OR ?topic=x (single, legacy)
  const initialSelected = (() => {
    const multi = params?.get("topics");
    if (multi) {
      const arr = multi.split(",").map(t => decodeURIComponent(t.trim())).filter(t => topics.includes(t as any));
      return new Set(arr);
    }
    const single = params?.get("topic");
    if (single && single !== "all" && topics.includes(single as any)) {
      return new Set([single]);
    }
    return new Set<string>(); // empty = "all"
  })();
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(initialSelected);
  const [count, setCount] = useState<number>(10);
  const [adaptive, setAdaptive] = useState<boolean>(true);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<{ emoji: string; correct: boolean } | null>(null);
  // Track wrong answers with FULL detail: question, options, user's pick, correct, explanation
  type WrongEntry = {
    qid: string;
    topic: string;
    question: string;
    options: string[];
    userAnswerIndex: number;
    correctIndex: number;
    explanation?: string;
  };
  const [localStats, setLocalStats] = useState<{ correct: number; total: number; wrong: WrongEntry[] }>(
    { correct: 0, total: 0, wrong: [] }
  );
  // Session is now mutable state so we can swap questions when the user skips.
  const [session, setSession] = useState<typeof questions>([]);
  // IDs of every question that ever appeared OR was skipped — prevents duplicates.
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [skippedCount, setSkippedCount] = useState(0);
  const { stats, lastChange, onAnswer, clearChange } = useGameStats();

  // Sync topics if URL changes
  useEffect(() => {
    const multi = params?.get("topics");
    if (multi) {
      const arr = multi.split(",").map(t => decodeURIComponent(t.trim())).filter(t => topics.includes(t as any));
      if (arr.length > 0) setSelectedTopics(new Set(arr));
    } else {
      const t = params?.get("topic");
      if (t && topics.includes(t as any)) setSelectedTopics(new Set([t]));
    }
  }, [params]);

  // Filtered question pool based on selectedTopics (empty = all)
  const activePool = useMemo(() => {
    if (selectedTopics.size === 0) return questions;
    return questions.filter(q => selectedTopics.has(q.topic));
  }, [selectedTopics]);

  // Build the initial session whenever a new run starts.
  // Final safety: de-duplicate by id (Map keeps last value).
  useEffect(() => {
    if (!started) {
      setSession([]);
      setSeenIds(new Set());
      setSkippedCount(0);
      return;
    }
    const topicsArr = selectedTopics.size > 0 ? [...selectedTopics] : undefined;
    const built = adaptive
      ? buildAdaptiveQuizPool(count, undefined, topicsArr)
      : shuffle(activePool).slice(0, count);
    const unique = Array.from(new Map(built.map(q => [q.id, q])).values());
    setSession(unique);
    setSeenIds(new Set(unique.map(q => q.id)));
    setSkippedCount(0);
  }, [started, selectedTopics, count, adaptive, activePool]);

  // Pool of candidate questions for skips: everything in current pool NOT yet seen.
  const candidateReplacements = useMemo(() => {
    if (!started) return [];
    return activePool.filter(q => !seenIds.has(q.id));
  }, [started, activePool, seenIds]);

  const hasReplacementAvailable = candidateReplacements.length > 0;

  // Replace the current question with a fresh one from the candidate pool.
  // Guarantees no duplicates in the session.
  const handleSkip = () => {
    const current = session[index];
    if (!current || candidateReplacements.length === 0) return;
    const replacement = candidateReplacements[Math.floor(Math.random() * candidateReplacements.length)];
    setSession(prev => {
      const next = [...prev];
      next[index] = replacement;
      return next;
    });
    setSeenIds(prev => {
      const next = new Set(prev);
      next.add(replacement.id); // mark the new question as seen too
      return next;
    });
    setSkippedCount(c => c + 1);
    // Note: do NOT record this in localStats (skipped ≠ wrong)
    // Note: do NOT record this in profile (recordAnswer not called)
  };

  // Record exam result when finished
  useEffect(() => {
    if (started && index === session.length && session.length > 0) {
      const topicLabel =
        selectedTopics.size === 0
          ? undefined
          : selectedTopics.size === 1
          ? [...selectedTopics][0]
          : `${selectedTopics.size} נושאים`;
      recordExam({
        type: "quiz",
        topic: topicLabel,
        scorePercent: Math.round((localStats.correct / localStats.total) * 100),
        questionsTotal: localStats.total,
        questionsCorrect: localStats.correct,
        durationMs: startTime ? Date.now() - startTime : undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, index, session.length]);

  // Multi-select helpers
  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };
  const clearTopics = () => setSelectedTopics(new Set());
  const selectAllTopics = () => setSelectedTopics(new Set(topics));

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

          <div className="card space-y-6">
            {/* Multi-topic selection - tap to toggle each */}
            <div>
              <div className="text-sm font-extrabold mb-1 flex items-center gap-2">
                <span>🎯</span>
                <span>נושאים (לחצו כדי לבחור מספר נושאים)</span>
              </div>
              <div className="text-xs text-slate-500 mb-3 flex items-center justify-between gap-2">
                <span>
                  {selectedTopics.size === 0
                    ? `כל הנושאים (${questions.length} שאלות)`
                    : `${selectedTopics.size} נושאים נבחרו · ${activePool.length} שאלות`}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllTopics}
                    className="text-[11px] font-bold text-teal-700 underline decoration-dotted"
                  >
                    בחר הכל
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={clearTopics}
                    className="text-[11px] font-bold text-slate-500 underline decoration-dotted"
                  >
                    נקה
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={clearTopics}
                className={`w-full min-h-[52px] mb-2 px-3 py-3 rounded-2xl border-2 text-right font-bold text-sm transition flex items-center gap-2 ${
                  selectedTopics.size === 0
                    ? "bg-gradient-to-l from-teal-500 to-cyan-500 text-white border-transparent shadow-lg shadow-teal-200"
                    : "bg-white border-slate-200 active:scale-95 active:bg-teal-50"
                }`}
              >
                <span className="text-2xl">🌟</span>
                <span className="flex-1 text-right">כל הנושאים</span>
                <span className={`text-xs ${selectedTopics.size === 0 ? "text-white/90" : "text-slate-500"}`}>
                  {questions.length}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {topics.map(t => {
                  const n = questions.filter(q => q.topic === t).length;
                  const disabled = n === 0;
                  const selected = selectedTopics.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleTopic(t)}
                      className={`min-h-[58px] px-3 py-2.5 rounded-2xl border-2 text-right text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                        disabled
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : selected
                          ? "bg-gradient-to-l from-teal-500 to-cyan-500 text-white border-transparent shadow-md scale-[1.02]"
                          : "bg-white border-slate-200 active:scale-95 active:bg-teal-50"
                      }`}
                    >
                      <span className="text-xl shrink-0">{TOPIC_EMOJIS[t] || "📌"}</span>
                      <span className="flex-1 text-right leading-tight">{t}</span>
                      {selected && <span className="text-white text-lg">✓</span>}
                      <span className={`text-[10px] shrink-0 ${selected ? "text-white/90" : "text-slate-400"}`}>
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-extrabold mb-3 flex items-center gap-2">
                <span>🔢</span>
                <span>כמה שאלות?</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 40].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`min-h-[56px] text-lg rounded-2xl border-2 font-black transition ${
                      count === n
                        ? "bg-gradient-to-l from-teal-500 to-cyan-500 text-white border-transparent shadow-lg shadow-teal-200 scale-105"
                        : "bg-white border-slate-200 active:scale-95 active:bg-teal-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Adaptive toggle */}
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-l from-violet-50 to-purple-50 border border-violet-200 cursor-pointer">
              <input
                type="checkbox"
                checked={adaptive}
                onChange={e => setAdaptive(e.target.checked)}
                className="w-5 h-5 accent-violet-600"
              />
              <div className="flex-1">
                <div className="text-sm font-extrabold text-violet-900 flex items-center gap-1.5">
                  <span>🧠</span>
                  <span>תרגול אדפטיבי - מותאם לרמתי</span>
                </div>
                <div className="text-xs text-violet-700">
                  שאלות מנושאים שאתה צריך לחזק - לפי ההיסטוריה שלך
                </div>
              </div>
            </label>

            <button onClick={() => { setStarted(true); setStartTime(Date.now()); }} className="btn-primary w-full text-lg min-h-[56px]">
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
              <details className="text-right mb-6 group" open>
                <summary className="cursor-pointer btn-ghost text-sm font-bold mb-3">
                  📖 הצג שאלות שטעיתי בהן ({localStats.wrong.length})
                </summary>
                <div className="mt-3 space-y-4 max-h-[500px] overflow-auto pr-1">
                  {localStats.wrong.map((w, idx) => (
                    <div key={w.qid} className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-sm text-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="badge bg-red-100 text-red-700 text-xs shrink-0">
                          {idx + 1}/{localStats.wrong.length}
                        </span>
                        <span className="badge bg-slate-100 text-slate-600 text-xs shrink-0">
                          {w.topic}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 mb-3 leading-relaxed text-right">
                        {w.question}
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {w.options.map((opt, i) => {
                          const isUser = i === w.userAnswerIndex;
                          const isCorrect = i === w.correctIndex;
                          let cls = "border-slate-200 bg-slate-50 text-slate-600";
                          let badge = null;
                          if (isCorrect) {
                            cls = "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold";
                            badge = <span className="text-xs text-emerald-700 font-extrabold shrink-0">✓ נכונה</span>;
                          } else if (isUser) {
                            cls = "border-red-400 bg-red-50 text-red-900";
                            badge = <span className="text-xs text-red-700 font-extrabold shrink-0">✗ הבחירה שלך</span>;
                          }
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded-xl border ${cls} text-right`}
                            >
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-extrabold shrink-0 ${
                                isCorrect ? "bg-emerald-500 text-white" :
                                isUser ? "bg-red-500 text-white" :
                                "bg-slate-200 text-slate-600"
                              }`}>
                                {String.fromCharCode(1488 + i)}
                              </span>
                              <span className="flex-1 text-xs leading-relaxed">{opt}</span>
                              {badge}
                            </div>
                          );
                        })}
                      </div>
                      {w.explanation && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 text-right">
                          <div className="font-extrabold mb-1 flex items-center gap-1">
                            <span>💡</span>
                            <span>למה התשובה הנכונה היא {String.fromCharCode(1488 + w.correctIndex)}?</span>
                          </div>
                          <div className="leading-relaxed">{w.explanation}</div>
                        </div>
                      )}
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
          key={q.id}
          q={q}
          index={index}
          total={session.length}
          currentStreak={stats?.currentStreak || 0}
          skippedCount={skippedCount}
          canSkip={hasReplacementAvailable}
          onSkip={handleSkip}
          onAnswer={(selectedIdx, correct) => {
            setLocalStats(s => ({
              correct: s.correct + (correct ? 1 : 0),
              total: s.total + 1,
              wrong: correct ? s.wrong : [
                ...s.wrong,
                {
                  qid: q.id,
                  topic: q.topic,
                  question: q.question,
                  options: q.options,
                  userAnswerIndex: selectedIdx,
                  correctIndex: q.correctIndex,
                  explanation: q.explanation
                }
              ]
            }));
            onAnswer({ kind: "quiz", topic: q.topic, correct });
            track({ type: "question_answered", topic: q.topic, correct });
            recordAnswer(q.id, correct);
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
