import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { scenarios } from "@/data/scenarios";

export const runtime = "nodejs";
export const maxDuration = 30;

type PhaseLog = {
  phase: string;
  userSpoke: string[];     // All things user said in this phase
  expectedActions: string[]; // Actions that were expected
  completedActions: string[]; // Actions actually detected
  missedActions: string[];   // Things they should have done but didn't
  wrongActions?: string[];   // Things they did that shouldn't have done
};

type ScenarioFeedbackRequest = {
  scenarioId: string;
  phases: PhaseLog[];
  transportChoice: number; // Index of selected transport option
  totalDurationMs?: number;
};

type Feedback = {
  overallScore: number;
  phaseScores: { phase: string; score: number; comment: string }[];
  strengths: string[];
  weaknesses: string[];
  criticalMisses: string[];
  transportEvaluation: string;
  suggestions: string;
  source: "ai" | "heuristic";
};

const heuristicFeedback = (req: ScenarioFeedbackRequest, sc: any): Feedback => {
  const phaseScores: Feedback["phaseScores"] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const criticalMisses: string[] = [];

  for (const p of req.phases) {
    const total = p.expectedActions.length || 1;
    const done = p.completedActions.length;
    const score = Math.round((done / total) * 100);
    phaseScores.push({
      phase: p.phase,
      score,
      comment: score >= 80
        ? "כיסוי טוב של הפעולות"
        : score >= 50
        ? "כיסוי חלקי - יש מקום לשיפור"
        : "כיסוי חסר - חזרה נדרשת"
    });

    if (score >= 80) strengths.push(`✓ ${p.phase}: כיסית ${done}/${total} פעולות`);
    if (p.missedActions.length > 0) {
      weaknesses.push(`✗ ${p.phase}: החסרת - ${p.missedActions.join(", ")}`);
      criticalMisses.push(...p.missedActions.filter(a => a.includes("בטיחות") || a.includes("דימום") || a.includes("נתיב אוויר")));
    }
  }

  const overall = phaseScores.length ? Math.round(phaseScores.reduce((s, p) => s + p.score, 0) / phaseScores.length) : 0;

  // Transport eval
  const correctIdx = sc.transport.options.findIndex((o: any) => o.correct);
  const userOpt = sc.transport.options[req.transportChoice];
  const transportEval = req.transportChoice === correctIdx
    ? `✓ נכון: ${userOpt?.label}. ${userOpt?.explanation}`
    : `✗ לא נכון. בחרת: ${userOpt?.label}. הנכון: ${sc.transport.options[correctIdx].label}. ${sc.transport.options[correctIdx].explanation}`;

  return {
    overallScore: overall,
    phaseScores,
    strengths,
    weaknesses,
    criticalMisses,
    transportEvaluation: transportEval,
    suggestions: criticalMisses.length > 0
      ? `יש פעולות קריטיות שהוחסרו. חזור על הפרוטוקול - XABCDE / MARCH. כל פעולה קריטית = הצלת חיים.`
      : `ביצוע טוב. ככל שתתאמן יותר - הפעולות יהיו שיגרתיות ובטוחות יותר.`,
    source: "heuristic"
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScenarioFeedbackRequest;
    if (!body.scenarioId || !Array.isArray(body.phases)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    const sc = scenarios.find(s => s.id === body.scenarioId);
    if (!sc) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    // No API key → heuristic
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(heuristicFeedback(body, sc));
    }

    // AI path
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const phasesTxt = body.phases.map(p => `
== ${p.phase} ==
מה המשתמש אמר: ${p.userSpoke.join(" | ") || "(שום דבר)"}
פעולות שהיו צפויות: ${p.expectedActions.join(", ")}
פעולות שזוהו: ${p.completedActions.join(", ") || "(אין)"}
החסר: ${p.missedActions.join(", ") || "(אין)"}
${p.wrongActions?.length ? `פעולות שגויות: ${p.wrongActions.join(", ")}` : ""}
`).join("\n");

    const correctTransport = sc.transport.options.find(o => o.correct);
    const userTransport = sc.transport.options[body.transportChoice];

    const systemPrompt = `אתה מורה בכיר ל-PHTLS בעברית. עליך לתת משוב מקיף ומקצועי על ביצוע תרחיש שטח של חובש.
ענה ב-JSON תקין בלבד. מבנה:
{
  "overallScore": <0-100>,
  "phaseScores": [{"phase": "<שם>", "score": <0-100>, "comment": "<משפט קצר>"}],
  "strengths": ["<חוזק 1>", "<חוזק 2>"],
  "weaknesses": ["<חולשה 1>", "<חולשה 2>"],
  "criticalMisses": ["<החסרה קריטית 1>"],
  "transportEvaluation": "<משפט הערכת הפינוי>",
  "suggestions": "<2-3 משפטים של הצעות שיפור>",
  "source": "ai"
}
תן עדיפות לפעולות מצילות חיים: דימום מסיבי, נתיב אוויר, בטיחות. אם בטיחות אישית הוחסרה - זו טעות חמורה. רק עברית.`;

    const userPrompt = `תרחיש: ${sc.title} (${sc.topic})
תיאור: ${sc.dispatch.text}

ביצוע המתלמד לפי שלבים:
${phasesTxt}

בחירת פינוי: "${userTransport?.label || "?"}" (הנכון: "${correctTransport?.label}").

תן משוב JSON.`;

    const completion = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const txt = completion.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    try {
      const cleaned = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      return NextResponse.json(JSON.parse(cleaned));
    } catch {
      return NextResponse.json(heuristicFeedback(body, sc));
    }
  } catch (e: any) {
    console.error("/api/scenario-feedback error", e);
    try {
      const body = (await req.clone().json()) as ScenarioFeedbackRequest;
      const sc = scenarios.find(s => s.id === body.scenarioId);
      if (sc) return NextResponse.json(heuristicFeedback(body, sc));
    } catch {}
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
