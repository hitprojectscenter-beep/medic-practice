"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cases } from "@/data/cases";
import AnamnesisCard, { AnamnesisFeedback } from "@/components/AnamnesisCard";

export default function AnamnesisPracticePage() {
  const [selectedId, setSelectedId] = useState<string | "random" | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ caseId: string; score: number }[]>([]);

  const session = useMemo(() => {
    if (!selectedId) return [];
    if (selectedId === "random") {
      return [...cases].sort(() => Math.random() - 0.5);
    }
    const c = cases.find(c => c.id === selectedId);
    return c ? [c] : [];
  }, [selectedId]);

  if (!selectedId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="text-sm text-brand-dark mb-4 inline-block">← חזרה</Link>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">תרגול אנמנזה קולית</h1>
        <p className="text-slate-600 mb-6">
          האפליקציה תקריא מקרה, ואתם תבצעו אנמנזה מלאה בקול. תקבלו משוב על מה כוסה ומה חסר.
        </p>

        <div className="card space-y-4">
          <button
            onClick={() => setSelectedId("random")}
            className="btn-primary w-full md:w-auto"
          >
            🎲 תרגול מקרים אקראיים ({cases.length})
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3">או בחרו מקרה ספציפי:</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="card text-right hover:border-brand/40 hover:shadow-md transition"
              >
                <div className="text-xs text-slate-500 mb-1">{c.topic}</div>
                <div className="font-bold text-base">{c.title}</div>
                <div className="text-sm text-slate-600 mt-1">
                  גיל {c.patient.age}, {c.patient.sex}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <strong>טיפ:</strong> השתמשו באוזניות עם מיקרופון לזיהוי טוב יותר. בקטעי דיבור ארוכים עדיף Whisper (אם הוגדר API key) - מדויק יותר.
        </div>
      </main>
    );
  }

  if (index >= session.length) {
    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="card text-center">
          <div className="text-5xl mb-3">🎙️</div>
          <h2 className="text-2xl font-extrabold mb-2">סיימתם את תרגול האנמנזה!</h2>
          <p className="text-slate-600 mb-4">
            ביצעתם {results.length} מקרים, ציון ממוצע: <strong>{avg}/100</strong>
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIndex(0);
                setResults([]);
                setSelectedId(null);
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

  const c = session[index];
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-sm text-brand-dark">← חזרה</Link>
        <div className="text-xs text-slate-500">מקרה {index + 1} / {session.length}</div>
      </div>
      <AnamnesisCard
        c={c}
        index={index}
        total={session.length}
        onComplete={({ feedback }) => {
          if (feedback) setResults(r => [...r, { caseId: c.id, score: feedback.score }]);
        }}
        onNext={() => setIndex(i => i + 1)}
      />
    </main>
  );
}
