import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cases } from "@/data/cases";
import { caseExtras } from "@/data/case-extras";

export const runtime = "nodejs";
export const maxDuration = 30;

type Turn = { q: string; a: string | null };
type DialogueRequest = {
  caseId: string;
  userQuestion: string;
  history?: Turn[];
};

const normalize = (s: string): string =>
  s
    .replace(/[֑-ׇ]/g, "")
    .replace(/[״׳"'.,!?;:()־-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Hebrew prefix letters that legitimately attach to words (ה ו ש ב ל כ).
// NOT "מ" — "מרגיש" (feel) is its own word, not "מ" + "רגיש".
const ALLOWED_PREFIXES = ["", "ה", "ו", "ש", "ב", "ל", "כ", "וה", "וב", "ול", "וש", "מה"];
const MAX_SUFFIX_LEN = 3;

const containsWord = (text: string, keyword: string): boolean => {
  if (!keyword) return false;
  if (keyword.includes(" ")) {
    // Multi-word phrase → match as substring but with whole-word ends:
    //   embed in spaces to require word boundaries
    return (" " + text + " ").includes(" " + keyword + " ") || text.includes(keyword);
  }
  const words = text.split(/\s+/).filter(Boolean);
  return words.some(w => {
    for (const prefix of ALLOWED_PREFIXES) {
      const head = prefix + keyword;
      if (w.startsWith(head) && w.length - head.length <= MAX_SUFFIX_LEN) return true;
    }
    return false;
  });
};

/** Word-boundary aware bidirectional match: kw ↔ concept */
const conceptMatches = (kw: string, concept: string): boolean => {
  const k = normalize(kw);
  const c = normalize(concept);
  if (k === c) return true;
  if (containsWord(k, c)) return true;
  if (containsWord(c, k)) return true;
  return false;
};

const GENERIC_PATTERNS: { triggers: string[]; conceptKeywords: string[] }[] = [
  { triggers: ["איך אתה מרגיש", "איך את מרגישה", "איך מרגיש", "מה שלומך", "מה איתך", "מה מצבך", "מצבך", "מה קרה לך", "שלום אדוני", "שלום גברתי", "אדוני", "גברתי"], conceptKeywords: ["מאפיין", "איך מרגיש", "כואב", "כאב", "התחיל", "מתי התחיל", "מקום הכאב"] },
  { triggers: ["מה כואב", "איפה כואב", "כואב לך", "מקום הכאב", "איזה כאב", "כאבים", "הכאב", "האם כואב", "הוא כואב", "היא כואבת", "תאר את הכאב"], conceptKeywords: ["מאפיין", "איך מרגיש", "כואב", "כאב", "איפה", "מקום הכאב"] },
  { triggers: ["מתי התחיל", "מתי זה התחיל", "כמה זמן", "לפני כמה", "מתי קרה"], conceptKeywords: ["מתי", "מתי התחיל", "כמה זמן", "התחיל"] },
  { triggers: ["מה קרה", "מה קורה", "מה הבעיה", "למה קראת", "למה הזעקת", "מה הסיבה", "למה אנחנו", "למה הזמנת"], conceptKeywords: ["מה קרה", "תאונה", "התחיל", "מתי התחיל", "מאפיין"] },
  { triggers: ["תרופות", "תרופה", "מה אתה לוקח", "מה את לוקחת"], conceptKeywords: ["תרופות", "מה אתה לוקח", "מה לוקחת"] },
  { triggers: ["אלרגי", "אלרגיה"], conceptKeywords: ["אלרגיה"] },
  { triggers: ["מחלות", "רקע רפואי", "רקע", "מחלה", "סובל"], conceptKeywords: ["סוכרת", "לחץ דם", "מחלה", "סוכרתי"] },
  { triggers: ["מקרין", "הקרנה", "זרוע", "לסת", "מקרינה"], conceptKeywords: ["מקרין", "זרוע", "לסת", "גב"] },
  { triggers: ["הזעה", "מזיע", "בחילה", "הקאה", "סחרחורת", "חולשה", "סחרחר"], conceptKeywords: ["הזעה", "בחילה", "סחרחורת", "מזיע"] },
  { triggers: ["נשימה", "קצר נשימה", "קוצר נשימה", "קשה לנשום"], conceptKeywords: ["נשימה", "קוצר נשימה"] },
  { triggers: ["אכלת", "ארוחה", "אוכל"], conceptKeywords: ["אכל", "ארוחה", "אוכל"] },
  { triggers: ["מעשן", "עישון", "סיגריות"], conceptKeywords: ["מעשן", "עישון"] },
  { triggers: ["אלכוהול", "שתיית", "שיכור"], conceptKeywords: ["אלכוהול", "שותה"] },
  { triggers: ["סוכר", "אינסולין", "גלוקוז"], conceptKeywords: ["סוכרת", "אינסולין", "סוכר"] },
  { triggers: ["יתר לחץ", "לחץ דם גבוה", "לחץ דם"], conceptKeywords: ["לחץ דם", "יתר לחץ"] },
  { triggers: ["מאמץ", "מנוחה", "במה השתפר", "מה מקל", "מה מחמיר", "החמיר"], conceptKeywords: ["מאמץ", "מנוחה", "מחמיר", "מקל"] },
  { triggers: ["דרגה", "סקאלה", "כמה חזק", "עוצמה", "1 עד 10"], conceptKeywords: ["דרגה", "סקאלה", "כמה חזק"] },
  { triggers: ["אשפוז", "אישפוז", "בית חולים בעבר", "ניתוח"], conceptKeywords: ["אשפוז", "בית חולים"] },
  { triggers: ["משפחה", "אחים", "תורשה", "אבא", "אמא"], conceptKeywords: ["משפחה", "תורשה", "אבא", "אמא"] }
];

// === Conversational filler intros (to vary repeated patterns) ===
const INTROS = ["", "", "", "אז ", "תקשיב, ", "תראה, ", "האמת, ", "טוב, "];
const ACKNOWLEDGES = ["", "כן, ", "אה, ", "אהה, ", ""];

const stableRandom = (seed: string): number => {
  // Simple deterministic hash → 0..1, so the same question gets the same intro
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) / 2147483647;
};

const addFiller = (answer: string, question: string, turnCount: number): string => {
  if (turnCount === 0) return answer;
  const r1 = stableRandom(question + "i");
  const r2 = stableRandom(question + "a");
  const intro = INTROS[Math.floor(r1 * INTROS.length)];
  const ack = answer.startsWith("כן") || answer.startsWith("לא")
    ? ""
    : ACKNOWLEDGES[Math.floor(r2 * ACKNOWLEDGES.length)];
  return intro + ack + answer;
};

// === History-aware heuristic ===
type HeuristicResult = { answer: string; source: "heuristic"; aiAttempted?: string };

const heuristicResponse = (
  caseId: string,
  userQuestion: string,
  history?: Turn[]
): HeuristicResult & { debugStep?: string } => {
  const c = cases.find(cc => cc.id === caseId);
  const ex = caseExtras[caseId];
  if (!c || !ex) {
    return { answer: "אני לא מצליח לזכור כרגע, סליחה.", source: "heuristic", debugStep: "no-case" };
  }
  const q = normalize(userQuestion);
  const givenAnswers = new Set((history || []).map(h => h.a).filter((a): a is string => !!a));
  const turnCount = history?.length || 0;

  // 1. Direct keyword match — collect ALL matches, prefer ones not already given
  const matches: { hits: number; answer: string; matchedKw: string[] }[] = [];
  for (const r of ex.patientResponses) {
    let hits = 0;
    const matchedKw: string[] = [];
    for (const kw of r.keywords) {
      const k = normalize(kw);
      if (k && containsWord(q, k)) { hits++; matchedKw.push(kw); }
    }
    if (hits > 0) matches.push({ hits, answer: r.answer, matchedKw });
  }
  matches.sort((a, b) => b.hits - a.hits);
  const freshDirect = matches.find(m => !givenAnswers.has(m.answer));
  if (freshDirect) {
    return {
      answer: addFiller(freshDirect.answer, userQuestion, turnCount),
      source: "heuristic",
      debugStep: `step1:direct[${freshDirect.matchedKw.join(",")}]`
    };
  }

  // 2. Generic patterns → concept keywords → response (prefer fresh)
  for (const gp of GENERIC_PATTERNS) {
    const matchedTrigger = gp.triggers.find(t => q.includes(normalize(t)));
    if (!matchedTrigger) continue;
    for (const concept of gp.conceptKeywords) {
      const matchingResponses = ex.patientResponses.filter(r =>
        r.keywords.some(kw => conceptMatches(kw, concept))
      );
      const freshConcept = matchingResponses.find(m => !givenAnswers.has(m.answer));
      if (freshConcept) {
        return {
          answer: addFiller(freshConcept.answer, userQuestion, turnCount),
          source: "heuristic",
          debugStep: `step2:pattern[${matchedTrigger}]concept[${concept}]`
        };
      }
    }
  }

  // 3. Fallback — pick the next response that hasn't been said yet
  const unseenResponses = ex.patientResponses.filter(r => !givenAnswers.has(r.answer));
  if (unseenResponses.length > 0) {
    const chief = unseenResponses.find(r => /(כאב|כואב|מרגיש|התחיל|סובל)/.test(r.answer));
    const pick = chief || unseenResponses[0];
    return {
      answer: addFiller(pick.answer, userQuestion, turnCount),
      source: "heuristic",
      debugStep: `step3:unseen[${pick.keywords.join(",")}]`
    };
  }

  return {
    answer: "כבר סיפרתי לך את כל מה שאני יודע. תוכל לחזור על שאלה אם משהו לא ברור?",
    source: "heuristic",
    debugStep: "step4:exhausted"
  };
};

// === Anthropic Claude integration ===
const callAnthropic = async (req: DialogueRequest): Promise<string | null> => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const c = cases.find(cc => cc.id === req.caseId)!;
  const ex = caseExtras[req.caseId];
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const factsBank = ex?.patientResponses
    ? ex.patientResponses.map(r => `- ${r.keywords.join(", ")}: ${r.answer}`).join("\n")
    : "(אין מידע נוסף)";
  const historyText = req.history?.length
    ? req.history.map(h => `חובש: ${h.q}${h.a ? `\nמטופל: ${h.a}` : ""}`).join("\n\n")
    : "(שיחה חדשה - זו השאלה הראשונה)";

  const systemPrompt = `אתה משחק תפקיד של מטופל/ה (או של עד ראייה/קרוב, אם המטופל מחוסר הכרה) בסימולציה לאימון חובשים בעברית.
חוקים חשובים:
- דבר בגוף ראשון, בשפה מדוברת ואותנטית - לא ספרותית, לא רפואית-מקצועית
- ענה משפט-שניים קצרים (10-30 מילים). לא מונולוג.
- שמור על קוהרנטיות עם פרטי המקרה. אל תסתור פרטים שכבר נאמרו בשיחה.
- אם החובש שאל שאלה שכבר נענתה - תזכיר במשפט קצר ותענה שוב בקצרה (לא לחזור בדיוק).
- אם החובש שאל שאלה לא ברורה - תבקש הבהרה ("מה זאת אומרת?", "לא הבנתי...").
- אסור להוסיף תיוגים, הסברים מטא, או אזכור של "סימולציה".
- ענה רק בעברית.`;

  const userPrompt = `מקרה: ${c.title}
תיאור המקרה (איך הגעת לכאן): ${c.scenario}
פרטי מטופל: גיל ${c.patient.age}, מין ${c.patient.sex}.
מדדים בהגעה: ${c.patient.vitalsAtArrival || "לא נמדדו"}

עובדות שאתה (המטופל) יודע - תוכל להתבסס עליהן ולפרט עליהן:
${factsBank}

היסטוריית השיחה:
${historyText}

החובש שואל עכשיו: "${req.userQuestion}"

ענה בקצרה, בגוף ראשון, בשפה אנושית. אל תוסיף שום הקדמה או תיוג - רק התשובה.`;

  const completion = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });
  const txt = completion.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join(" ")
    .trim();
  return txt || null;
};

// === Groq Cloud integration (free tier) ===
const callGroq = async (req: DialogueRequest): Promise<string | null> => {
  if (!process.env.GROQ_API_KEY) return null;
  const c = cases.find(cc => cc.id === req.caseId)!;
  const ex = caseExtras[req.caseId];

  const factsBank = ex?.patientResponses
    ? ex.patientResponses.map(r => `- ${r.keywords.join(", ")}: ${r.answer}`).join("\n")
    : "(אין מידע)";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: `אתה משחק תפקיד של מטופל/ה בסימולציה לאימון חובשים בעברית.
דבר בגוף ראשון, בשפה מדוברת, ענה משפט-שניים קצרים בלבד.
אל תסתור פרטים שנאמרו בשיחה. אל תוסיף תיוגים או הסברים.

מקרה: ${c.title}
תיאור: ${c.scenario}
פרטים: גיל ${c.patient.age}, ${c.patient.sex}. מדדים: ${c.patient.vitalsAtArrival || "לא נמדדו"}

עובדות שאתה יודע:
${factsBank}`
    }
  ];

  // Add conversation history
  for (const h of req.history || []) {
    messages.push({ role: "user", content: h.q });
    if (h.a) messages.push({ role: "assistant", content: h.a });
  }
  messages.push({ role: "user", content: req.userQuestion });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 250,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    console.warn("Groq returned", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

// === Main handler: AI provider chain → Heuristic fallback ===
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DialogueRequest;
    if (!body.caseId || !body.userQuestion) {
      return NextResponse.json({ error: "Missing caseId or userQuestion" }, { status: 400 });
    }

    const c = cases.find(cc => cc.id === body.caseId);
    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Try AI providers in priority order
    // 1. Anthropic Claude (best quality, paid)
    try {
      const ans = await callAnthropic(body);
      if (ans) return NextResponse.json({ answer: ans, source: "ai-anthropic" });
    } catch (e: any) {
      console.warn("Anthropic failed:", e?.message);
    }

    // 2. Groq Llama (free, fast)
    try {
      const ans = await callGroq(body);
      if (ans) return NextResponse.json({ answer: ans, source: "ai-groq" });
    } catch (e: any) {
      console.warn("Groq failed:", e?.message);
    }

    // 3. Heuristic (no API key needed - works always)
    const heuristic = heuristicResponse(body.caseId, body.userQuestion, body.history);
    const { debugStep: _ds, ...resp } = heuristic;
    return NextResponse.json(resp);
  } catch (e: any) {
    console.error("/api/dialogue error", e);
    try {
      const body = (await req.clone().json()) as DialogueRequest;
      return NextResponse.json(heuristicResponse(body.caseId, body.userQuestion, body.history));
    } catch {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
}
