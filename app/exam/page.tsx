"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { questions, shuffle } from "@/data/questions";
import { cases } from "@/data/cases";
import QuizCard from "@/components/QuizCard";
import AnamnesisCard, { AnamnesisFeedback } from "@/components/AnamnesisCard";

const EXAM_SIZE = 40;
const ANAMNESIS_PER_EXAM = 4; // מתוך 40

type Item =
  | { kind: "quiz"; id: string }
  | { kind: "anamnesis"; id: string };

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [quizStats, setQuizStats] = useState<{ correct: number; total: number; wrong: { qid: string; question: string; topic: string }[] }>(
    { correct: 0, total: 0, wrong: [] }
  );
  const [anamnesisResults, setAnamnesisResults] = useState<{ caseId: string; score: number }[]>([]);

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

  if (!started) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="text-sm text-brand-dark mb-4 inline-block">← חזרה</Link>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">מבחן מעורב 🎯</h1>
        <p className="text-slate-600 mb-6">
          {EXAM_SIZE} שאלות מעורבות: {EXAM_SIZE - ANAMNESIS_PER_EXAM} שאלות אמריקאיות ו-{ANAMNESIS_PER_EXAM} אנמנזות קוליות.
        </p>
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-extrabold">{EXAM_SIZE}</div>
              <div className="text-slate-600">סה"כ פריטים</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-extrabold">~40 דק'</div>
              <div className="text-slate-600">זמן משוער</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            * סדר השאלות אקראי. ניתן להפסיק באמצע ולחזור.
          </div>
          <button onClick={() => setStarted(true)} className="btn-primary w-full">
            התחל מבחן
          </button>
        </div>
      </main>
    );
  }

  if (index >= session.length) {
    const quizPct = quizStats.total ? Math.round((quizStats.correct / quizStats.total) * 100) : 0;
    const anaPct = anamnesisResults.length ? Math.round(anamnesisResults.reduce((s, r) => s + r.score, 0) / anamnesisResults.length) : 0;
    const combined = Math.round((quizPct + anaPct) / 2);
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="card text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-extrabold mb-2">המבחן הסתיים!</h2>
          <div className="grid grid-cols-3 gap-3 my-5">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-700">ציון משולב</div>
              <div className="text-3xl font-extrabold text-emerald-800">{combined}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-600">אמריקאיות</div>
              <div className="text-3xl font-extrabold">{quizPct}%</div>
              <div className="text-xs text-slate-500">{quizStats.correct}/{quizStats.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs text-amber-700">אנמנזות</div>
              <div className="text-3xl font-extrabold">{anaPct}</div>
              <div className="text-xs text-amber-700">ממוצע</div>
            </div>
          </div>
          {quizStats.wrong.length > 0 && (
            <div className="text-right">
              <div className="text-sm font-semibold mb-2">שאלות אמריקאיות לחזרה:</div>
              <ul className="space-y-1 text-sm max-h-60 overflow-auto">
                {quizStats.wrong.map(w => (
                  <li key={w.qid} className="text-slate-700">
                    <span className="text-xs text-slate-500">[{w.topic}]</span> {w.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setStarted(false);
                setIndex(0);
                setQuizStats({ correct: 0, total: 0, wrong: [] });
                setAnamnesisResults([]);
              }}
              className="btn-secondary"
            >
              מבחן נוסף
            </button>
            <Link href="/" className="btn-primary">סיום</Link>
          </div>
        </div>
      </main>
    );
  }

  const item = session[index];
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-sm text-brand-dark">← יציאה</Link>
        <div className="text-xs text-slate-500">
          פריט {index + 1} / {session.length}
        </div>
      </div>
      {item.kind === "quiz" ? (
        (() => {
          const q = questions.find(qq => qq.id === item.id)!;
          return (
            <QuizCard
              q={q}
              index={index}
              total={session.length}
              showRevealButton={false}
              onAnswer={(_, correct) => {
                setQuizStats(s => ({
                  correct: s.correct + (correct ? 1 : 0),
                  total: s.total + 1,
                  wrong: correct ? s.wrong : [...s.wrong, { qid: q.id, question: q.question, topic: q.topic }]
                }));
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
                if (feedback) setAnamnesisResults(r => [...r, { caseId: c.id, score: feedback.score }]);
              }}
              onNext={() => setIndex(i => i + 1)}
            />
          );
        })()
      )}
    </main>
  );
}
