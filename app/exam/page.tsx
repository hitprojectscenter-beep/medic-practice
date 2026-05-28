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

const EXAM_SIZE = 40;
const ANAMNESIS_PER_EXAM = 4;

type Item =
  | { kind: "quiz"; id: string }
  | { kind: "anamnesis"; id: string };

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<{ emoji: string; correct?: boolean } | null>(null);
  const [quizStats, setQuizStats] = useState<{ correct: number; total: number; wrong: { qid: string; question: string; topic: string }[] }>(
    { correct: 0, total: 0, wrong: [] }
  );
  const [anamnesisResults, setAnamnesisResults] = useState<{ caseId: string; score: number }[]>([]);
  const { stats, lastChange, onAnswer, onExamComplete, clearChange } = useGameStats();

  const session: Item[] = useMemo(() => {
    if (!started) return [];
    const quizPool = shuffle(questions).slice(0, EXAM_SIZE - ANAMNESIS_PER_EXAM);
    const casePool = shuffle([...cases]).slice(0, ANAMNESIS_PER_EXAM);
    const mixed: Item[] = [
      ...quizPool.map(q => ({ kind: "quiz" as const, id: q.id })),
      ...casePool.map(c => ({ kind: "anamnesis" as const, id: c.id }))
    ];
    return shuffle(mixed);
  }, [started]);

  const completed = started && index >= session.length;

  useEffect(() => {
    if (completed) onExamComplete();
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
            <button onClick={() => setStarted(true)} className="btn-primary w-full text-lg">
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
              <details className="text-right mt-4 group">
                <summary className="cursor-pointer btn-ghost text-sm font-bold">
                  📖 הצג שאלות שטעיתי בהן ({quizStats.wrong.length})
                </summary>
                <div className="mt-3 space-y-1 max-h-60 overflow-auto text-sm">
                  {quizStats.wrong.map(w => (
                    <div key={w.qid} className="p-2 rounded-lg bg-red-50 border border-red-100">
                      <span className="text-xs text-red-700 font-bold">[{w.topic}]</span> {w.question}
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
                q={q}
                index={index}
                total={session.length}
                currentStreak={stats?.currentStreak || 0}
                showRevealButton={false}
                onAnswer={(_, correct) => {
                  setQuizStats(s => ({
                    correct: s.correct + (correct ? 1 : 0),
                    total: s.total + 1,
                    wrong: correct ? s.wrong : [...s.wrong, { qid: q.id, question: q.question, topic: q.topic }]
                  }));
                  onAnswer({ kind: "quiz", topic: q.topic, correct });
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
                c={c}
                index={index}
                total={session.length}
                onComplete={({ feedback }) => {
                  if (feedback) {
                    setAnamnesisResults(r => [...r, { caseId: c.id, score: feedback.score }]);
                    onAnswer({ kind: "anamnesis", topic: c.topic, correct: feedback.score >= 60, scorePct: feedback.score });
                    setFeedbackEmoji({ emoji: milestoneEmoji(feedback.score) });
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
