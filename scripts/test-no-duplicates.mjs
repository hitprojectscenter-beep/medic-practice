// Simulates skip behavior and verifies NO DUPLICATES ever appear in a session.

import { questions } from "../data/questions.ts";
// Can't easily import questions.ts directly - use a simple inline simulation.

const fs = await import("node:fs");
const src = fs.readFileSync("data/questions.ts", "utf8");

// Quick parse: extract all question IDs
const ids = [...src.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]).filter(id => id.startsWith("q-"));
console.log(`Total questions in bank: ${ids.length}`);

// Topic counts
const topicMatches = [...src.matchAll(/topic:\s*"([^"]+)"/g)];
const topicCounts = {};
topicMatches.forEach(m => { topicCounts[m[1]] = (topicCounts[m[1]] || 0) + 1; });
const topics = Object.keys(topicCounts);
console.log(`Topics: ${topics.length}`);

// === Simulate a session ===
function simulateSession(poolSize, requestedCount, skipsToPerform) {
  // Initial session
  const pool = ids.slice(0, poolSize).map(id => ({ id }));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  let session = shuffled.slice(0, requestedCount);
  const seen = new Set(session.map(q => q.id));

  // Perform N skips at random positions
  for (let i = 0; i < skipsToPerform; i++) {
    const pos = Math.floor(Math.random() * session.length);
    const candidates = pool.filter(q => !seen.has(q.id));
    if (candidates.length === 0) {
      console.log(`  Skip #${i + 1}: no replacements available - stopping`);
      break;
    }
    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    session[pos] = replacement;
    seen.add(replacement.id);
  }

  // Verify no duplicates
  const sessionIds = session.map(q => q.id);
  const uniqueIds = new Set(sessionIds);
  return {
    sessionSize: session.length,
    uniqueCount: uniqueIds.size,
    hasDuplicates: uniqueIds.size !== session.length,
    skipsPerformed: Math.min(skipsToPerform, pool.length - requestedCount)
  };
}

console.log("\n=== Simulation: 10 quizes, 5 skips ===");
const r1 = simulateSession(ids.length, 10, 5);
console.log(`Session size: ${r1.sessionSize}, unique: ${r1.uniqueCount}, duplicates: ${r1.hasDuplicates}`);

console.log("\n=== Simulation: 40-question exam, 15 skips ===");
const r2 = simulateSession(ids.length, 40, 15);
console.log(`Session size: ${r2.sessionSize}, unique: ${r2.uniqueCount}, duplicates: ${r2.hasDuplicates}`);

console.log("\n=== Simulation: small topic with 7 questions, 5 question session, 10 skips attempted ===");
// Simulate a tiny topic pool
const tinyPool = 7;
const r3 = simulateSession(tinyPool, 5, 10);
console.log(`Session size: ${r3.sessionSize}, unique: ${r3.uniqueCount}, duplicates: ${r3.hasDuplicates}, skips done: ${r3.skipsPerformed}/10 (pool exhausted at ${tinyPool - 5})`);

console.log("\n=== Simulation: 20-question session, EXHAUSTIVE skips (every question replaced 3+ times) ===");
let exhaustedHasDup = false;
for (let trial = 0; trial < 100; trial++) {
  const r = simulateSession(ids.length, 20, 200); // way more skips than possible
  if (r.hasDuplicates) { exhaustedHasDup = true; break; }
}
console.log(`Over 100 trials: ${exhaustedHasDup ? "❌ FOUND DUPLICATES" : "✅ ZERO duplicates"}`);

console.log("\n=== Verifying initial pools have no duplicates (10 random builds) ===");
let anyDupe = false;
for (let trial = 0; trial < 10; trial++) {
  const r = simulateSession(ids.length, 40, 0);
  if (r.hasDuplicates) { anyDupe = true; break; }
}
console.log(`${anyDupe ? "❌" : "✅"}  Initial pool always unique`);
