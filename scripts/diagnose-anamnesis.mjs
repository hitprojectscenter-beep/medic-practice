// Reproduces the regex / dialogue bugs from the field report.

console.log("=== DIAGNOSTIC: ANSWER_TRIGGER regex ===\n");

// The CURRENT regex in components/AnamnesisCard.tsx
const CURRENT = /\bתענה\s*לי\b|\bתענה\b|\bענה\s*לי\b|\bתגיד\b/;

const tests = [
  "מה כואב לך תענה לי",
  "תענה לי",
  "מה השם שלך תענה לי",
  "ענה לי",
  "תגיד לי מתי התחיל",
  "מה כואב לך? תענה לי!",
  "תספר לי על הכאב",
  "מה מצבך תאמר לי"
];

console.log("Current regex:", CURRENT);
console.log();
console.log("Test results with CURRENT regex (\\b based):");
for (const t of tests) {
  const result = CURRENT.test(t);
  console.log(`  ${result ? "✅" : "❌"}  "${t}" → ${result}`);
}

console.log("\n--- Why \\b fails for Hebrew ---");
console.log("In JS regex, \\b matches between \\w (=[A-Za-z0-9_]) and non-\\w.");
console.log("Hebrew letters are NOT in \\w, so \\b NEVER matches between a Hebrew letter and space/punct.");
console.log("Therefore \\bתענה\\b can never trigger inside Hebrew sentences.\n");

console.log("=== PROPOSED FIX ===\n");
const FIXED = /(תענה|ענה|תגיד|תאמר|תספר|תסביר)\s+(לי|לנו|לו|לה)/;
console.log("Fixed regex:", FIXED);
console.log();
console.log("Test results with FIXED regex:");
for (const t of tests) {
  const result = FIXED.test(t);
  console.log(`  ${result ? "✅" : "❌"}  "${t}" → ${result}`);
}

// Edge cases that should NOT trigger
const negatives = [
  "מה כואב לך",
  "אני סובל מסוכרת",
  "מה הסכום",
  "כן זה כואב"
];
console.log("\nNegative tests (should be false):");
for (const t of negatives) {
  const result = FIXED.test(t);
  console.log(`  ${result ? "❌" : "✅"}  "${t}" → ${result}`);
}
