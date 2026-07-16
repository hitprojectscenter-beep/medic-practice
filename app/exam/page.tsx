"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions, shuffle } from "@/data/questions";
import { cases } from "@/data/cases";
import QuizCard from "@/components/QuizCard";
import AnamnesisCard from "@/components/AnamnesisCard";
import StatsBar from "@/components/StatsBar";
import AchievementToast from "@/components/AchievementToast";
import Celebration from "@/components/Celebration";
import { useGameStats } from "@/hooks/useGameStats";
import { correctEmoji, milestoneEmoji, wrongEmoji } from "@/lib/gamification";
import { recordAnswer, recordExam } from "@/lib/userProfile";
import { track } from "@/lib/track";

const EXAM_SIZE = 40;
const ANAMNESIS_PER_EXAM = 4;

type Item =
  | { kind: "quiz"; id: string }
  | { kind: "anamnesis"; id: string };

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<{ emoji: string; correct?: boolean } | null>(null);
  type WrongEntry = {
    qid: string;
    topic: string;
    question: string;
    options: string[];
    userAnswerIndex: number;
    correctIndex: number;
    explanation?: string;
  };
  const [quizStats, setQuizStats] = useState<{ correct: number; total: number; wrong: WrongEntry[] }>(
    { correct: 0, total: 0, wrong: [] }
  );
  const [anamnesisResults, setAnamnesisResults] = useState<{ caseId: string; score: number }[]>([]);
  const { stats, lastChange, onAnswer, onExamComplete, clearChange } = useGameStats();

  // Session is mutable to support skipping quiz items.
  // IMPORTANT: de-duplicated by id+kind so the same question/case never appears twice.
  const [session, setSession] = useState<Item[]>([]);
  const [seenQuizIds, setSeenQuizIds] = useState<Set<string>>(new Set());
  const [skippedCount, setSkippedCount] = useState(0);

  useEffect(() => {
    if (!started) {
      setSession([]);
      setSeenQuizIds(new Set());
      setSkippedCount(0);
      return;
    }
    const quizPool = shuffle(questions).slice(0, EXAM_SIZE - ANAMNESIS_PER_EXAM);
    const casePool = shuffle([...cases]).slice(0, ANAMNESIS_PER_EXAM);
    const mixed: Item[] = [
      ...quizPool.map(q => ({ kind: "quiz" as const, id: q.id })),
      ...casePool.map(c => ({ kind: "anamnesis" as const, id: c.id }))
    ];
    // De-duplicate (defense in depth)
    const seenKey = new Set<string>();
    const unique = shuffle(mixed).filter(it => {
      const key = `${it.kind}:${it.id}`;
      if (seenKey.has(key)) return false;
      seenKey.add(key);
      return true;
    });
    setSession(unique);
    setSeenQuizIds(new Set(quizPool.map(q => q.id)));
    setSkippedCount(0);
  }, [started]);

  const completed = started && index >= session.length;
  const [examStartTime, setExamStartTime] = useState<number>(0);

  // Replacement quiz questions for skip (excluding everything already seen).
  const quizReplacements = useMemo(() => {
    if (!started) return [];
    return questions.filter(q => !seenQuizIds.has(q.id));
  }, [started, seenQuizIds]);

  const handleSkipQuiz = () => {
    const current = session[index];
    if (!current || current.kind !== "quiz" || quizReplacements.length === 0) return;
    const replacement = quizReplacements[Math.floor(Math.random() * quizReplacements.length)];
    setSession(prev => {
      const next = [...prev];
      next[index] = { kind: "quiz", id: replacement.id };
      return next;
    });
    setSeenQuizIds(prev => {
      const next = new Set(prev);
      next.add(replacement.id);
      return next;
    });
    setSkippedCount(c => c + 1);
  };

  useEffect(() => {
    if (completed) {
      onExamComplete();
      // Record exam in user profile
      const totalScore = Math.round(
        (quizStats.total ? (quizStats.correct / quizStats.total) * 100 : 0) * 0.6 +
        (anamnesisResults.length ? anamnesisResults.reduce((s, r) => s + r.score, 0) / anamnesisResults.length : 0) * 0.4
      );
      recordExam({
        type: "exam",
        scorePercent: totalScore,
        questionsTotal: quizStats.total + anamnesisResults.length,
        questionsCorrect: quizStats.correct + anamnesisResults.filter(r => r.score >= 60).length,
        durationMs: examStartTime ? Date.now() - examStartTime : undefined
      });
      track({ type: "exam_completed", score: totalScore });
    }
  }, [completed, onExamComplete]);

  if (!started) {
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

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8 fade-up">
            <div className="text-6xl mb-3 float-animation">🎯</div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 gradient-text-warm">מבחן מעורב</h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              {EXAM_SIZE} שאלות מעורבות: {EXAM_SIZE - ANAMNESIS_PER_EXAM} אמריקאיות + {ANAMNESIS_PER_EXAM} אנמנזות קוליות. בונוס 50 XP בהשלמה!
            </p>
          </div>

          <div className="card space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 text-center border border-teal-100">
                <div className="text-3xl mb-1">📝</div>
                <div className="text-2xl font-black text-teal-700">{EXAM_SIZE - ANAMNESIS_PER_EXAM}</div>
                <div className="text-xs text-slate-600 font-medium">אמריקאיות</div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-center border border-indigo-100">
                <div className="text-3xl mb-1">🎙️</div>
                <div className="text-2xl font-black text-indigo-700">{ANAMNESIS_PER_EXAM}</div>
                <div className="text-xs text-slate-600 font-medium">אנמנזות</div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-center border border-amber-100">
                <div className="text-3xl mb-1">⏱️</div>
                <div className="text-2xl font-black text-amber-700">~40</div>
                <div className="text-xs text-slate-600 font-medium">דקות</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center">
              💡 סדר השאלות אקראי. תקבלו XP על כל תשובה + 50 XP בונוס בהשלמת המבחן.
            </div>
            <button onClick={() => { setStarted(true); setExamStartTime(Date.now()); }} className="btn-primary w-full text-lg">
              🚀 התחל מבחן
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (completed) {
    const quizPct = quizStats.total ? Math.round((quizStats.correct / quizStats.total) * 100) : 0;
    const anaPct = anamnesisResults.length ? Math.round(anamnesisResults.reduce((s, r) => s + r.score, 0) / anamnesisResults.length) : 0;
    const combined = Math.round((quizPct + anaPct) / 2);
    const verdict =
      combined >= 90 ? { emoji: "🏆", text: "מעולה - מקצועי!" } :
      combined >= 75 ? { emoji: "🥇", text: "ציון מצוין!" } :
      combined >= 60 ? { emoji: "🥈", text: "ציון טוב" } :
      combined >= 40 ? { emoji: "🥉", text: "סביר - יש עבודה" } :
      { emoji: "📚", text: "חזרה על החומר" };

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
            <div className="text-8xl mb-3 pop-in">{verdict.emoji}</div>
            <h2 className="text-3xl font-black mb-1">המבחן הסתיים!</h2>
            <p className="text-slate-600 mb-3">{verdict.text}</p>
            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                <div className="text-xs text-emerald-700 font-bold">ציון משולב</div>
                <div className="text-4xl font-black text-emerald-800">{combined}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                <div className="text-xs text-teal-700 font-bold">אמריקאיות</div>
                <div className="text-3xl font-black text-teal-800">{quizPct}%</div>
                <div className="text-xs text-slate-500">{quizStats.correct}/{quizStats.total}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                <div className="text-xs text-amber-700 font-bold">אנמנזות</div>
                <div className="text-3xl font-black text-amber-800">{anaPct}</div>
                <div className="text-xs text-slate-500">ממוצע</div>
              </div>
            </div>

            <div className="my-4 p-3 rounded-2xl bg-gradient-to-l from-amber-100 to-yellow-100 text-amber-900 font-bold inline-flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span>+50 XP בונוס מבחן!</span>
            </div>

            {quizStats.wrong.length > 0 && (
              <details className="text-right mt-4 group" open>
                <summary className="cursor-pointer btn-ghost text-sm font-bold mb-3">
                  📖 הצג שאלות שטעיתי בהן ({quizStats.wrong.length})
                </summary>
                <div className="mt-3 space-y-4 max-h-[500px] overflow-auto pr-1">
                  {quizStats.wrong.map((w, idx) => (
                    <div key={w.qid} className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-sm text-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="badge bg-red-100 text-red-700 text-xs shrink-0">
                          {idx + 1}/{quizStats.wrong.length}
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

            <div className="flex gap-3 justify-center flex-wrap mt-6">
              <button
                onClick={() => {
                  setStarted(false);
                  setIndex(0);
                  setQuizStats({ correct: 0, total: 0, wrong: [] });
                  setAnamnesisResults([]);
                }}
                className="btn-secondary"
              >
                🔄 מבחן נוסף
              </button>
              <Link href="/" className="btn-primary">🏠 סיום</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const item = session[index];
  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark">← יציאה</Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      {feedbackEmoji && (
        <Celebration
          change={lastChange}
          isCorrect={feedbackEmoji.correct}
          emoji={feedbackEmoji.emoji}
          onDone={() => {
            setFeedbackEmoji(null);
            clearChange();
          }}
        />
      )}
      <AchievementToast achievements={lastChange?.unlockedAchievements || []} onDone={clearChange} />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {item.kind === "quiz" ? (
          (() => {
            const q = questions.find(qq => qq.id === item.id)!;
            return (
              <QuizCard
                key={q.id}
                q={q}
                index={index}
                total={session.length}
                currentStreak={stats?.currentStreak || 0}
                showRevealButton={false}
                skippedCount={skippedCount}
                canSkip={quizReplacements.length > 0}
                onSkip={handleSkipQuiz}
                onAnswer={(selectedIdx, correct) => {
                  setQuizStats(s => ({
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
                  recordAnswer(q.id, correct);
                  setFeedbackEmoji({
                    emoji: correct ? correctEmoji((stats?.currentStreak || 0) + 1) : wrongEmoji(),
                    correct
                  });
                }}
                onNext={() => setIndex(i => i + 1)}
              />
            );
          })()
        ) : (
          (() => {
            const c = cases.find(cc => cc.id === item.id)!;
            return (
              <AnamnesisCard
                key={c.id}
                c={c}
                index={index}
                total={session.length}
                onComplete={({ feedback, safetyScore, diagnosisCorrect }) => {
                  if (feedback) {
                    const dxBonus = diagnosisCorrect === true ? 100 : diagnosisCorrect === false ? 0 : 50;
                    const combined = Math.round(feedback.score * 0.6 + safetyScore * 0.25 + dxBonus * 0.15);
                    setAnamnesisResults(r => [...r, { caseId: c.id, score: combined }]);
                    onAnswer({ kind: "anamnesis", topic: c.topic, correct: combined >= 60, scorePct: combined });
                    setFeedbackEmoji({ emoji: milestoneEmoji(combined) });
                  }
                }}
                onNext={() => setIndex(i => i + 1)}
              />
            );
          })()
        )}
      </div>
    </main>
  );
}
