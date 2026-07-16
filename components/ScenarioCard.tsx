"use client";
import { useEffect, useRef, useState } from "react";
import { Scenario } from "@/data/scenarios";
import Speak from "./Speak";
import Mic from "./Mic";
import { speak, stopSpeaking } from "@/lib/speech";
import { milestoneEmoji } from "@/lib/gamification";

type Phase =
  | "dispatch"   // קליטת קריאה
  | "scene"      // הגעה+בטיחות+PPE
  | "primary"    // XABCDE
  | "vitals"     // מדדים
  | "dialogue"   // שיחה עם מטופל
  | "treatment"  // טיפול
  | "transport"  // פינוי
  | "feedback";  // משוב

const PHASE_INFO: Record<Phase, { label: string; emoji: string }> = {
  dispatch:  { label: "1. קליטת קריאה", emoji: "📻" },
  scene:     { label: "2. הגעה ובטיחות", emoji: "🦺" },
  primary:   { label: "3. גישה ראשונה - XABCDE", emoji: "🩺" },
  vitals:    { label: "4. מדדים חיוניים", emoji: "📊" },
  dialogue:  { label: "5. שיחה עם המטופל", emoji: "💬" },
  treatment: { label: "6. טיפול", emoji: "💉" },
  transport: { label: "7. החלטת פינוי", emoji: "🚑" },
  feedback:  { label: "8. משוב מקיף", emoji: "📋" }
};

const PHASE_ORDER: Phase[] = ["dispatch", "scene", "primary", "vitals", "dialogue", "treatment", "transport", "feedback"];

// Hebrew word-boundary check (matches /api/dialogue logic)
const ALLOWED_PREFIXES = ["", "ה", "ו", "ש", "ב", "ל", "כ", "וה", "וב", "ול"];
const normalize = (s: string) =>
  s.replace(/[֑-ׇ]/g, "").replace(/[״׳"'.,!?;:()־-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const containsWord = (text: string, keyword: string): boolean => {
  if (!keyword) return false;
  const t = normalize(text);
  const k = normalize(keyword);
  if (k.includes(" ")) return t.includes(k);
  return t.split(/\s+/).some(w => ALLOWED_PREFIXES.some(p => w.startsWith(p + k) && w.length - (p + k).length <= 3));
};

type Props = {
  scenario: Scenario;
  onComplete: (result: { overallScore: number; phasesCompleted: number }) => void;
  onExit: () => void;
};

export default function ScenarioCard({ scenario, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("dispatch");
  const partialRef = useRef("");
  const [currentTranscript, setCurrentTranscript] = useState("");

  // Phase logs - what user said + completed actions per phase
  const [phaseSpoken, setPhaseSpoken] = useState<Record<Phase, string[]>>({} as any);
  const [completedActions, setCompletedActions] = useState<Record<Phase, Set<string>>>({} as any);

  // Primary survey: track current step (X→A→B→C→D→E)
  const [primaryStep, setPrimaryStep] = useState<"x" | "a" | "b" | "c" | "d" | "e" | "done">("x");
  const [primaryFindings, setPrimaryFindings] = useState<Partial<Record<"x" | "a" | "b" | "c" | "d" | "e", string>>>({});

  // Vitals: which have been requested
  const [vitalsRequested, setVitalsRequested] = useState<Set<string>>(new Set());

  // Dialogue (reuses anamnesis-style)
  type Turn = { id: string; q: string; a: string | null; loading?: boolean };
  const [turns, setTurns] = useState<Turn[]>([]);

  // Treatment selections
  const [selectedTreatments, setSelectedTreatments] = useState<Set<string>>(new Set());

  // Transport
  const [transportChoice, setTransportChoice] = useState<number | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const logSpoken = (p: Phase, text: string) => {
    setPhaseSpoken(prev => ({ ...prev, [p]: [...(prev[p] || []), text] }));
  };
  const markComplete = (p: Phase, action: string) => {
    setCompletedActions(prev => {
      const s = new Set(prev[p] || []);
      s.add(action);
      return { ...prev, [p]: s };
    });
  };

  // ===== Phase 1: Dispatch =====
  const handleDispatchFinish = (text: string) => {
    const t = text.trim();
    if (!t) return;
    logSpoken("dispatch", t);
    if (scenario.dispatch.acceptKeywords.some(kw => containsWord(t, kw))) {
      markComplete("dispatch", "אישור קליטה");
      // Auto-advance after 1s
      setTimeout(() => setPhase("scene"), 800);
    }
    setCurrentTranscript("");
    partialRef.current = "";
  };

  // ===== Phase 2: Scene safety =====
  const handleSceneFinish = (text: string) => {
    const t = text.trim();
    if (!t) return;
    logSpoken("scene", t);
    for (const item of scenario.scene.safetyChecklist) {
      if (item.keywords.some(kw => containsWord(t, kw))) {
        markComplete("scene", item.label);
      }
    }
    setCurrentTranscript("");
    partialRef.current = "";
  };

  // ===== Phase 3: Primary survey - sequential =====
  const PRIMARY_NEXT: Record<string, "x" | "a" | "b" | "c" | "d" | "e" | "done"> = {
    x: "a", a: "b", b: "c", c: "d", d: "e", e: "done", done: "done"
  };
  const handlePrimaryFinish = (text: string) => {
    const t = text.trim();
    if (!t) return;
    logSpoken("primary", t);
    if (primaryStep === "done") return;
    const currentStep = primaryStep; // narrows to non-"done"
    const step = scenario.primary[currentStep];
    if (step.keywords.some(kw => containsWord(t, kw))) {
      markComplete("primary", `${currentStep.toUpperCase()}: ${step.check}`);
      setPrimaryFindings(prev => ({ ...prev, [currentStep]: step.finding }));
      try { speak(step.finding, {}); } catch {}
      setPrimaryStep(PRIMARY_NEXT[currentStep]);
    }
    setCurrentTranscript("");
    partialRef.current = "";
  };

  // ===== Phase 4: Vitals =====
  const handleVitalsFinish = (text: string) => {
    const t = text.trim();
    if (!t) return;
    logSpoken("vitals", t);
    for (const v of scenario.vitals) {
      if (vitalsRequested.has(v.name)) continue;
      if (v.keywords.some(kw => containsWord(t, kw))) {
        setVitalsRequested(prev => {
          const s = new Set(prev);
          s.add(v.name);
          return s;
        });
        markComplete("vitals", v.name);
        try { speak(`${v.name}: ${v.value}`, {}); } catch {}
      }
    }
    setCurrentTranscript("");
    partialRef.current = "";
  };

  // ===== Phase 5: Patient dialogue =====
  const ANSWER_TRIGGER = /(תענה|ענה|תגיד|תאמר|תספר|תסביר)\s+(לי|לנו|לו|לה)/;
  const handleDialogueFinish = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    logSpoken("dialogue", trimmed);
    markComplete("dialogue", "שאלת שאלה");

    const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const wants = ANSWER_TRIGGER.test(trimmed);
    setTurns(prev => [...prev, { id: turnId, q: trimmed, a: null, loading: wants }]);
    setCurrentTranscript("");
    partialRef.current = "";
    if (!wants) return;

    try {
      const res = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: scenario.id,
          userQuestion: trimmed,
          history: turns.map(t => ({ q: t.q, a: t.a })),
          // Provide patientResponses as fallback context
          fallbackResponses: scenario.patientResponses
        })
      });
      const data = await res.json();
      // If AI didn't return an answer, fall back to local responses
      let answer: string = data.answer || "";
      if (!answer) {
        const match = scenario.patientResponses.find(r =>
          r.keywords.some(kw => containsWord(trimmed, kw))
        );
        answer = match?.answer || "אני לא בטוח, תוכל לשאול בדרך אחרת?";
      }
      setTurns(prev => prev.map(t => t.id === turnId ? { ...t, a: answer, loading: false } : t));
      try { speak(answer, {}); } catch {}
    } catch {
      // Local fallback
      const match = scenario.patientResponses.find(r =>
        r.keywords.some(kw => containsWord(trimmed, kw))
      );
      const answer = match?.answer || "אני לא בטוח, תוכל לשאול בדרך אחרת?";
      setTurns(prev => prev.map(t => t.id === turnId ? { ...t, a: answer, loading: false } : t));
      try { speak(answer, {}); } catch {}
    }
  };

  // ===== Phase 6: Treatment selection (toggle correct/wrong) =====
  const handleTreatmentFinish = (text: string) => {
    const t = text.trim();
    if (!t) return;
    logSpoken("treatment", t);
    for (const tx of scenario.treatments.correct) {
      if (tx.keywords.some(kw => containsWord(t, kw))) {
        setSelectedTreatments(prev => {
          const s = new Set(prev);
          s.add(`correct:${tx.name}`);
          return s;
        });
        markComplete("treatment", tx.name);
        try { speak("בוצע: " + tx.name, {}); } catch {}
      }
    }
    for (const tx of scenario.treatments.contraindicated) {
      if (tx.keywords.some(kw => containsWord(t, kw))) {
        setSelectedTreatments(prev => {
          const s = new Set(prev);
          s.add(`wrong:${tx.name}`);
          return s;
        });
        try { speak("⚠️ זהירות: " + tx.reason, {}); } catch {}
      }
    }
    setCurrentTranscript("");
    partialRef.current = "";
  };

  // ===== Phase 7→8: Submit for AI feedback =====
  const submitFeedback = async (chosenTransportIdx: number) => {
    setTransportChoice(chosenTransportIdx);
    setLoadingFeedback(true);
    setError(null);
    setPhase("feedback");
    try {
      const payload = {
        scenarioId: scenario.id,
        phases: PHASE_ORDER.filter(p => p !== "feedback").map(p => {
          const spoken = phaseSpoken[p] || [];
          const completed = Array.from(completedActions[p] || []);
          let expected: string[] = [];
          if (p === "dispatch") expected = ["אישור קליטה"];
          else if (p === "scene") expected = scenario.scene.safetyChecklist.filter(s => s.critical).map(s => s.label);
          else if (p === "primary") expected = (["x","a","b","c","d","e"] as const).map(k => `${k.toUpperCase()}: ${scenario.primary[k].check}`);
          else if (p === "vitals") expected = scenario.vitals.map(v => v.name);
          else if (p === "dialogue") expected = ["שאל לפחות 3 שאלות עם 'תענה לי'"];
          else if (p === "treatment") expected = scenario.treatments.correct.map(t => t.name);
          const missed = expected.filter(e => !completed.includes(e));
          const wrongActions = Array.from(selectedTreatments).filter(s => s.startsWith("wrong:")).map(s => s.slice(6));
          return {
            phase: PHASE_INFO[p].label,
            userSpoke: spoken,
            expectedActions: expected,
            completedActions: completed,
            missedActions: missed,
            wrongActions: p === "treatment" ? wrongActions : []
          };
        }),
        transportChoice: chosenTransportIdx
      };

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 55000);
      const res = await fetch("/api/scenario-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFeedback(data);
      onComplete({ overallScore: data.overallScore, phasesCompleted: 7 });
    } catch (e: any) {
      setError(e?.message || "שגיאת רשת");
    } finally {
      setLoadingFeedback(false);
    }
  };

  // ===== Phase progress header =====
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const ProgressHeader = (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="badge bg-gradient-to-l from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
          {scenario.emoji} תרחיש · {scenario.topic}
        </span>
        <button onClick={onExit} className="text-xs text-slate-500 underline">← יציאה</button>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1 text-[10px] text-center">
        {PHASE_ORDER.map((p, i) => {
          const active = p === phase;
          const done = phaseIdx > i;
          return (
            <div
              key={p}
              className={`py-1 px-1 rounded-lg font-bold transition ${
                active ? "bg-orange-500 text-white shadow"
                : done ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
              }`}
            >
              {done ? "✓ " : ""}{i + 1}
            </div>
          );
        })}
      </div>
      <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
        <span className="text-3xl">{scenario.emoji}</span>
        <span>{scenario.title}</span>
      </h2>
      <div className="text-sm text-orange-700 font-bold flex items-center gap-1">
        <span>{PHASE_INFO[phase].emoji}</span>
        <span>{PHASE_INFO[phase].label}</span>
      </div>
    </div>
  );

  // ===================== PHASE 1: DISPATCH =====================
  if (phase === "dispatch") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="text-xs font-bold text-blue-700 mb-2">📻 קריאת מוקד (יוקרא בקול):</div>
          <div className="text-sm leading-relaxed">{scenario.dispatch.text}</div>
          <div className="mt-3"><Speak text={scenario.dispatch.text} label="🔊 הקרא קריאה" /></div>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-600 mb-3">
            💡 אמור באקראי: <strong>"קיבלתי, יוצא לקריאה"</strong> או דומה. המערכת תעבור אוטומטית לשלב הבא.
          </p>
          <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handleDispatchFinish} partialBufferRef={partialRef} />
          {currentTranscript && <div className="mt-3 p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
          {(phaseSpoken.dispatch || []).length > 0 && (
            <div className="mt-2 text-xs text-slate-600">אמרת: {(phaseSpoken.dispatch || []).join(" / ")}</div>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={() => setPhase("scene")} className="btn-primary" disabled={(completedActions.dispatch?.size || 0) === 0}>
            המשך לבטיחות ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 2: SCENE =====================
  if (phase === "scene") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-700 mb-2">🚨 הגעה לזירה (יוקרא בקול):</div>
          <div className="text-sm leading-relaxed">{scenario.scene.description}</div>
          <div className="mt-3"><Speak text={scenario.scene.description} label="🔊 הקרא תיאור זירה" /></div>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <div className="text-sm font-bold mb-2">🦺 פעולות נדרשות:</div>
          <div className="space-y-2 mb-3">
            {scenario.scene.safetyChecklist.map(item => {
              const done = completedActions.scene?.has(item.label);
              return (
                <div key={item.label} className={`p-2 rounded-xl border text-sm flex items-center gap-2 ${
                  done ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200"
                }`}>
                  <span>{done ? "✅" : "⬜"}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.critical && !done && <span className="badge bg-red-100 text-red-700 text-[10px]">חשוב</span>}
                </div>
              );
            })}
          </div>
          <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handleSceneFinish} partialBufferRef={partialRef} />
          {currentTranscript && <div className="mt-3 p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
        </div>
        <div className="flex justify-end">
          <button onClick={() => setPhase("primary")} className="btn-primary" disabled={(completedActions.scene?.size || 0) === 0}>
            המשך ל-XABCDE ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 3: PRIMARY SURVEY =====================
  if (phase === "primary") {
    const stepDef = primaryStep !== "done" ? scenario.primary[primaryStep] : null;
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="text-sm">
          <div className="font-extrabold mb-2 flex items-center gap-2"><span>🩺</span><span>גישה ראשונה - XABCDE</span></div>
          <p className="text-xs text-slate-600">בצע כל שלב לפי הסדר. אמור מה אתה בודק - המערכת תספר לך את הממצא.</p>
        </div>
        <div className="space-y-2">
          {(["x","a","b","c","d","e"] as const).map(k => {
            const def = scenario.primary[k];
            const finding = primaryFindings[k];
            const isCurrent = primaryStep === k;
            const isDone = !!finding;
            return (
              <div key={k} className={`p-3 rounded-xl border-2 ${
                isDone ? "bg-emerald-50 border-emerald-300"
                : isCurrent ? "bg-orange-50 border-orange-400 shadow-md"
                : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm ${
                    isDone ? "bg-emerald-500 text-white"
                    : isCurrent ? "bg-orange-500 text-white"
                    : "bg-slate-300 text-slate-600"
                  }`}>{k.toUpperCase()}</span>
                  <span className="font-bold text-sm">{def.check}</span>
                </div>
                {isDone && <div className="text-xs text-emerald-800 leading-relaxed mt-1 mr-9">{finding}</div>}
                {def.criticalAction && isDone && <div className="text-xs text-red-700 font-bold mt-1 mr-9">⚠️ {def.criticalAction}</div>}
              </div>
            );
          })}
        </div>
        {primaryStep !== "done" && stepDef && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-300">
            <div className="text-xs font-bold text-orange-800 mb-1">השלב הנוכחי: {primaryStep.toUpperCase()}</div>
            <div className="text-sm">אמור: <strong>"בודק {stepDef.check}"</strong> או דומה</div>
          </div>
        )}
        <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handlePrimaryFinish} partialBufferRef={partialRef} />
        {currentTranscript && <div className="p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
        <div className="flex justify-end">
          <button onClick={() => setPhase("vitals")} className="btn-primary" disabled={primaryStep !== "done"}>
            המשך למדדים ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 4: VITALS =====================
  if (phase === "vitals") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="text-sm">
          <div className="font-extrabold mb-2 flex items-center gap-2"><span>📊</span><span>מדדים חיוניים</span></div>
          <p className="text-xs text-slate-600">בקש כל מדד בקול. למשל: <em>"לחץ דם", "סטורציה", "סוכר"</em>.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {scenario.vitals.map(v => {
            const got = vitalsRequested.has(v.name);
            return (
              <div key={v.name} className={`p-3 rounded-xl border-2 text-sm ${
                got ? (v.abnormal ? "bg-red-50 border-red-300" : "bg-emerald-50 border-emerald-300")
                : "bg-slate-50 border-slate-200"
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <span>{got ? (v.abnormal ? "🔴" : "✅") : "⬜"}</span>
                  <span>{v.name}</span>
                </div>
                <div className="text-xs">{got ? v.value : "לא נמדד"}</div>
              </div>
            );
          })}
        </div>
        <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handleVitalsFinish} partialBufferRef={partialRef} />
        {currentTranscript && <div className="p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">{vitalsRequested.size}/{scenario.vitals.length} מדדים נבדקו</span>
          <button onClick={() => setPhase("dialogue")} className="btn-primary" disabled={vitalsRequested.size < 3}>
            המשך לשיחה ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 5: DIALOGUE =====================
  if (phase === "dialogue") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="text-sm">
          <div className="font-extrabold mb-2 flex items-center gap-2"><span>💬</span><span>שיחה עם המטופל</span></div>
          <p className="text-xs text-slate-600">
            💡 שאל ביופי, וסיים את השאלה ב-<strong>"תענה לי"</strong> כדי לקבל תשובה (AI). דוגמה: <em>"מה כואב לך? תענה לי"</em>
          </p>
        </div>
        <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handleDialogueFinish} partialBufferRef={partialRef} />
        {currentTranscript && <div className="p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
        {turns.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-y-auto border-t pt-3">
            <div className="text-xs font-bold">שיח עד כה ({turns.length}):</div>
            {turns.map(t => (
              <div key={t.id} className="space-y-1">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-sm">
                  <strong className="text-teal-700 text-xs">חובש:</strong> {t.q}
                </div>
                {t.loading && (
                  <div className="p-2 rounded-xl bg-amber-50 border text-xs mr-6 flex items-center gap-2">
                    <span className="animate-spin">⚙️</span><span>המטופל חושב...</span>
                  </div>
                )}
                {t.a && !t.loading && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-sm mr-6">
                    <strong className="text-amber-800 text-xs">מטופל:</strong> {t.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">{turns.length} שאלות נשאלו</span>
          <button onClick={() => setPhase("treatment")} className="btn-primary" disabled={turns.length < 3}>
            המשך לטיפול ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 6: TREATMENT =====================
  if (phase === "treatment") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="text-sm">
          <div className="font-extrabold mb-2 flex items-center gap-2"><span>💉</span><span>טיפול</span></div>
          <p className="text-xs text-slate-600">אמור בקול את הפעולות שאתה מבצע. למשל: <em>"מתן חמצן 15 ליטר", "אספירין 250"</em>. המערכת תזהה ותסמן.</p>
        </div>
        <div className="space-y-2">
          {scenario.treatments.correct.map(tx => {
            const done = selectedTreatments.has(`correct:${tx.name}`);
            return (
              <div key={tx.name} className={`p-3 rounded-xl border-2 text-sm ${
                done ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{done ? "✅" : "⬜"}</span>
                  <span className="font-bold flex-1">{tx.name}</span>
                </div>
                {done && <div className="text-xs text-slate-600 mt-1 mr-6">{tx.rationale}</div>}
              </div>
            );
          })}
        </div>
        {Array.from(selectedTreatments).filter(s => s.startsWith("wrong:")).length > 0 && (
          <div className="p-3 rounded-xl bg-red-50 border-2 border-red-300 text-sm">
            <div className="font-bold text-red-800 mb-1">⚠️ פעולות שגויות שביצעת:</div>
            {Array.from(selectedTreatments).filter(s => s.startsWith("wrong:")).map(s => {
              const name = s.slice(6);
              const t = scenario.treatments.contraindicated.find(t => t.name === name);
              return (
                <div key={s} className="text-xs text-red-700 mt-1">
                  <strong>{name}:</strong> {t?.reason}
                </div>
              );
            })}
          </div>
        )}
        <Mic onPartial={t => setCurrentTranscript(t)} onFinish={handleTreatmentFinish} partialBufferRef={partialRef} />
        {currentTranscript && <div className="p-2 rounded-xl bg-blue-50 border text-sm">{currentTranscript}</div>}
        <div className="flex justify-end">
          <button onClick={() => setPhase("transport")} className="btn-primary" disabled={(completedActions.treatment?.size || 0) === 0}>
            המשך לפינוי ←
          </button>
        </div>
      </div>
    );
  }

  // ===================== PHASE 7: TRANSPORT =====================
  if (phase === "transport") {
    return (
      <div className="card slide-in space-y-5">
        {ProgressHeader}
        <div className="text-sm">
          <div className="font-extrabold mb-2 flex items-center gap-2"><span>🚑</span><span>החלטת פינוי</span></div>
          <p className="text-xs text-slate-600">בחר את אופן הפינוי המתאים ביותר למקרה.</p>
        </div>
        <div className="space-y-3">
          {scenario.transport.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitFeedback(i)}
              className="w-full text-right p-4 rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 active:scale-95 transition font-medium"
              disabled={loadingFeedback}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-extrabold shrink-0">
                  {String.fromCharCode(1488 + i)}
                </span>
                <span className="flex-1">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===================== PHASE 8: FEEDBACK =====================
  return (
    <div className="card slide-in space-y-5">
      {ProgressHeader}
      {loadingFeedback && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
            <span className="animate-spin">⚙️</span>
            <span>מנתח את ביצועך בכל השלבים...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          {error} - תוכל לחזור לתפריט.
        </div>
      )}
      {feedback && (
        <div className="space-y-4 fade-up">
          <div className="text-center pt-2">
            <div className="text-6xl mb-2 pop-in">{milestoneEmoji(feedback.overallScore)}</div>
            <div className="text-3xl font-black">
              <span className={feedback.overallScore >= 70 ? "text-emerald-600" : feedback.overallScore >= 50 ? "text-amber-600" : "text-red-600"}>
                {feedback.overallScore}
              </span>
              <span className="text-xl text-slate-400">/100</span>
            </div>
            <div className="text-sm text-slate-600 mt-1">ציון משולב לכל התרחיש</div>
          </div>

          {/* Phase scores */}
          <div className="space-y-2">
            <div className="text-sm font-extrabold flex items-center gap-2"><span>📊</span><span>ציונים לפי שלב:</span></div>
            {feedback.phaseScores?.map((p: any, i: number) => (
              <div key={i} className="p-2 rounded-xl bg-slate-50 border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{p.phase}</span>
                  <span className={`font-extrabold ${p.score >= 70 ? "text-emerald-600" : p.score >= 50 ? "text-amber-600" : "text-red-600"}`}>{p.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded mt-1 overflow-hidden">
                  <div className={`h-full ${p.score >= 70 ? "bg-emerald-500" : p.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${p.score}%` }} />
                </div>
                <div className="text-xs text-slate-600 mt-1">{p.comment}</div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {feedback.strengths?.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-sm font-extrabold text-emerald-800 mb-1">✅ חוזקות:</div>
              <ul className="space-y-0.5 text-xs">
                {feedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {feedback.weaknesses?.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-sm font-extrabold text-amber-800 mb-1">⚠️ נקודות לשיפור:</div>
              <ul className="space-y-0.5 text-xs">
                {feedback.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Critical misses */}
          {feedback.criticalMisses?.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50 border-2 border-red-300">
              <div className="text-sm font-extrabold text-red-800 mb-1">🚨 החסרות קריטיות:</div>
              <ul className="space-y-0.5 text-xs text-red-700">
                {feedback.criticalMisses.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Transport eval */}
          {feedback.transportEvaluation && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-sm font-extrabold mb-1">🚑 החלטת הפינוי:</div>
              <div className="text-xs leading-relaxed">{feedback.transportEvaluation}</div>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
              <div className="font-extrabold mb-1">💡 הצעות לשיפור:</div>
              <div className="leading-relaxed">{feedback.suggestions}</div>
            </div>
          )}

          {/* Model answer */}
          <details className="border-t pt-3">
            <summary className="cursor-pointer btn-ghost text-sm font-bold">📖 הצג ביצוע אופטימלי</summary>
            <div className="p-3 rounded-xl bg-slate-50 border text-xs leading-relaxed mt-2">{scenario.modelResponse}</div>
          </details>
        </div>
      )}
      <div className="flex justify-end pt-3">
        <button onClick={onExit} className="btn-primary">סיום ←</button>
      </div>
    </div>
  );
}
