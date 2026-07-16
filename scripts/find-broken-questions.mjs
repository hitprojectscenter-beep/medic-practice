// Identifies questions whose correct answer was over-trimmed.
// Heuristics: question asks for N items (שלושת/ארבעת/חמשת/שני/...) but the correct answer
// has fewer commas/items than expected. Also: very short correct answers (< 12 chars)
// when other options are longer.

import { readFileSync } from "node:fs";

const src = readFileSync("data/questions.ts", "utf8");
const re = /id:\s*"([^"]+)"[\s\S]*?question:\s*"([^"]+)"[\s\S]*?options:\s*\[([\s\S]*?)\],\s*correctIndex:\s*(\d+)/g;

const COUNT_WORDS = {
  "שני":2, "שתי":2, "שתיי":2, "שניים":2,
  "שלושת":3, "שלושה":3, "שלוש":3, "שלושת השלבים":3,
  "ארבעת":4, "ארבע":4, "ארבעה":4,
  "חמשת":5, "חמש":5, "חמישה":5,
  "ששת":6, "שישה":6, "שש":6,
  "שבעת":7, "שבעה":7,
};

const issues = [];
let m;
while ((m = re.exec(src)) !== null) {
  const id = m[1];
  const question = m[2];
  const optsRaw = m[3];
  const correctIdx = parseInt(m[4], 10);

  // Parse strings from options
  const strs = [];
  let inStr = false, cur = "", esc = false;
  for (const ch of optsRaw) {
    if (esc) { cur += ch; esc = false; continue; }
    if (ch === "\\") { esc = true; cur += ch; continue; }
    if (inStr) {
      if (ch === '"') { inStr = false; strs.push(cur.replace(/\\"/g, '"').replace(/\\\\/g, "\\")); cur = ""; }
      else cur += ch;
    } else if (ch === '"') { inStr = true; }
  }
  if (strs.length < 4) continue;

  const correct = strs[correctIdx];
  const wrongs = strs.filter((_, i) => i !== correctIdx);
  const maxWrong = Math.max(...wrongs.map(w => w.length));

  // Issue 1: Question implies count, correct answer doesn't have enough items
  for (const [word, count] of Object.entries(COUNT_WORDS)) {
    if (question.includes(word) || question.includes("מה " + word) || question.includes("מהם " + word) || question.includes("מהן " + word)) {
      // Count items in correct answer (split by comma, em-dash, slash, "ו-")
      const items = correct.split(/[,،\/]|\sו\s|\sאו\s/).filter(s => s.trim().length > 1);
      if (items.length < count) {
        issues.push({
          id, type: `list-incomplete: question wants ${count} (${word}), correct has ${items.length}`,
          question: question.slice(0, 60),
          correct: `"${correct.slice(0, 80)}"`,
        });
        break;
      }
    }
  }

  // Issue 2: Correct very short compared to wrongs (over-trimmed)
  if (correct.length < 12 && maxWrong > 30 && correct.length < maxWrong * 0.3) {
    issues.push({
      id, type: `over-trimmed: correct=${correct.length}c, maxWrong=${maxWrong}c`,
      question: question.slice(0, 60),
      correct: `"${correct}"`,
    });
  }

  // Issue 3: Correct is significantly LONGER than wrongs (still biased)
  if (correct.length > maxWrong * 1.5 && correct.length - maxWrong > 25) {
    issues.push({
      id, type: `still-biased: correct=${correct.length}c, maxWrong=${maxWrong}c`,
      question: question.slice(0, 60),
      correct: `"${correct.slice(0, 60)}..."`,
    });
  }
}

console.log(`=== ${issues.length} suspicious questions ===\n`);
for (const issue of issues.slice(0, 50)) {
  console.log(`[${issue.id}] ${issue.type}`);
  console.log(`  Q: ${issue.question}`);
  console.log(`  A: ${issue.correct}`);
  console.log();
}
console.log(`Total: ${issues.length} questions need review.`);
