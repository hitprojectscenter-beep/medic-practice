// Comprehensive end-to-end QA across all major flows.

const BASE = "https://medic-practice.vercel.app";

const fetchJson = async (path, body, timeoutMs = 60000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(id);
  }
};

const checks = [];
const log = (label, pass, info = "") => {
  checks.push({ label, pass, info });
  console.log(`${pass ? "✅" : "❌"}  ${label}${info ? ` — ${info}` : ""}`);
};

(async () => {
  console.log("=== FULL APP QA ===\n");

  // === 1. Dialogue API ===
  console.log("-- 1. /api/dialogue --");
  try {
    const r = await fetchJson("/api/dialogue", {
      caseId: "case-chest-pain",
      userQuestion: "מה כואב לך תענה לי",
      history: []
    });
    log("Dialogue Q1 returns answer", r.ok && r.data.answer, `source=${r.data.source}`);
    log("Dialogue uses AI when key set", r.data.source === "ai-anthropic", `source=${r.data.source}`);
  } catch (e) { log("Dialogue Q1", false, e.message); }

  // Multi-turn — verify no duplicate answers
  try {
    const history = [];
    const Qs = ["שלום אדוני מה שלומך תענה לי", "מה כואב לך תענה לי", "האם הכאב מקרין תענה לי"];
    const answers = new Set();
    for (const q of Qs) {
      const r = await fetchJson("/api/dialogue", { caseId: "case-chest-pain", userQuestion: q, history });
      answers.add(r.data.answer);
      history.push({ q, a: r.data.answer });
    }
    log("Dialogue 3-turn unique answers", answers.size === 3, `${answers.size}/3`);
  } catch (e) { log("Dialogue multi-turn", false, e.message); }

  // === 2. Feedback API ===
  console.log("\n-- 2. /api/feedback --");
  try {
    const r = await fetchJson("/api/feedback", {
      caseId: "case-chest-pain",
      transcript: "מה כואב לך מתי התחיל הכאב האם מקרין",
      turns: [
        { q: "מה כואב לך?", a: "החזה" },
        { q: "מתי התחיל?", a: "חצי שעה" }
      ],
      safetyChecks: ["קיבלתי / יוצא לקריאה (אישור קליטה)"],
      selectedDiagnosis: 0
    }, 60000);
    log("Feedback returns score", r.ok && typeof r.data.score === "number", `score=${r.data.score}`);
    log("Feedback has covered/missed", r.ok && Array.isArray(r.data.covered) && Array.isArray(r.data.missed));
    log("Feedback has suggestions", r.ok && typeof r.data.suggestions === "string");
    log("Feedback uses AI", r.ok && !r.data.raw, "AI returned structured JSON");
  } catch (e) { log("Feedback", false, e.message); }

  // === 3. Leaderboard API ===
  console.log("\n-- 3. /api/leaderboard --");
  try {
    const r = await fetchJson("/api/leaderboard");
    log("Leaderboard GET succeeds", r.ok, `entries=${r.data.entries?.length || 0}`);
  } catch (e) { log("Leaderboard GET", false, e.message); }

  try {
    const r = await fetchJson("/api/leaderboard", {
      userId: "qa-test-" + Date.now(),
      username: "QA Bot",
      xp: 500, level: 2, rankTitle: "מתאמן", rankEmoji: "📖",
      accuracy: 75, questionsAnswered: 30, totalStudyTimeMs: 3600000,
      daysActive: 5, examScoresAvg: 70
    });
    log("Leaderboard POST succeeds", r.ok, `totalUsers=${r.data.totalUsers}`);
  } catch (e) { log("Leaderboard POST", false, e.message); }

  // === 4. Transcribe API health (no audio - just check endpoint exists) ===
  console.log("\n-- 4. /api/transcribe --");
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(BASE + "/api/transcribe", { method: "POST", body: new FormData(), signal: ctrl.signal });
    clearTimeout(id);
    log("Transcribe endpoint exists", res.status === 400 || res.status === 500, `status=${res.status}`);
  } catch (e) { log("Transcribe endpoint", false, e.message); }

  // === 5. Page renders ===
  console.log("\n-- 5. Pages render --");
  for (const path of ["/", "/exam", "/practice/quiz", "/practice/anamnesis", "/stats", "/leaderboard"]) {
    try {
      const res = await fetch(BASE + path);
      const html = await res.text();
      const hasHebrew = /[֐-׿]/.test(html);
      log(`Page ${path}`, res.ok && hasHebrew, `status=${res.status}`);
    } catch (e) { log(`Page ${path}`, false, e.message); }
  }

  // === 6. Diagnostic dialogue cases (all 15) ===
  console.log("\n-- 6. All 15 anamnesis cases respond --");
  const caseIds = [
    "case-chest-pain", "case-asthma", "case-anaphylaxis", "case-stroke",
    "case-hypoglycemia", "case-burn", "case-mvc", "case-snake",
    "case-abd-pain", "case-syncope", "case-peds-seizure",
    "case-bleeding-pregnancy", "case-uti", "case-heat-stroke", "case-gsw"
  ];
  for (const id of caseIds) {
    try {
      const r = await fetchJson("/api/dialogue", {
        caseId: id, userQuestion: "מה קרה כאן תענה לי", history: []
      });
      const ok = r.ok && r.data.answer && r.data.answer.length > 5;
      log(`Case ${id}`, ok, ok ? `len=${r.data.answer.length}` : `status=${r.status}`);
    } catch (e) { log(`Case ${id}`, false, e.message); }
  }

  // === Summary ===
  const pass = checks.filter(c => c.pass).length;
  const fail = checks.length - pass;
  console.log(`\n=== RESULT: ${pass}/${checks.length} passed${fail ? ` (${fail} failed)` : ""} ===`);
  if (fail > 0) {
    console.log("\nFailed checks:");
    checks.filter(c => !c.pass).forEach(c => console.log(`  ❌ ${c.label}: ${c.info}`));
  }
})();
