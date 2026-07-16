// Trace the heuristic logic step-by-step for "מה כואב לך תענה לי"

const normalize = (s) => s
  .replace(/[֑-ׇ]/g, "")
  .replace(/[״׳"'.,!?;:()־-]/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const q = normalize("מה כואב לך תענה לי");
console.log(`Question normalized: "${q}"`);
console.log(`Length: ${q.length}`);

const patientResponses = [
  { keywords: ["מתי", "מתי התחיל", "כמה זמן"], answer: "הכאב התחיל לפני חצי שעה..." },
  { keywords: ["איפה", "היכן", "מקום הכאב"], answer: "במרכז החזה..." },
  { keywords: ["מקרין", "זרוע", "לסת", "גב"], answer: "כן, מקרין לזרוע..." },
  { keywords: ["מאפיין", "איך מרגיש", "סוג", "טבע"], answer: "כאב לוחץ, כבד..." }
];

console.log("\n=== Step 1: Direct keyword match ===");
for (const r of patientResponses) {
  let hits = 0;
  for (const kw of r.keywords) {
    const k = normalize(kw);
    const matched = !!k && q.includes(k);
    if (matched) hits++;
    console.log(`  "${kw}" (norm: "${k}") in q? ${matched}`);
  }
  console.log(`  → response "${r.answer.slice(0, 30)}..." hits=${hits}`);
  console.log();
}

console.log("\n=== Step 2: Check 'מה כואב' trigger ===");
const trigger = "מה כואב";
console.log(`q.includes("${trigger}")? ${q.includes(normalize(trigger))}`);

console.log("\n=== Step 2: Concept 'כואב' against keywords ===");
for (const r of patientResponses) {
  const matchedKw = r.keywords.find(kw => {
    const nKw = normalize(kw);
    return nKw.includes("כואב") || "כואב".includes(nKw);
  });
  console.log(`  Response "${r.answer.slice(0, 30)}..." matching kw: ${matchedKw || "(none)"}`);
}

console.log("\n=== Step 2: Concept 'כאב' against keywords ===");
for (const r of patientResponses) {
  const matchedKw = r.keywords.find(kw => {
    const nKw = normalize(kw);
    return nKw.includes("כאב") || "כאב".includes(nKw);
  });
  console.log(`  Response "${r.answer.slice(0, 30)}..." matching kw: ${matchedKw || "(none)"}`);
}

// Specifically test "מקום הכאב".includes("כאב")
console.log("\n=== Substring tests ===");
console.log(`"מקום הכאב".includes("כאב") = ${"מקום הכאב".includes("כאב")}`);
console.log(`"מקום הכאב".includes("כואב") = ${"מקום הכאב".includes("כואב")}`);
console.log(`"מה כואב לך".includes("כואב") = ${"מה כואב לך".includes("כואב")}`);
console.log(`"מה כואב לך".includes("כאב") = ${"מה כואב לך".includes("כאב")}`);
