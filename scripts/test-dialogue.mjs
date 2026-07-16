// QA tests for the dialogue logic - simulates the user/patient interaction

console.log("=== Dialogue System QA ===\n");

// 1. Test the fixed trigger regex
const ANSWER_TRIGGER = /(תענה|ענה|תגיד|תאמר|תספר|תסביר)\s+(לי|לנו|לו|לה)/;

const triggerTests = [
  { text: "מה כואב לך תענה לי", expect: true },
  { text: "מה השם שלך? תענה לי", expect: true },
  { text: "תספר לי על הכאב", expect: true },
  { text: "תגיד לי מתי התחיל", expect: true },
  { text: "מה כואב לך", expect: false },
  { text: "אני סובל מסוכרת", expect: false },
  { text: "תענה", expect: false }, // לא יספיק בלי "לי"
  { text: "ענה לי", expect: true },
  { text: "ענה לנו", expect: true }
];

console.log("--- Trigger detection ---");
let passed = 0;
for (const t of triggerTests) {
  const actual = ANSWER_TRIGGER.test(t.text);
  const ok = actual === t.expect;
  if (ok) passed++;
  console.log(`  ${ok ? "✅" : "❌"}  "${t.text}" → ${actual} (expected ${t.expect})`);
}
console.log(`  Result: ${passed}/${triggerTests.length} passed\n`);

// 2. Test normalization
const normalize = (s) => s
  .replace(/[֑-ׇ]/g, "")
  .replace(/[״׳"'.,!?;:()־-]/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const normTests = [
  { in: "מה כואב לך?", out: "מה כואב לך" },
  { in: "תענה  לי", out: "תענה לי" },
  { in: "מה, איפה? תענה לי!", out: "מה איפה תענה לי" }
];

console.log("--- Normalization ---");
for (const t of normTests) {
  const actual = normalize(t.in);
  const ok = actual === t.out;
  console.log(`  ${ok ? "✅" : "❌"}  "${t.in}" → "${actual}"`);
}

// 3. Test findResponse with a synthetic case
const mockResponses = [
  { keywords: ["מתי", "מתי התחיל", "כמה זמן"], answer: "הכאב התחיל לפני חצי שעה." },
  { keywords: ["איפה", "מקום הכאב"], answer: "במרכז החזה, מאחורי עצם החזה." },
  { keywords: ["מאפיין", "איך מרגיש"], answer: "כאב לוחץ, כבד, לא חד." },
  { keywords: ["מקרין", "זרוע", "לסת"], answer: "כן, מקרין לזרוע שמאל וללסת." },
  { keywords: ["סוכרת"], answer: "כן, סוכרתי כבר 10 שנים." }
];

const GENERIC_PATTERNS = [
  { triggers: ["מה כואב", "כואב לך", "כאב"], concepts: ["מאפיין", "איך מרגיש", "איפה"] },
  { triggers: ["מתי", "כמה זמן"], concepts: ["מתי", "כמה זמן"] },
  { triggers: ["סוכר", "סוכרת"], concepts: ["סוכרת"] },
  { triggers: ["מקרין", "זרוע", "לסת"], concepts: ["מקרין", "זרוע"] }
];

function findResponse(question, responses) {
  const q = normalize(question);
  let best = null;
  for (const r of responses) {
    let hits = 0;
    for (const kw of r.keywords) {
      const k = normalize(kw);
      if (k && q.includes(k)) hits++;
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { hits, answer: r.answer };
  }
  if (best) return best.answer;

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

  const complaint = responses.find(r => /(כאב|כואב|מרגיש|התחיל)/.test(r.answer));
  if (complaint) return complaint.answer;
  return "אני לא בטוח.";
}

const findTests = [
  { q: "מה כואב לך תענה לי", expectedKeyword: "לוחץ" },     // generic → מאפיין
  { q: "מתי התחיל הכאב תענה לי", expectedKeyword: "חצי שעה" }, // direct match: מתי
  { q: "האם הכאב מקרין תענה לי", expectedKeyword: "זרוע" },    // generic + direct
  { q: "האם אתה סוכרתי תענה לי", expectedKeyword: "סוכרתי" },  // direct: סוכרת
  { q: "איפה כואב לך תענה לי", expectedKeyword: "החזה" },     // direct: איפה
  { q: "אבל זה לא קשור בכלל תענה לי", expectedKeyword: "התחיל" } // contextual fallback - any complaint response
];

console.log("\n--- findResponse logic ---");
for (const t of findTests) {
  const actual = findResponse(t.q, mockResponses);
  const ok = actual.includes(t.expectedKeyword);
  console.log(`  ${ok ? "✅" : "❌"}  "${t.q.slice(0, 40)}..." → "${actual.slice(0, 50)}..." (expected contains "${t.expectedKeyword}")`);
}
