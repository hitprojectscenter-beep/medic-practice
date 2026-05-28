"use client";
import { useState } from "react";
import { AnamnesisCase } from "@/data/cases";
import Speak from "./Speak";
import Mic from "./Mic";

export type AnamnesisFeedback = {
  score: number; // 0-100
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
      setError("לא זוהה דיבור - נסו שוב");
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
    <div className="card space-y-5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="badge bg-amber-100 text-amber-800">אנמנזה · {c.topic}</span>
        <span>{index + 1} / {total}</span>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-bold mb-2">{c.title}</h2>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
          <div className="text-xs text-slate-500 mb-1 font-semibold">תיאור המקרה (יוקרא בקול):</div>
          {c.scenario}
          {c.patient.vitalsAtArrival && (
            <div className="mt-2 text-sm text-slate-600">
              <strong>מדדים בהגעה:</strong> {c.patient.vitalsAtArrival}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Speak text={`${c.scenario}. גיל ${c.patient.age}, ${c.patient.sex}. ${c.patient.vitalsAtArrival || ""}`} label="השמע מקרה 🔊" />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-700 font-semibold mb-2">
          בצעו אנמנזה מלאה לפי המקרה - לחצו על המיקרופון ודברו:
        </div>
        <Mic
          onPartial={t => setLivePartial(t)}
          onFinish={handleFinish}
          disabled={loadingFeedback}
        />
        {livePartial && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 text-sm text-slate-700">
            <div className="text-xs text-slate-500 mb-1">תמלול חי:</div>
            {livePartial}
          </div>
        )}
        {transcript && !livePartial && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 text-sm text-slate-700">
            <div className="text-xs text-slate-500 mb-1">
              התשובה שלכם ({usedSource === "whisper" ? "Whisper" : "דפדפן"}):
            </div>
            {transcript}
          </div>
        )}
        {loadingFeedback && (
          <div className="mt-3 text-center text-sm text-slate-600">
            <span className="inline-block animate-spin mr-1">⚙</span> מנתח את האנמנזה...
          </div>
        )}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      {feedback && (
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">משוב</h3>
            <div className="text-lg font-extrabold">
              ציון: <span className={feedback.score >= 70 ? "text-green-600" : feedback.score >= 50 ? "text-amber-600" : "text-red-600"}>{feedback.score}</span>/100
            </div>
          </div>
          {feedback.covered.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-green-800 mb-1">✓ מה כיסיתם נכון:</div>
              <ul className="space-y-1 text-sm">
                {feedback.covered.map((p, i) => (
                  <li key={i} className="text-slate-700">• {p.label}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.missed.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-red-800 mb-1">✗ מה חסר:</div>
              <ul className="space-y-1 text-sm">
                {feedback.missed.map((p, i) => (
                  <li key={i} className="text-slate-700">
                    <strong>{p.label}</strong> {p.weight === "critical" && <span className="badge bg-red-100 text-red-700">קריטי</span>}
                    {p.rationale && <span className="block text-xs text-slate-500 mr-3">{p.rationale}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.suggestions && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
              <div className="font-semibold mb-1">הצעות לשיפור</div>
              {feedback.suggestions}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowModel(s => !s)}
            className="btn-ghost text-sm"
          >
            {showModel ? "הסתר" : "הצג"} אנמנזה לדוגמה
          </button>
          {showModel && (
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800 text-sm leading-relaxed">
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
          המשך ←
        </button>
      </div>
    </div>
  );
}
