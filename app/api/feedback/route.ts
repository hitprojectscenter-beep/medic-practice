import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cases } from "@/data/cases";

export const runtime = "nodejs";
export const maxDuration = 60;

type Feedback = {
  score: number;
  covered: { label: string; weight: string }[];
  missed: { label: string; weight: string; rationale: string }[];
  suggestions: string;
  raw?: string;
};

// Heuristic fallback: scan transcript for keywords of each expected point
const heuristicFeedback = (caseId: string, transcript: string): Feedback => {
  const c = cases.find(cc => cc.id === caseId);
  if (!c) {
    return { score: 0, covered: [], missed: [], suggestions: "מקרה לא נמצא" };
  }
  const normalizedTranscript = transcript.replace(/[.,?!"']/g, " ").toLowerCase();
  const covered: Feedback["covered"] = [];
  const missed: Feedback["missed"] = [];
  let coveredWeight = 0;
  let totalWeight = 0;

  for (const pt of c.expectedPoints) {
    const w = pt.weight === "critical" ? 3 : pt.weight === "important" ? 2 : 1;
    totalWeight += w;
    const hit = pt.keywords.some(k => normalizedTranscript.includes(k.toLowerCase()));
    if (hit) {
      covered.push({ label: pt.label, weight: pt.weight });
      coveredWeight += w;
    } else {
      missed.push({ label: pt.label, weight: pt.weight, rationale: pt.rationale });
    }
  }

  const score = totalWeight ? Math.round((coveredWeight / totalWeight) * 100) : 0;
  const criticalMissed = missed.filter(m => m.weight === "critical");
  const suggestions =
    criticalMissed.length > 0
      ? `החסר ${criticalMissed.length} רכיב/ים קריטי/ים. התמקדו תחילה ב: ${criticalMissed
          .slice(0, 3)
          .map(m => m.label)
          .join("; ")}. השתמשו בראשי תיבות עזר: SAMPLE ל-Anamnesis כללי, OPQRST לכאב.`
      : "כיסיתם את הרכיבים הקריטיים. נסו להוסיף את הפרטים הנוספים החסרים כדי להעמיק את ההערכה.";

  return { score, covered, missed, suggestions, raw: "heuristic" };
};

export async function POST(req: NextRequest) {
  try {
    const { caseId, transcript } = await req.json();
    if (!caseId || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing caseId or transcript" }, { status: 400 });
    }
    const c = cases.find(cc => cc.id === caseId);
    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // אם אין מפתח Anthropic - נחזיר משוב heuristic
    if (!process.env.ANTHROPIC_API_KEY) {
      const fb = heuristicFeedback(caseId, transcript);
      return NextResponse.json(fb);
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const expected = c.expectedPoints
      .map(
        (p, i) =>
          `${i + 1}. ${p.label} [${p.weight}] - מילות מפתח אפשריות: ${p.keywords.join(", ")} | למה חשוב: ${p.rationale}`
      )
      .join("\n");

    const systemPrompt = `אתה מורה לקורס חובשים בעברית. עליך לתת משוב מקצועי, ממוקד וברור על אנמנזה ש"נבחן ביצע בעל פה.
חשוב: ענה תמיד בעברית בלבד וב-JSON תקין בלבד (ללא שום טקסט סביב, ללא markdown).
המבנה הנדרש:
{
  "score": <מספר 0-100>,
  "covered": [{"label": "<תיאור הרכיב שכוסה>", "weight": "critical|important|nice-to-have"}],
  "missed": [{"label": "<תיאור>", "weight": "critical|important|nice-to-have", "rationale": "<למה חשוב>"}],
  "suggestions": "<טקסט קצר, 1-3 משפטים, עם הצעות לשיפור>"
}
שקילת ציון: critical = משקל 3, important = 2, nice-to-have = 1. שקלל אחוז את הרכיבים שכוסו.
היה סלחני לניסוח חופשי - אם הנבחן ביקש לדעת על המידע, גם בלי מילה בדיוק - זה נחשב כיסוי.
התעלם משגיאות כתיב/תמלול. רק בעברית, רק JSON.`;

    const userPrompt = `מקרה: ${c.title}
תיאור: ${c.scenario}
פרטי המטופל: גיל ${c.patient.age}, ${c.patient.sex}. ${c.patient.vitalsAtArrival || ""}

רכיבי אנמנזה צפויים:
${expected}

תשובת הנבחן (תמלול):
"""
${transcript}
"""

החזר JSON בלבד.`;

    const completion = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const txt = completion.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    // נסה לפרסר JSON. אם נכשל - חזרה ל-heuristic
    try {
      const cleaned = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (e) {
      console.warn("Failed to parse Claude response, falling back to heuristic", txt);
      return NextResponse.json(heuristicFeedback(caseId, transcript));
    }
  } catch (e: any) {
    console.error("/api/feedback error", e);
    try {
      const { caseId, transcript } = (await req.clone().json()) as { caseId: string; transcript: string };
      return NextResponse.json(heuristicFeedback(caseId, transcript));
    } catch {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
}
