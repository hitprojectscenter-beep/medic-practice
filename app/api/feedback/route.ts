import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cases } from "@/data/cases";

export const runtime = "nodejs";
export const maxDuration = 60;

type Feedback = {
  score: number;
  covered: { label: string; weight: string }[];
  missed: { label: string; weight: string; rationale: string }[];
  logicalOrder?: { score: number; comment: string };
  additionalQuestions?: string[];
  suggestions: string;
  raw?: string;
};

type Turn = { q: string; a: string | null };

const normalize = (s: string): string =>
  s
    .replace(/[֑-ׇ]/g, "")
    .replace(/[״׳"'.,!?;:()־-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Heuristic fallback (no API key)
const heuristicFeedback = (
  caseId: string,
  transcript: string,
  turns?: Turn[]
): Feedback => {
  const c = cases.find(cc => cc.id === caseId);
  if (!c) {
    return { score: 0, covered: [], missed: [], suggestions: "מקרה לא נמצא" };
  }
  const normalizedTranscript = normalize(transcript);
  const covered: Feedback["covered"] = [];
  const missed: Feedback["missed"] = [];
  let coveredWeight = 0;
  let totalWeight = 0;

  // Track which questions appeared in which order
  const coverageOrder: number[] = [];
  for (let i = 0; i < c.expectedPoints.length; i++) {
    const pt = c.expectedPoints[i];
    const w = pt.weight === "critical" ? 3 : pt.weight === "important" ? 2 : 1;
    totalWeight += w;
    const hit = pt.keywords.some(k => normalizedTranscript.includes(normalize(k)));
    if (hit) {
      covered.push({ label: pt.label, weight: pt.weight });
      coveredWeight += w;
      coverageOrder.push(i);
    } else {
      missed.push({ label: pt.label, weight: pt.weight, rationale: pt.rationale });
    }
  }

  const score = totalWeight ? Math.round((coveredWeight / totalWeight) * 100) : 0;
  const criticalMissed = missed.filter(m => m.weight === "critical");

  // Logical order assessment
  let logicalScore = 100;
  let logicalComment = "סדר הגיוני - שמרת על מבנה מקצועי.";
  if (turns && turns.length > 2) {
    // Check if user followed standard structure: introductions → chief complaint → OPQRST → SAMPLE
    const earlyQuestions = turns.slice(0, 3).map(t => normalize(t.q)).join(" ");
    if (!/(שם|בן\s*כמה|גיל|מה\s*קרה|מה\s*כואב|למה|מה\s*הסיבה)/.test(earlyQuestions)) {
      logicalScore -= 25;
      logicalComment = "התחלת מהר מדי בפרטים ספציפיים. בהמשך, התחל בשאלה פתוחה: 'מה קרה?' / 'מה כואב לך?'";
    }
    if (coverageOrder.length > 4) {
      // Check inversions (jumping back and forth between topics)
      let inversions = 0;
      for (let i = 1; i < coverageOrder.length; i++) {
        if (coverageOrder[i] < coverageOrder[i - 1] - 2) inversions++;
      }
      if (inversions > 2) {
        logicalScore -= 20;
        logicalComment = "השאלות קפצו בין נושאים. נסה לסיים נושא אחד (לדוגמה OPQRST) לפני שעוברים ל-SAMPLE.";
      }
    }
  }

  // Suggest 3 additional questions from missed critical
  const additionalQuestions = criticalMissed
    .slice(0, 4)
    .map(m => `שאל על: ${m.label}`)
    .concat(
      missed.filter(m => m.weight === "important").slice(0, 2).map(m => `כדאי לשאול גם: ${m.label}`)
    )
    .slice(0, 5);

  const suggestions =
    criticalMissed.length > 0
      ? `החסרת ${criticalMissed.length} רכיב/ים קריטי/ים. השתמש בראשי תיבות עזר: OPQRST לכאב, SAMPLE היסטוריה כללית.`
      : "כיסית את הרכיבים הקריטיים. נסה להעמיק בפרטים הנוספים בפעם הבאה.";

  return {
    score,
    covered,
    missed,
    logicalOrder: { score: logicalScore, comment: logicalComment },
    additionalQuestions,
    suggestions,
    raw: "heuristic"
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, transcript, turns, safetyChecks, selectedDiagnosis } = body as {
      caseId: string;
      transcript: string;
      turns?: Turn[];
      safetyChecks?: string[];
      selectedDiagnosis?: number;
    };
    if (!caseId || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing caseId or transcript" }, { status: 400 });
    }
    const c = cases.find(cc => cc.id === caseId);
    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      const fb = heuristicFeedback(caseId, transcript, turns);
      return NextResponse.json(fb);
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const expected = c.expectedPoints
      .map(
        (p, i) =>
          `${i + 1}. ${p.label} [${p.weight}] - מילות מפתח: ${p.keywords.join(", ")} | למה חשוב: ${p.rationale}`
      )
      .join("\n");

    const turnsTxt = turns?.length
      ? turns
          .map(
            (t, i) =>
              `${i + 1}. שאלת חובש: "${t.q}"${t.a ? `\n   תשובת מטופל: "${t.a}"` : ""}`
          )
          .join("\n")
      : "(אין דו-שיח מפורט - רק טקסט גולמי)";

    const systemPrompt = `אתה מורה בכיר לקורס חובשים בעברית.
ענה תמיד ב-JSON תקין בלבד (ללא markdown, ללא טקסט סביב). מבנה:
{
  "score": <0-100>,
  "covered": [{"label":"<תיאור>", "weight":"critical|important|nice-to-have"}],
  "missed":  [{"label":"<תיאור>", "weight":"critical|important|nice-to-have", "rationale":"<למה חשוב>"}],
  "logicalOrder": {"score": <0-100>, "comment": "<משפט אחד על סדר השאלות>"},
  "additionalQuestions": ["<שאלה 1>", "<שאלה 2>", "<שאלה 3>"],
  "suggestions": "<משפט 1-3 הצעות לשיפור>"
}
משקלים: critical=3, important=2, nice-to-have=1. השב סלחני לניסוח חופשי.
הערך גם:
- סדר לוגי (האם הלך מהפתיחה לפרטים, מ-OPQRST ל-SAMPLE, וכו')
- שאלות שאפשר היה לשאול (3-5 שאלות שלא נשאלו אבל היו רלוונטיות)
רק עברית, רק JSON.`;

    const userPrompt = `מקרה: ${c.title}
תיאור: ${c.scenario}
מטופל: גיל ${c.patient.age}, ${c.patient.sex}. ${c.patient.vitalsAtArrival || ""}

רכיבי אנמנזה צפויים:
${expected}

בטיחות שתועדה: ${safetyChecks?.join(", ") || "(אין)"}

דו-שיח החובש עם המטופל:
${turnsTxt}

תמלול כללי של מה שהחובש אמר:
"""
${transcript}
"""

החזר JSON בלבד.`;

    const completion = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const txt = completion.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    try {
      const cleaned = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (e) {
      console.warn("Failed to parse Claude response, falling back to heuristic", txt);
      return NextResponse.json(heuristicFeedback(caseId, transcript, turns));
    }
  } catch (e: any) {
    console.error("/api/feedback error", e);
    try {
      const body = (await req.clone().json()) as {
        caseId: string;
        transcript: string;
        turns?: Turn[];
      };
      return NextResponse.json(heuristicFeedback(body.caseId, body.transcript, body.turns));
    } catch {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
}
