// Tests word-boundary matching for Hebrew keywords with prefix allowance.
// The bug: substring match makes "רגיש" match inside "מרגיש".

// Hebrew one-letter prefixes that ARE legitimately added to words:
//   ה (the), ו (and), ש (that), ב (in), ל (to), כ (like)
// Notably NOT included: מ — adding מ to רגיש creates "מרגיש" (verb "feel"), a different word.
const ALLOWED_PREFIXES = ["", "ה", "ו", "ש", "ב", "ל", "כ", "וה", "וב", "ול", "וש", "מה"];
// Common Hebrew word suffixes (plural/possessive markers)
const MAX_SUFFIX_LEN = 3;

const wordStartsWithKeyword = (word, keyword) => {
  for (const prefix of ALLOWED_PREFIXES) {
    const head = prefix + keyword;
    if (word.startsWith(head)) {
      const remaining = word.slice(head.length);
      if (remaining.length <= MAX_SUFFIX_LEN) return true;
    }
  }
  return false;
};

const containsWord = (text, keyword) => {
  // Multi-word keyword → require full substring (already specific enough)
  if (keyword.includes(" ")) return text.includes(keyword);
  // Single word → check word-by-word with prefix allowance
  const words = text.split(/\s+/).filter(Boolean);
  return words.some(w => wordStartsWithKeyword(w, keyword));
};

// === Tests ===
const tests = [
  // Should match
  { text: "שלום אדוני האם יש לך אלרגיה תענה לי", kw: "אלרגיה", expect: true },
  { text: "מה כואב לך תענה לי", kw: "כואב", expect: true },
  { text: "הכאב חזק תענה לי", kw: "כאב", expect: true }, // ה prefix
  { text: "בכאב חזק", kw: "כאב", expect: true }, // ב prefix
  { text: "האם אתה סוכרתי", kw: "סוכרתי", expect: true },
  { text: "מתי התחיל הכאב", kw: "מתי", expect: true },
  { text: "מתי התחיל הכאב", kw: "מתי התחיל", expect: true }, // multi-word
  { text: "האם הכאב מקרין", kw: "מקרין", expect: true },
  { text: "אכלת בוקר?", kw: "אכלת", expect: true },
  { text: "מה אתה לוקח", kw: "מה אתה לוקח", expect: true }, // multi-word
  // Should NOT match (the bugs)
  { text: "שלום אדוני איך אתה מרגיש למה קראת לנו", kw: "רגיש", expect: false }, // THE BUG!
  { text: "איך אתה מרגיש", kw: "רגיש", expect: false },
  { text: "אני סובל מסוכרת", kw: "כרת", expect: false }, // "כרת" inside "סוכרת"
  { text: "האם יש לך הזיות", kw: "זיות", expect: false }, // "זיות" inside "הזיות" but no prefix in allowed
];

console.log("=== Word-boundary keyword matching ===\n");
let pass = 0, fail = 0;
for (const t of tests) {
  const actual = containsWord(t.text, t.kw);
  const ok = actual === t.expect;
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? "✅" : "❌"}  "${t.kw}" in "${t.text}" → ${actual} (expected ${t.expect})`);
}
console.log(`\n  Result: ${pass}/${tests.length} passed${fail ? ` (${fail} failed)` : ""}`);
