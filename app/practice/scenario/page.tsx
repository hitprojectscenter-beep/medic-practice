"use client";
import Link from "next/link";
import { useState } from "react";
import { scenarios } from "@/data/scenarios";
import StatsBar from "@/components/StatsBar";
import ScenarioCard from "@/components/ScenarioCard";
import { useGameStats } from "@/hooks/useGameStats";
import { track } from "@/lib/track";

export default function ScenarioPracticePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { stats, onAnswer } = useGameStats();

  const selected = selectedId ? scenarios.find(s => s.id === selectedId) : null;

  const handleComplete = (result: { overallScore: number; phasesCompleted: number }) => {
    // Award XP based on score - treat like an exam
    onAnswer({ kind: "anamnesis", topic: "תרחיש PHTLS", correct: result.overallScore >= 60, scorePct: result.overallScore });
    if (selectedId) track({ type: "scenario_completed", scenarioId: selectedId });
  };

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
            <div className="text-6xl mb-3 float-animation">🚨</div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 gradient-text-warm">מקרים ותגובות</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              תרחיש שטח מלא לפי PHTLS - מקליטת קריאה ועד פינוי. דבר בקול,
              קבל ממצאים, החלט על טיפול ופינוי.
            </p>
          </div>

          {/* Info card */}
          <div className="card mb-6 bg-gradient-to-bl from-amber-50 to-orange-50 border-amber-200">
            <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>איך זה עובד?</span>
            </h2>
            <ol className="space-y-2 text-sm text-slate-700">
              {[
                "📻 קליטת קריאה מהמוקד - אישור ויציאה",
                "🦺 הגעה לזירה - בטיחות וציוד מגן",
                "🩺 גישה ראשונה XABCDE (Massive bleeding, Airway, Breathing, Circulation, Disability, Exposure)",
                "📊 בקשת מדדים חיוניים",
                "💬 שיחה עם המטופל - AI עונה (עם 'תענה לי')",
                "💉 ביצוע פעולות טיפול - חמצן, אספירין, נוזלים וכו'",
                "🚑 החלטת פינוי - BLS/ALS, קוד 3/1, יעד"
              ].map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-orange-600 shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 p-3 rounded-xl bg-white/80 border border-amber-200 text-xs">
              💡 <strong>בסוף תקבל משוב מקיף מבוסס AI</strong> - ציון לכל שלב, חוזקות, החסרות קריטיות, והערכת החלטת הפינוי שלך.
            </div>
          </div>

          {/* Scenarios grid */}
          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
            <span>📋</span><span>בחר תרחיש לתרגול:</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-3 stagger">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); track({ type: "scenario_started", scenarioId: s.id }); }}
                className="card card-hover text-right group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-slate-500 font-bold">{s.topic}</span>
                      <span className="text-xs">{"⭐".repeat(s.difficulty)}</span>
                    </div>
                    <div className="font-extrabold text-base mb-1 group-hover:text-orange-600 transition">{s.title}</div>
                    <div className="text-xs text-slate-600">לחץ להתחלת התרחיש</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
            <strong>📱 דרישות:</strong> מיקרופון מאופשר, קול עברי מותקן (TTS), אינטרנט יציב. המערכת תקריא הודעות מוקד ותגובות מטופל בקול.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-brand-dark flex items-center gap-1">
            <span>←</span><span>חזרה לבית</span>
          </Link>
          <StatsBar stats={stats} compact />
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <ScenarioCard
          key={selected!.id}
          scenario={selected!}
          onComplete={handleComplete}
          onExit={() => setSelectedId(null)}
        />
      </div>
    </main>
  );
}
