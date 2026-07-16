// Analyzes questions.ts for length-based answer bias
// Strategy: regex out `correctIndex: N` + the immediately-preceding `options: [...]`

import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("data/questions.ts", "utf8");

// Find each "options: [ ... ], correctIndex: N" block with line-by-line scanning
const parsed = [];

// Regex to capture (id, options-array-text, correctIndex)
// Options array can span multiple lines and contain Hebrew + escaped quotes.
// Use a non-greedy match between `options: [` and the LAST `]` before `correctIndex`.
const re = /id:\s*"([^"]+)"[\s\S]*?options:\s*\[([\s\S]*?)\],\s*correctIndex:\s*(\d+)/g;

let m;
while ((m = re.exec(src)) !== null) {
  const id = m[1];
  const arrSrc = m[2];
  const correctIdx = parseInt(m[3], 10);

  // Extract strings from the array (handles escaped quotes)
  const strs = [];
  let inStr = false, cur = "", esc = false;
  for (const ch of arrSrc) {
    if (esc) { cur += ch; esc = false; continue; }
    if (ch === "\\") { esc = true; cur += ch; continue; }
    if (inStr) {
      if (ch === '"') { inStr = false; strs.push(cur); cur = ""; }
      else cur += ch;
    } else if (ch === '"') { inStr = true; }
  }

  parsed.push({ id, options: strs, correctIndex: correctIdx });
}

console.log(`Parsed ${parsed.length} questions.\n`);

// Analyze
let correctIsLongest = 0;
let correctIsSignificantlyLongest = 0;
const biased = [];

for (const q of parsed) {
  if (q.options.length < 4) continue;
  const lens = q.options.map(o => o.length);
  const correctLen = lens[q.correctIndex];
  const wrongLens = lens.filter((_, i) => i !== q.correctIndex);
  const maxWrong = Math.max(...wrongLens);
  if (correctLen >= maxWrong) correctIsLongest++;
  if (correctLen > maxWrong * 1.3 && correctLen > maxWrong + 15) {
    correctIsSignificantlyLongest++;
    biased.push({
      ...q,
      correctLen,
      maxWrong,
      ratio: (correctLen / maxWrong).toFixed(2)
    });
  }
}

console.log(`=== STATISTICS ===`);
console.log(`Total questions:                       ${parsed.length}`);
console.log(`Correct = longest option:              ${correctIsLongest}  (${Math.round(100 * correctIsLongest / parsed.length)}%)`);
console.log(`Correct >> 1.3× longest wrong + ≥15c:  ${correctIsSignificantlyLongest}  (${Math.round(100 * correctIsSignificantlyLongest / parsed.length)}%)`);
console.log();

biased.sort((a, b) => parseFloat(b.ratio) - parseFloat(a.ratio));
console.log(`Top 15 most biased:`);
for (const b of biased.slice(0, 15)) {
  console.log(`\n[${b.id}] ratio ${b.ratio}x  correctLen=${b.correctLen}  maxWrong=${b.maxWrong}`);
  b.options.forEach((o, i) => {
    const marker = i === b.correctIndex ? "✓" : " ";
    console.log(`  ${marker} (${o.length.toString().padStart(3)}) ${o.slice(0, 90)}`);
  });
}

writeFileSync("scripts/biased-questions.json", JSON.stringify(biased, null, 2), "utf8");
console.log(`\nWrote scripts/biased-questions.json with ${biased.length} biased entries.`);
