// Randomly permutes the 4 options of every question so the correct answer
// is uniformly distributed across א/ב/ג/ד (instead of 75% being ב).

import { readFileSync, writeFileSync } from "node:fs";

const file = "data/questions.ts";
const src = readFileSync(file, "utf8");

// Seeded RNG so re-runs give same shuffle (reproducible)
let seed = 7;
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

// Match each "options: [ ... ], correctIndex: N" block + capture spacing
const PATTERN = /(options:\s*\[)([\s\S]*?)(\],\s*correctIndex:\s*)(\d+)/g;

let touched = 0;
let total = 0;
const before = [0, 0, 0, 0];
const after = [0, 0, 0, 0];

const result = src.replace(PATTERN, (full, openTag, body, closeTag, idxStr) => {
  total++;
  const correctIdx = parseInt(idxStr, 10);
  before[correctIdx]++;

  // Parse the 4 option strings (handle escaped quotes)
  const positions = [];
  let inStr = false, start = -1, esc = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (inStr) {
      if (ch === '"') {
        positions.push({ start, end: i, raw: body.slice(start + 1, i) });
        inStr = false;
      }
    } else if (ch === '"') { inStr = true; start = i; }
  }

  if (positions.length !== 4 || correctIdx > 3) {
    after[correctIdx]++;
    return full;
  }

  // Generate a random permutation [0..3]
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // Where does the original correct answer end up?
  const newCorrectIdx = order.indexOf(correctIdx);
  after[newCorrectIdx]++;

  // If the order didn't change at all, no need to touch
  if (order.every((v, i) => v === i)) return full;
  touched++;

  // Reconstruct the body with the new order, preserving the original quoting
  const raws = positions.map(p => p.raw);
  const newRaws = order.map(i => raws[i]);

  // Build new body: preserve leading whitespace/comma structure
  // Simple approach: split body on quoted strings, recombine in new order
  // Use the same gap text between strings from the original
  const gaps = [];
  gaps.push(body.slice(0, positions[0].start)); // before first
  for (let i = 0; i < positions.length - 1; i++) {
    gaps.push(body.slice(positions[i].end + 1, positions[i + 1].start));
  }
  gaps.push(body.slice(positions[positions.length - 1].end + 1)); // after last

  let newBody = gaps[0];
  for (let i = 0; i < 4; i++) {
    newBody += `"${newRaws[i]}"` + gaps[i + 1];
  }

  return openTag + newBody + closeTag + String(newCorrectIdx);
});

writeFileSync(file, result, "utf8");

console.log("=== Option Shuffle Results ===");
console.log(`Total questions:    ${total}`);
console.log(`Touched (shuffled): ${touched}`);
console.log();
console.log("Before:");
console.log(`  א (0): ${before[0]} (${Math.round(100*before[0]/total)}%)`);
console.log(`  ב (1): ${before[1]} (${Math.round(100*before[1]/total)}%)`);
console.log(`  ג (2): ${before[2]} (${Math.round(100*before[2]/total)}%)`);
console.log(`  ד (3): ${before[3]} (${Math.round(100*before[3]/total)}%)`);
console.log();
console.log("After:");
console.log(`  א (0): ${after[0]} (${Math.round(100*after[0]/total)}%)`);
console.log(`  ב (1): ${after[1]} (${Math.round(100*after[1]/total)}%)`);
console.log(`  ג (2): ${after[2]} (${Math.round(100*after[2]/total)}%)`);
console.log(`  ד (3): ${after[3]} (${Math.round(100*after[3]/total)}%)`);
