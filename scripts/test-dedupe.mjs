// Smoke-test the dedupe logic against the real Android Chrome output from the bug report.

const dedupeAdjacentPhrases = (text) => {
  if (!text) return text;
  let words = text.split(/\s+/);
  if (words.length < 2) return text;
  const MAX_WIN = 15;
  let i = 0;
  let safety = words.length * 4;
  while (i < words.length && safety-- > 0) {
    let collapsed = false;
    const winCeiling = Math.min(MAX_WIN, Math.floor((words.length - i) / 2));
    for (let win = winCeiling; win >= 1; win--) {
      const a = words.slice(i, i + win);
      const b = words.slice(i + win, i + 2 * win);
      if (a.length === b.length && a.every((w, k) => w === b[k])) {
        words.splice(i + win, win);
        collapsed = true;
        break;
      }
    }
    if (!collapsed) i++;
  }
  return words.join(" ");
};

// Actual text from the user's screenshot
const BUGGY = `שלום רב אדוני איך כבודו מרגיש למה שלום רב אדוני איך כבודו מרגיש למה שלום רב אדוני איך כבודו מרגיש למה קראת שלום רב אדוני איך כבודו מרגיש למה קראת לנו שלום רב אדוני איך כבודו מרגיש למה קראת לנו שלום רב אדוני איך כבודו מרגיש למה קראת לנו שלום רב אדוני איך כבודו מרגיש למה קראת לנו שלום רב אדוני איך כבודו מרגיש למה קראת לנו שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך תענה שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך תענה לי שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך תענה לי`;

const result = dedupeAdjacentPhrases(BUGGY);
console.log("Input length:  ", BUGGY.length, "chars,", BUGGY.split(/\s+/).length, "words");
console.log("Output length: ", result.length, "chars,", result.split(/\s+/).length, "words");
console.log();
console.log("=== OUTPUT ===");
console.log(result);
console.log();

const expected = "שלום רב אדוני איך כבודו מרגיש למה קראת לנו מה כואב לך תענה לי";
console.log("=== EXPECTED ===");
console.log(expected);
console.log();
console.log(result === expected ? "✅ PASS - exact match" : "⚠️ Close but not exact");

// Additional test cases
const tests = [
  { in: "שלום שלום שלום מה שלומך", expect: "שלום מה שלומך" },
  { in: "מה כואב לך מה כואב לך", expect: "מה כואב לך" },
  { in: "אדוני אדוני אדוני", expect: "אדוני" },
  { in: "test test", expect: "test" },
  { in: "a b c a b c d", expect: "a b c d" },
  { in: "a b c d", expect: "a b c d" } // No duplicates
];

console.log("\n=== Additional cases ===");
for (const t of tests) {
  const r = dedupeAdjacentPhrases(t.in);
  const ok = r === t.expect ? "✅" : "❌";
  console.log(`${ok}  "${t.in}" → "${r}" ${ok === "❌" ? `(expected "${t.expect}")` : ""}`);
}
