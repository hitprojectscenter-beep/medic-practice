"use client";
import { useEffect, useRef, useState } from "react";
import { AnamnesisCase } from "@/data/cases";
import { caseExtras, SAFETY_PHRASES, DialogueResponse } from "@/data/case-extras";
import { milestoneEmoji } from "@/lib/gamification";
import Speak from "./Speak";
import Mic from "./Mic";
import { speak, stopSpeaking } from "@/lib/speech";

export type AnamnesisFeedback = {
  score: number;
  covered: { label: string; weight: string }[];
  missed: { label: string; weight: string; rationale: string }[];
  logicalOrder?: { score: number; comment: string };
  additionalQuestions?: string[];
  suggestions: string;
  raw?: string;
};

type Phase = "safety" | "anamnesis" | "diagnosis" | "feedback";

type Turn = {
  id: string;
  userQuestion: string;
  patientAnswer: string | null;
  loadingAnswer?: boolean;
  triggered?: boolean; // user asked for answer (had "תענה לי")
};

const generateTurnId = () => `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Props = {
  c: AnamnesisCase;
  index: number;
  total: number;
  onComplete: (data: {
    transcript: string;
    feedback: AnamnesisFeedback | null;
    safetyScore: number;
    diagnosisCorrect: boolean | null;
  }) => void;
  onNext: () => void;
};

// IMPORTANT: \b word-boundary does NOT work for Hebrew in JS regex
// (Hebrew letters aren't in \w). We use plain substring patterns instead.
const ANSWER_TRIGGER = /(תענה|ענה|תגיד|תאמר|תספר|תסביר)\s+(לי|לנו|לו|לה)/;

/** Strip Hebrew niqqud & normalize for matching */
const normalize = (s: string): string =>
  s
    .replace(/[֑-ׇ]/g, "") // niqqud
    .replace(/[״׳"'.,!?;:()־-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Hebrew word-boundary matching with prefix allowance
// (mirror of /api/dialogue/route.ts logic)
const ALLOWED_PREFIXES = ["", "ה", "ו", "ש", "ב", "ל", "כ", "וה", "וב", "ול", "וש", "מה"];
const MAX_SUFFIX_LEN = 3;

const containsWord = (text: string, keyword: string): boolean => {
  if (!keyword) return false;
  if (keyword.includes(" ")) return text.includes(keyword);
  const words = text.split(/\s+/).filter(Boolean);
  return words.some(w => {
    for (const prefix of ALLOWED_PREFIXES) {
      const head = prefix + keyword;
      if (w.startsWith(head) && w.length - head.length <= MAX_SUFFIX_LEN) return true;
    }
    return false;
  });
};

// Generic patterns that translate user questions into concepts we can match
// against patientResponses.keywords. Mirrors /api/dialogue's GENERIC_PATTERNS.
const GENERIC_PATTERNS: { triggers: string[]; concepts: string[] }[] = [
  // General opening questions → chief complaint
  { triggers: ["איך אתה מרגיש", "איך את מרגישה", "איך מרגיש", "מה שלומך", "מה איתך", "מה מצבך", "מצבך", "מה קרה לך", "שלום אדוני", "שלום גברתי", "אדוני", "גברתי"], concepts: ["מאפיין", "איך מרגיש", "כואב", "כאב", "התחיל", "מתי התחיל", "מקום הכאב"] },
  { triggers: ["מה כואב", "איפה כואב", "כואב לך", "מקום הכאב", "איזה כאב", "כאבים", "הכאב", "האם כואב", "הוא כואב", "היא כואבת", "תאר את הכאב"], concepts: ["מאפיין", "איך מרגיש", "כואב", "כאב", "איפה", "מקום הכאב"] },
  { triggers: ["מתי התחיל", "מתי זה התחיל", "כמה זמן", "לפני כמה", "מתי קרה"], concepts: ["מתי", "כמה זמן", "התחיל"] },
  { triggers: ["מה קרה", "מה קורה", "מה הבעיה", "למה קראת", "למה הזעקת", "מה הסיבה", "למה אנחנו", "למה הזמנת"], concepts: ["מה קרה", "תאונה", "התחיל", "מאפיין"] },
  { triggers: ["תרופות", "תרופה", "מה אתה לוקח", "מה את לוקחת"], concepts: ["תרופות", "מה אתה לוקח", "מה לוקחת"] },
  { triggers: ["אלרגי", "אלרגיה"], concepts: ["אלרגיה"] },
  { triggers: ["מחלות", "רקע רפואי", "רקע", "מחלה", "סובל"], concepts: ["סוכרת", "לחץ דם", "מחלה"] },
  { triggers: ["מקרין", "הקרנה", "זרוע", "לסת"], concepts: ["מקרין", "זרוע", "לסת", "גב"] },
  { triggers: ["הזעה", "מזיע", "בחילה", "הקאה", "סחרחורת", "חולשה", "סחרחר"], concepts: ["הזעה", "בחילה", "סחרחורת"] },
  { triggers: ["נשימה", "קצר נשימה", "קוצר נשימה", "קשה לנשום"], concepts: ["נשימה"] },
  { triggers: ["אכלת", "ארוחה", "אוכל"], concepts: ["אכל", "ארוחה"] },
  { triggers: ["מעשן", "עישון", "סיגריות"], concepts: ["מעשן", "עישון"] },
  { triggers: ["אלכוהול", "שתיית", "שיכור"], concepts: ["אלכוהול", "שותה"] },
  { triggers: ["סוכר", "אינסולין", "גלוקוז"], concepts: ["סוכרת", "אינסולין", "סוכר"] },
  { triggers: ["יתר לחץ", "לחץ דם"], concepts: ["לחץ דם", "יתר לחץ"] },
  { triggers: ["מאמץ", "מה מקל", "מה מחמיר"], concepts: ["מאמץ", "מנוחה", "מחמיר", "מקל"] },
  { triggers: ["דרגה", "סקאלה", "כמה חזק", "עוצמה"], concepts: ["דרגה", "סקאלה", "כמה חזק"] },
  { triggers: ["משפחה", "אחים", "תורשה", "אבא", "אמא"], concepts: ["משפחה", "תורשה"] }
];

/** Find best in-character answer for a user question */
const findResponse = (question: string, responses: DialogueResponse[]): string => {
  const q = normalize(question);

  // 1. Direct keyword match (word-boundary aware!)
  let best: { hits: number; answer: string } | null = null;
  for (const r of responses) {
    let hits = 0;
    for (const kw of r.keywords) {
      const k = normalize(kw);
      if (k && containsWord(q, k)) hits++;
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { hits, answer: r.answer };
  }
  if (best) return best.answer;

  // 2. Try generic question patterns → concept keywords → response
  for (const gp of GENERIC_PATTERNS) {
    if (gp.triggers.some(t => q.includes(normalize(t)))) {
      for (const concept of gp.concepts) {
        const ck = normalize(concept);
        const match = responses.find(r =>
          r.keywords.some(kw => normalize(kw).includes(ck) || ck.includes(normalize(kw)))
        );
        if (match) return match.answer;
      }
    }
  }

  // 3. Contextual fallback - pick any response that describes a complaint
  const complaintResp = responses.find(r => /(כאב|כואב|מרגיש|התחיל|סובל)/.test(r.answer));
  if (complaintResp) return complaintResp.answer;

  return "אני לא בטוח על מה אתה שואל. תוכל/י לשאול בדרך אחרת?";
};

/** Detect which safety phrases were said */
const detectSafetyChecks = (text: string): Set<string> => {
  const t = normalize(text);
  const hit = new Set<string>();
  for (const phrase of SAFETY_PHRASES) {
    for (const kw of phrase.keywords) {
      if (t.includes(normalize(kw))) {
        hit.add(phrase.label);
        break;
      }
    }
  }
  return hit;
};

export default function AnamnesisCard({ c, index, total, onComplete, onNext }: Props) {
  const extras = caseExtras[c.id];
  const [phase, setPhase] = useState<Phase>("safety");

  // Phase 1: Safety
  const [safetyTranscript, setSafetyTranscript] = useState("");
  const [safetyChecks, setSafetyChecks] = useState<Set<string>>(new Set());
  const safetyPartialRef = useRef("");

  // Phase 2: Anamnesis dialogue
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const anamnesisPartialRef = useRef("");
  const [allUserTextCombined, setAllUserTextCombined] = useState("");

  // Phase 3: Diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<number | null>(null);

  // Phase 4: Feedback
  const [feedback, setFeedback] = useState<AnamnesisFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);

  // Reset everything when the case changes
  useEffect(() => {
    setPhase("safety");
    setSafetyTranscript("");
    setSafetyChecks(new Set());
    setTurns([]);
    setCurrentTranscript("");
    setAllUserTextCombined("");
    setSelectedDiagnosis(null);
    setFeedback(null);
    setLoadingFeedback(false);
    setError(null);
    setShowModel(false);
    safetyPartialRef.current = "";
    anamnesisPartialRef.current = "";
  }, [c.id]);

  // === Phase 1: Safety ===
  const handleSafetyFinish = (text: string) => {
    const combined = (safetyTranscript + " " + text).trim();
    setSafetyTranscript(combined);
    setSafetyChecks(detectSafetyChecks(combined));
    safetyPartialRef.current = "";
  };

  const safetyScore = Math.round(
    (Array.from(safetyChecks).length / SAFETY_PHRASES.filter(p => p.weight !== "nice-to-have").length) * 100
  );

  // === Phase 2: Anamnesis dialogue ===
  const MAX_QUESTIONS = 10;
  const questionsAsked = turns.length;
  const reachedLimit = questionsAsked >= MAX_QUESTIONS;

  const handleAnamnesisFinish = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      anamnesisPartialRef.current = "";
      setCurrentTranscript("");
      return;
    }

    // Hard cap on questions — push the user to diagnosis after MAX_QUESTIONS
    if (questionsAsked >= MAX_QUESTIONS) {
      setError(`הגעת למקסימום ${MAX_QUESTIONS} שאלות. עבור לשלב האבחנה.`);
      return;
    }

    setAllUserTextCombined(prev => (prev + " " + trimmed).trim());

    // Generate unique turn ID so we can later update by id (race-safe vs index)
    const turnId = generateTurnId();
    // Auto-trigger AI response for every user question. The "תענה לי" trigger
    // was too easy to miss on mobile (STT often drops it) and confused new users.
    // The MAX_QUESTIONS cap provides sufficient rate limiting.
    const wantsAnswer = true;

    if (typeof console !== "undefined") {
      console.log("[anamnesis] turn", turnId, "user said:", trimmed.slice(0, 80));
      console.log("[anamnesis] wantsAnswer:", wantsAnswer);
    }

    setTurns(prev => [
      ...prev,
      { id: turnId, userQuestion: trimmed, patientAnswer: null, loadingAnswer: wantsAnswer, triggered: wantsAnswer }
    ]);
    setCurrentTranscript("");
    anamnesisPartialRef.current = "";

    if (!wantsAnswer) return;

    // Helper to update by id (race-safe)
    const updateTurn = (answer: string | null, loading: boolean) =>
      setTurns(prev => prev.map(t => (t.id === turnId ? { ...t, patientAnswer: answer, loadingAnswer: loading } : t)));

    // Race the network call against a 20-second timeout so the UI never hangs
    const fetchWithTimeout = async (url: string, init: RequestInit, ms: number): Promise<Response> => {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), ms);
      try {
        return await fetch(url, { ...init, signal: ctrl.signal });
      } finally {
        clearTimeout(id);
      }
    };

    try {
      const res = await fetchWithTimeout(
        "/api/dialogue",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: c.id,
            userQuestion: trimmed,
            history: turns.map(t => ({ q: t.userQuestion, a: t.patientAnswer }))
          })
        },
        20000
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer: string =
        (typeof data.answer === "string" && data.answer.trim()) ||
        (extras?.patientResponses ? findResponse(trimmed, extras.patientResponses) : "") ||
        "אני לא בטוח, תוכל לשאול שוב?";

      if (typeof console !== "undefined") {
        console.log("[anamnesis] turn", turnId, "got answer from", data.source || "?", ":", answer.slice(0, 80));
      }
      updateTurn(answer, false);
      try { speak(answer, {}); } catch (e) { console.warn("[anamnesis] speak failed", e); }
    } catch (err: any) {
      if (typeof console !== "undefined") {
        console.warn("[anamnesis] /api/dialogue failed:", err?.message);
      }
      // Local fallback
      const answer = extras?.patientResponses
        ? findResponse(trimmed, extras.patientResponses)
        : "אני לא בטוח, תוכל לשאול שוב?";
      updateTurn(answer, false);
      try { speak(answer, {}); } catch (e) { console.warn("[anamnesis] speak failed", e); }
    }
  };

  // === Phase 3 → 4: Submit for feedback ===
  const submitForFeedback = async (diagnosisIdx: number, attempt = 1): Promise<void> => {
    if (attempt === 1) {
      setSelectedDiagnosis(diagnosisIdx);
      setLoadingFeedback(true);
      setError(null);
      setPhase("feedback");
    }
    const transcript = allUserTextCombined || turns.map(t => t.userQuestion).join(" ");
    const diagnosisCorrect = extras?.differentialDiagnosis[diagnosisIdx]?.correct ?? null;

    // Race the network call against a 55-second timeout (server allows 60)
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 55000);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: c.id,
          transcript,
          safetyChecks: Array.from(safetyChecks),
          turns: turns.map(t => ({ q: t.userQuestion, a: t.patientAnswer })),
          selectedDiagnosis: diagnosisIdx
        }),
        signal: ctrl.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
      const data: AnamnesisFeedback = await res.json();
      setFeedback(data);
      setError(null);
      onComplete({ transcript, feedback: data, safetyScore, diagnosisCorrect });
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn(`[anamnesis] feedback attempt ${attempt} failed:`, e?.message);
      // Auto-retry once on first failure (network blip / cold start)
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 1200));
        return submitForFeedback(diagnosisIdx, 2);
      }
      // After retry, build a minimal local fallback so the user isn't stuck
      const localFeedback: AnamnesisFeedback = {
        score: Math.min(95, Math.max(20, Math.round((turns.length / 10) * 60 + (diagnosisCorrect ? 25 : 0)))),
        covered: [],
        missed: [],
        suggestions:
          "המשוב מהשרת לא הצליח להגיע (כנראה רשת איטית). הנה סיכום מקומי מהיר: " +
          `כיסית ${turns.length} שאלות. ` +
          (diagnosisCorrect === true ? "האבחנה שבחרת היא הנכונה! " : diagnosisCorrect === false ? "האבחנה לא הייתה נכונה - שווה לחזור על המקרה. " : "") +
          "תוכל לנסות שוב במקרה הבא.",
        raw: "local-fallback"
      };
      setError(e?.name === "AbortError" ? "הקריאה לשרת התעכבה. הוצג סיכום מקומי." : `${e?.message || "שגיאת רשת"}. הוצג סיכום מקומי.`);
      setFeedback(localFeedback);
      onComplete({ transcript, feedback: localFeedback, safetyScore, diagnosisCorrect });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const retryFeedback = () => {
    if (selectedDiagnosis !== null) {
      setError(null);
      setFeedback(null);
      submitForFeedback(selectedDiagnosis, 1);
    }
  };

  // === Render header (shared by all phases) ===
  const ProgressHeader = (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="badge bg-gradient-to-l from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
          🎙️ אנמנזה · {c.topic}
        </span>
        <span className="text-slate-500 font-bold">{index + 1} / {total}</span>
      </div>
      {/* Phase indicator */}
      <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
        {(["safety", "anamnesis", "diagnosis", "feedback"] as Phase[]).map((p, i) => {
          const active = p === phase;
          const done = (["safety", "anamnesis", "diagnosis", "feedback"] as Phase[]).indexOf(phase) > i;
          return (
            <div
              key={p}
              className={`py-1.5 px-1 rounded-lg font-bold transition ${
                active
                  ? "bg-amber-500 text-white shadow"
                  : done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {done ? "✓ " : ""}
              {p === "safety" ? "1. בטיחות" : p === "anamnesis" ? "2. אנמנזה" : p === "diagnosis" ? "3. אבחנה" : "4. משוב"}
            </div>
          );
        })}
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold mb-2 flex items-center gap-2">
          <span className="text-3xl">🚨</span>
          <span>{c.title}</span>
        </h2>
      </div>
    </div>
  );

  // ===== Phase 1: Safety =====
  if (phase === "safety") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}

        <div className="p-4 rounded-2xl bg-gradient-to-bl from-blue-50 to-indigo-50/30 border border-blue-200 text-slate-800 leading-relaxed">
          <div className="text-xs text-blue-700 mb-1 font-bold flex items-center gap-1">
            <span>📻</span>
            <span>קריאת מוקד (יוקרא בקול):</span>
          </div>
          <div className="font-medium">{extras?.dispatcherIntro || c.scenario}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Speak text={extras?.dispatcherIntro || c.scenario} label="🔊 הקרא קריאת מוקד" />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="text-sm font-extrabold mb-2 flex items-center gap-2">
            <span>🦺</span>
            <span>אישור קליטה ובטיחות</span>
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            לחצו על המיקרופון ואמרו בקול: <strong>קיבלתי</strong>, <strong>יוצא לקריאה</strong>, <strong>הגעה</strong>, <strong>ווסט וכפפות</strong>, <strong>האם הזירה בטוחה</strong>...
          </p>
          <Mic
            onPartial={t => setCurrentTranscript(t)}
            onFinish={handleSafetyFinish}
            disabled={loadingFeedback}
            partialBufferRef={safetyPartialRef}
          />
          {currentTranscript && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
              <div className="text-xs text-blue-700 mb-1 font-bold">⚡ תמלול חי:</div>
              {currentTranscript}
            </div>
          )}
          {safetyTranscript && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              <div className="text-xs text-slate-500 mb-1 font-bold">💬 מה אמרת:</div>
              {safetyTranscript}
            </div>
          )}

          {/* Safety checklist */}
          <div className="mt-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">📋 רשימת תיוג:</div>
            {SAFETY_PHRASES.map(p => {
              const ok = safetyChecks.has(p.label);
              return (
                <div
                  key={p.label}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-sm transition ${
                    ok
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="text-lg">{ok ? "✅" : "⬜"}</span>
                  <span className="flex-1">{p.label}</span>
                  {p.weight === "critical" && !ok && (
                    <span className="badge bg-red-100 text-red-700 text-[10px]">חשוב</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setPhase("anamnesis")}
            className="btn-primary"
            disabled={safetyChecks.size === 0}
          >
            <span className="flex items-center gap-2">
              <span>המשך לאנמנזה</span>
              <span>←</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ===== Phase 2: Anamnesis Dialogue =====
  if (phase === "anamnesis") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}

        <div className="p-4 rounded-2xl bg-gradient-to-bl from-slate-50 to-blue-50/30 border border-slate-200 text-slate-800 leading-relaxed">
          <div className="text-xs text-slate-500 mb-1 font-bold flex items-center gap-1">
            <span>🚑</span>
            <span>הגעת לזירה - תיאור המקרה:</span>
          </div>
          <div>{c.scenario}</div>
          {c.patient.vitalsAtArrival && (
            <div className="mt-3 p-2 rounded-xl bg-white/80 text-sm border border-blue-200">
              <strong className="text-blue-800">📊 מדדים בהגעה:</strong> {c.patient.vitalsAtArrival}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Speak text={`${c.scenario}. גיל ${c.patient.age}, ${c.patient.sex}. ${c.patient.vitalsAtArrival || ""}`} label="🔊 הקרא מקרה" />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-extrabold flex items-center gap-2">
              <span>🎯</span>
              <span>בצעו אנמנזה - שאלו את המטופל</span>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${
              reachedLimit
                ? "bg-red-100 text-red-700"
                : questionsAsked >= MAX_QUESTIONS - 2
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}>
              {questionsAsked} / {MAX_QUESTIONS} שאלות
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            💡 לחצו על המיקרופון, שאלו את שאלתכם בקול, והמטופל יענה מיד. סופרים לכם {MAX_QUESTIONS} שאלות סך הכל.
          </p>

          {reachedLimit ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-sm font-bold text-amber-900 mb-1">
                סיימת את {MAX_QUESTIONS} השאלות המותרות
              </div>
              <div className="text-xs text-amber-700">
                כך זה גם בשטח - לא תמיד יש זמן לכל השאלות. עבור לאבחנה.
              </div>
            </div>
          ) : (
            <Mic
              onPartial={t => setCurrentTranscript(t)}
              onFinish={handleAnamnesisFinish}
              disabled={loadingFeedback}
              partialBufferRef={anamnesisPartialRef}
            />
          )}
          {currentTranscript && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
              <div className="text-xs text-blue-700 mb-1 font-bold">⚡ תמלול חי:</div>
              {currentTranscript}
            </div>
          )}
        </div>

        {/* Conversation history */}
        {turns.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <div className="text-xs font-bold text-slate-700 mb-2">💬 שיח עד כה ({turns.length} שאלות):</div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {turns.map((t) => (
                <div key={t.id} className="space-y-1">
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-sm">
                    <strong className="text-teal-700 text-xs">חובש:</strong> {t.userQuestion}
                  </div>
                  {t.loadingAnswer && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-sm mr-6 inline-flex items-center gap-2">
                      <span className="inline-block animate-spin">⚙️</span>
                      <span className="text-amber-800">המטופל חושב...</span>
                    </div>
                  )}
                  {t.patientAnswer && !t.loadingAnswer && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-sm mr-6">
                      <strong className="text-amber-800 text-xs">מטופל:</strong> {t.patientAnswer}
                      <button
                        onClick={() => speak(t.patientAnswer!, {})}
                        className="mr-2 text-xs text-amber-700 underline"
                      >
                        🔊 השמע
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <button
            onClick={() => { stopSpeaking(); setPhase("safety"); }}
            className="btn-ghost text-sm"
          >
            → חזרה לבטיחות
          </button>
          <button
            onClick={() => { stopSpeaking(); setPhase("diagnosis"); }}
            className="btn-primary"
            disabled={turns.length === 0}
          >
            <span className="flex items-center gap-2">
              <span>סיום אנמנזה ← אבחנה</span>
              <span>←</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ===== Phase 3: Diagnosis selection =====
  if (phase === "diagnosis") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}

        <div className="text-sm leading-relaxed">
          <div className="font-extrabold flex items-center gap-2 mb-2">
            <span>🩺</span>
            <span>מהי האבחנה החשודה?</span>
          </div>
          <p className="text-xs text-slate-600">
            על בסיס האנמנזה שביצעת ({turns.length} שאלות) ומדדי המטופל - מה הסביר ביותר?
          </p>
        </div>

        <div className="space-y-3">
          {extras?.differentialDiagnosis.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitForFeedback(i)}
              className="w-full text-right p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 active:scale-95 transition font-medium"
              disabled={loadingFeedback}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-extrabold shrink-0">
                  {String.fromCharCode(1488 + i)}
                </span>
                <span className="flex-1">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => { stopSpeaking(); setPhase("anamnesis"); }}
          className="btn-ghost text-sm w-full"
        >
          → חזרה לאנמנזה - אני רוצה לשאול עוד
        </button>
      </div>
    );
  }

  // ===== Phase 4: Feedback =====
  const selectedDx = selectedDiagnosis !== null ? extras?.differentialDiagnosis[selectedDiagnosis] : undefined;
  const correctDx = extras?.differentialDiagnosis.find(d => d.correct);
  const dxWasCorrect = selectedDx?.correct === true;

  return (
    <div className="card slide-in space-y-5">
      {ProgressHeader}

      {loadingFeedback && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
            <span className="inline-block animate-spin">⚙️</span>
            <span>מנתח את האנמנזה והאבחנה...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
          <div className="flex-1">
            <div className="font-bold mb-1">⚠️ {error}</div>
            <div className="text-xs text-red-600">
              ייתכן שהרשת לא יציבה. ניתן לנסות שוב או לעבור הלאה.
            </div>
          </div>
          {selectedDiagnosis !== null && (
            <button
              onClick={retryFeedback}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 shrink-0"
              disabled={loadingFeedback}
            >
              🔄 נסה שוב
            </button>
          )}
        </div>
      )}

      {!loadingFeedback && feedback && (
        <div className="space-y-4 fade-up">
          {/* Score summary */}
          <div className="text-center pt-2">
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

          {/* Safety score */}
          <div className={`p-3 rounded-2xl border ${safetyScore >= 70 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="text-sm font-extrabold mb-1 flex items-center gap-2">
              <span>🦺</span>
              <span>בטיחות ותקשורת מוקד: {safetyScore}%</span>
            </div>
            <div className="text-xs text-slate-600">
              כיסית {safetyChecks.size} מתוך {SAFETY_PHRASES.length} פעולות בטיחות
            </div>
          </div>

          {/* Diagnosis feedback */}
          {selectedDx && (
            <div className={`p-4 rounded-2xl border-2 ${dxWasCorrect ? "bg-emerald-50 border-emerald-400" : "bg-red-50 border-red-400"}`}>
              <div className="text-sm font-extrabold mb-2 flex items-center gap-2">
                <span className="text-2xl">{dxWasCorrect ? "✅" : "❌"}</span>
                <span>{dxWasCorrect ? "אבחנה נכונה!" : "אבחנה לא נכונה"}</span>
              </div>
              <div className="text-sm font-bold mb-2">בחרת: {selectedDx.label}</div>
              <div className="text-xs leading-relaxed text-slate-700 mb-3">{selectedDx.explanation}</div>
              {!dxWasCorrect && correctDx && (
                <div className="p-3 rounded-xl bg-white/80 border border-emerald-200 text-xs">
                  <div className="font-bold text-emerald-800 mb-1">💡 האבחנה הנכונה: {correctDx.label}</div>
                  <div className="text-slate-700">{correctDx.explanation}</div>
                </div>
              )}
            </div>
          )}

          {/* Covered points */}
          {feedback.covered.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-sm font-extrabold text-emerald-800 mb-2 flex items-center gap-2">
                <span>✅</span>
                <span>שאלת בהתאם למקרה ({feedback.covered.length}):</span>
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

          {/* Missed points */}
          {feedback.missed.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-sm font-extrabold text-red-800 mb-2 flex items-center gap-2">
                <span>❌</span>
                <span>שאלות חסרות ({feedback.missed.length}):</span>
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

          {/* Logical order */}
          {feedback.logicalOrder && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-sm">
              <div className="font-extrabold mb-1 flex items-center gap-2">
                <span>🧩</span>
                <span>סדר לוגי: {feedback.logicalOrder.score}/100</span>
              </div>
              <div className="leading-relaxed">{feedback.logicalOrder.comment}</div>
            </div>
          )}

          {/* Additional questions */}
          {feedback.additionalQuestions && feedback.additionalQuestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
              <div className="font-extrabold mb-2 flex items-center gap-2">
                <span>📚</span>
                <span>שאלות נוספות שיכלת לשאול:</span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                {feedback.additionalQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestions && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm">
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
        <button onClick={onNext} className="btn-primary" disabled={!feedback && !error}>
          <span className="flex items-center gap-2">
            <span>המשך</span>
            <span>←</span>
          </span>
        </button>
      </div>
    </div>
  );
}
