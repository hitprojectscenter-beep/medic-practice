"use client";
import { useState } from "react";
import { AnamnesisCase } from "@/data/cases";
import { milestoneEmoji } from "@/lib/gamification";
import Speak from "./Speak";
import Mic from "./Mic";

export type AnamnesisFeedback = {
  score: number;
  covered: { label: string; weight: string }[];
  missed: { label: string; weight: string; rationale: string }[];
  suggestions: string;
  raw?: string;
};

type Props = {
  c: AnamnesisCase;
  index: number;
  total: number;
  onComplete: (data: { transcript: string; feedback: AnamnesisFeedback | null }) => void;
  onNext: () => void;
};

export default function AnamnesisCard({ c, index, total, onComplete, onNext }: Props) {
  const [transcript, setTranscript] = useState("");
  const [livePartial, setLivePartial] = useState("");
  const [feedback, setFeedback] = useState<AnamnesisFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedSource, setUsedSource] = useState<"browser" | "whisper" | null>(null);
  const [showModel, setShowModel] = useState(false);

  const handleFinish = async (text: string, source: "browser" | "whisper") => {
    setTranscript(text);
    setLivePartial("");
    setUsedSource(source);
    if (!text.trim()) {
      setError("לא זוהה דיבור - נסו שוב 🎤");
      return;
    }
    setLoadingFeedback(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: c.id, transcript: text })
      });
      if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
      const data: AnamnesisFeedback = await res.json();
      setFeedback(data);
      onComplete({ transcript: text, feedback: data });
    } catch (e: any) {
      setError(e?.message || "שגיאה במשוב");
      onComplete({ transcript: text, feedback: null });
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div className="card slide-in space-y-5">
      <div className="flex items-center justify-between text-xs">
        <span className="badge bg-gradient-to-l from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
          🎙️ אנמנזה · {c.topic}
        </span>
        <span className="text-slate-500 font-bold">{index + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-extrabold mb-2 flex items-center gap-2">
          <span className="text-3xl">🚨</span>
          <span>{c.title}</span>
        </h2>
        <div className="p-4 rounded-2xl bg-gradient-to-bl from-slate-50 to-blue-50/30 border border-slate-200 text-slate-800 leading-relaxed">
          <div className="text-xs text-slate-500 mb-1 font-bold flex items-center gap-1">
            <span>📋</span>
            <span>תיאור המקרה (יוקרא בקול):</span>
          </div>
          {c.scenario}
          {c.patient.vitalsAtArrival && (
            <div className="mt-3 p-2 rounded-xl bg-white/80 text-sm border border-blue-200">
              <strong className="text-blue-800">📊 מדדים בהגעה:</strong> {c.patient.vitalsAtArrival}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Speak text={`${c.scenario}. גיל ${c.patient.age}, ${c.patient.sex}. ${c.patient.vitalsAtArrival || ""}`} label="🔊 השמע מקרה" />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="text-sm text-slate-700 font-bold mb-3 flex items-center gap-2">
          <span>🎯</span>
          <span>בצעו אנמנזה מלאה - לחצו על המיקרופון ודברו:</span>
        </div>
        <Mic
          onPartial={t => setLivePartial(t)}
          onFinish={handleFinish}
          disabled={loadingFeedback}
        />
        {livePartial && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <div className="text-xs text-blue-700 mb-1 font-bold">⚡ תמלול חי:</div>
            {livePartial}
          </div>
        )}
        {transcript && !livePartial && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
            <div className="text-xs text-slate-500 mb-1 font-bold">
              💬 התשובה שלכם ({usedSource === "whisper" ? "Whisper" : "דפדפן"}):
            </div>
            {transcript}
          </div>
        )}
        {loadingFeedback && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
              <span className="inline-block animate-spin">⚙️</span>
              <span>ה-AI מנתח את האנמנזה...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}
      </div>

      {feedback && (
        <div className="border-t border-slate-200 pt-5 space-y-4 fade-up">
          <div className="text-center">
            <div className="text-6xl mb-2 pop-in">{milestoneEmoji(feedback.score)}</div>
            <div className="text-3xl font-black mb-1">
              <span className={feedback.score >= 70 ? "text-emerald-600" : feedback.score >= 50 ? "text-amber-600" : "text-red-600"}>
                {feedback.score}
              </span>
              <span className="text-xl text-slate-400">/100</span>
            </div>
            <div className="text-sm text-slate-600">
              {feedback.score >= 90 ? "מצוין! מקצועי!" :
               feedback.score >= 75 ? "כל הכבוד!" :
               feedback.score >= 60 ? "טוב מאוד!" :
               feedback.score >= 40 ? "סביר, יש מקום לשיפור" :
               "לתרגל ולחזור"}
            </div>
          </div>

          {feedback.covered.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-sm font-extrabold text-emerald-800 mb-2 flex items-center gap-2">
                <span>✅</span>
                <span>מה כיסיתם נכון ({feedback.covered.length}):</span>
              </div>
              <ul className="space-y-1 text-sm">
                {feedback.covered.map((p, i) => (
                  <li key={i} className="text-emerald-900 flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>{p.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.missed.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-sm font-extrabold text-red-800 mb-2 flex items-center gap-2">
                <span>❌</span>
                <span>מה חסר ({feedback.missed.length}):</span>
              </div>
              <ul className="space-y-2 text-sm">
                {feedback.missed.map((p, i) => (
                  <li key={i} className="text-red-900">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <div className="flex-1">
                        <span className="font-bold">{p.label}</span>{" "}
                        {p.weight === "critical" && <span className="badge bg-red-200 text-red-800 mr-1">⚠️ קריטי</span>}
                        {p.rationale && <div className="text-xs text-red-700 mt-0.5">{p.rationale}</div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.suggestions && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
              <div className="font-extrabold mb-1 flex items-center gap-2">
                <span>💡</span>
                <span>הצעות לשיפור</span>
              </div>
              {feedback.suggestions}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowModel(s => !s)}
            className="btn-ghost text-sm w-full"
          >
            {showModel ? "🔼 הסתר" : "📖 הצג"} אנמנזה לדוגמה
          </button>
          {showModel && (
            <div className="p-4 rounded-2xl bg-slate-100 text-slate-800 text-sm leading-relaxed fade-up">
              {c.modelAnswer}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="btn-primary"
          disabled={!transcript && !feedback}
        >
          <span className="flex items-center gap-2">
            <span>המשך</span>
            <span>←</span>
          </span>
        </button>
      </div>
    </div>
  );
}
