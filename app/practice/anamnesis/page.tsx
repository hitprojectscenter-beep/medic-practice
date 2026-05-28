"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cases } from "@/data/cases";
import AnamnesisCard from "@/components/AnamnesisCard";
import StatsBar from "@/components/StatsBar";
import AchievementToast from "@/components/AchievementToast";
import Celebration from "@/components/Celebration";
import { useGameStats } from "@/hooks/useGameStats";
import { milestoneEmoji } from "@/lib/gamification";

const CASE_EMOJI: Record<string, string> = {
  "case-chest-pain": "💔",
  "case-asthma": "💨",
  "case-anaphylaxis": "⚠️",
  "case-stroke": "🧠",
  "case-hypoglycemia": "🍬",
  "case-burn": "🔥",
  "case-mvc": "🚗",
  "case-snake": "🐍",
  "case-abd-pain": "🤢",
  "case-syncope": "😵",
  "case-peds-seizure": "👶",
  "case-bleeding-pregnancy": "🤰",
  "case-uti": "💧",
  "case-heat-stroke": "🌡️",
  "case-gsw": "🩸"
};

export default function AnamnesisPracticePage() {
  const [selectedId, setSelectedId] = useState<string | "random" | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ caseId: string; score: number }[]>([]);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);
  const { stats, lastChange, onAnswer, clearChange } = useGameStats();

  const session = useMemo(() => {
    if (!selectedId) return [];
    if (selectedId === "random") return [...cases].sort(() => Math.random() - 0.5);
    const c = cases.find(c => c.id === selectedId);
    return c ? [c] : [];
  }, [selectedId]);

  if (!selectedId) {
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

        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8 fade-up">
            <div className="text-6xl mb-3 float-animation">🎙️</div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 gradient-text">תרגול אנמנזה קולית</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              האפליקציה תקריא מקרה, ואתם תבצעו אנמנזה מלאה בקול. תקבלו משוב חכם וצוברים XP!
            </p>
          </div>

          <button
            onClick={() => setSelectedId("random")}
            className="btn-primary w-full text-lg mb-6 glow-animation"
          >
            🎲 התחל עם {cases.length} מקרים אקראיים
          </button>

          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>או בחרו מקרה ספציפי:</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 stagger">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="card card-hover text-right group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{CASE_EMOJI[c.id] || "🚨"}</div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 font-bold mb-0.5">{c.topic}</div>
                    <div className="font-extrabold text-base group-hover:text-brand-dark transition">{c.title}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      גיל {c.patient.age}, {c.patient.sex}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <strong>💡 טיפ:</strong> השתמשו באוזניות עם מיקרופון לזיהוי טוב יותר. עם מפתח Whisper - הזיהוי מדויק במיוחד.
          </div>
        </div>
      </main>
    );
  }

  if (index >= session.length) {
    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
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
            <div className="text-8xl mb-3 pop-in">{milestoneEmoji(avg)}</div>
            <h2 className="text-3xl font-black mb-2">סיימת!</h2>
            <p className="text-slate-600 mb-3">השלמת {results.length} מקרים</p>
            <div className="text-5xl font-black my-4 gradient-text">{avg}/100</div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => {
                  setIndex(0);
                  setResults([]);
                  setSelectedId(null);
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

  const c = session[index];
  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span><span>יציאה</span>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>

      {feedbackEmoji && (
        <Celebration
          change={lastChange}
          emoji={feedbackEmoji}
          onDone={() => {
            setFeedbackEmoji(null);
            clearChange();
          }}
        />
      )}
      <AchievementToast achievements={lastChange?.unlockedAchievements || []} onDone={clearChange} />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <AnamnesisCard
          c={c}
          index={index}
          total={session.length}
          onComplete={({ feedback }) => {
            if (feedback) {
              setResults(r => [...r, { caseId: c.id, score: feedback.score }]);
              onAnswer({ kind: "anamnesis", topic: c.topic, correct: feedback.score >= 60, scorePct: feedback.score });
              setFeedbackEmoji(milestoneEmoji(feedback.score));
            }
          }}
          onNext={() => setIndex(i => i + 1)}
        />
      </div>
    </main>
  );
}
