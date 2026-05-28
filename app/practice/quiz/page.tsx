"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { questions, topics, shuffle } from "@/data/questions";
import QuizCard from "@/components/QuizCard";

export default function QuizPracticePage() {
  const [topic, setTopic] = useState<string>("all");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<{ correct: number; total: number; wrong: { qid: string; topic: string; question: string }[] }>(
    { correct: 0, total: 0, wrong: [] }
  );

  const session = useMemo(() => {
    if (!started) return [];
    const pool = topic === "all" ? questions : questions.filter(q => q.topic === topic);
    return shuffle(pool);
  }, [started, topic]);

  if (!started) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="text-sm text-brand-dark mb-4 inline-block">← חזרה</Link>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">תרגול שאלות אמריקאיות</h1>
        <p className="text-slate-600 mb-6">בחרו נושא או תרגלו את כל הנושאים בערבוב.</p>
        <div className="card space-y-4">
          <label className="block">
            <div className="text-sm font-semibold mb-2">נושא לתרגול</div>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-brand outline-none"
            >
              <option value="all">כל הנושאים ({questions.length} שאלות)</option>
              {topics.map(t => {
                const n = questions.filter(q => q.topic === t).length;
                return (
                  <option key={t} value={t} disabled={n === 0}>
                    {t} ({n})
                  </option>
                );
              })}
            </select>
          </label>
          <button onClick={() => setStarted(true)} className="btn-primary w-full md:w-auto">
            התחל תרגול
          </button>
        </div>
      </main>
    );
  }

  if (index >= session.length) {
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="card text-center">
          <div className="text-5xl mb-3">🎓</div>
          <h2 className="text-2xl font-extrabold mb-2">סיימתם את התרגול!</h2>
          <p className="text-slate-600 mb-4">
            ענתם נכון על {stats.correct} מתוך {stats.total} שאלות ({pct}%).
          </p>
          {stats.wrong.length > 0 && (
            <div className="text-right mb-6">
              <div className="text-sm font-semibold mb-2">שאלות לחזרה:</div>
              <ul className="space-y-1 text-sm">
                {stats.wrong.map(w => (
                  <li key={w.qid} className="text-slate-700">
                    <span className="text-xs text-slate-500">[{w.topic}]</span> {w.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIndex(0);
                setStats({ correct: 0, total: 0, wrong: [] });
                setStarted(false);
              }}
              className="btn-secondary"
            >
              סבב נוסף
            </button>
            <Link href="/" className="btn-primary">חזרה למסך הראשי</Link>
          </div>
        </div>
      </main>
    );
  }

  const q = session[index];
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-sm text-brand-dark">← חזרה</Link>
        <div className="text-xs text-slate-500">
          נכון: {stats.correct} / {stats.total}
        </div>
      </div>
      <QuizCard
        q={q}
        index={index}
        total={session.length}
        onAnswer={(_, correct) => {
          setStats(s => ({
            correct: s.correct + (correct ? 1 : 0),
            total: s.total + 1,
            wrong: correct ? s.wrong : [...s.wrong, { qid: q.id, topic: q.topic, question: q.question }]
          }));
        }}
        onNext={() => setIndex(i => i + 1)}
      />
    </main>
  );
}
