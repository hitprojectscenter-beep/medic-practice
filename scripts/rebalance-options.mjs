// Safe rebalancer:
// - Trim correct option (strip parentheticals + post-dash details), only if the result is still a coherent phrase.
// - DO NOT pad numeric / short factual answers (e.g., "2", "100%", "60-70%", anatomy names).
// - Pad only THROWAWAY distractors (one-liners that obviously give away the question).
// - After trimming, also drop a trailing " - " if it was left orphaned.

import { readFileSync, writeFileSync } from "node:fs";

const file = "data/questions.ts";
const original = readFileSync(file, "utf8");
let src = original;

function tryTrim(text, target) {
  let t = text;
  const candidates = new Set([t]);

  const cleanup = s => s.replace(/\s+[-–—]\s*$/g, "").replace(/^[-–—]\s+/g, "").replace(/\s{2,}/g, " ").trim();

  // 1. Paren strip (accept even very short results - numeric questions need this)
  const noParens = cleanup(t.replace(/\s*\([^()]*\)\s*/g, " "));
  if (noParens.length >= 1) candidates.add(noParens);

  // 2. Strip after " - "
  const dashIdx = t.indexOf(" - ");
  if (dashIdx > 4) candidates.add(cleanup(t.slice(0, dashIdx)));

  // 3. Strip after ". "
  const periodIdx = t.indexOf(". ");
  if (periodIdx > 4) candidates.add(cleanup(t.slice(0, periodIdx)));

  // 4. Strip after ": "
  const colonIdx = t.indexOf(": ");
  if (colonIdx > 4) candidates.add(cleanup(t.slice(0, colonIdx)));

  // 5. Strip after first ", " - for list-style correct answers (be careful)
  const commaIdx = t.indexOf(", ");
  if (commaIdx >= 2) candidates.add(cleanup(t.slice(0, commaIdx)));

  // 6. Combinations - paren-stripped + further trim
  if (noParens !== t) {
    [" - ", ". ", ": ", ", "].forEach(sep => {
      const idx = noParens.indexOf(sep);
      if (idx >= 2) candidates.add(cleanup(noParens.slice(0, idx)));
    });
  }

  // Score candidates and pick the best one.
  // Goal: (a) close to target length, (b) no orphan punctuation, (c) reasonable shortness preferred.
  function score(c) {
    let s = Math.abs(c.length - target);
    // Heavy penalty for candidates with orphan separators (e.g. "X - " or middle " - Y" where Y is < 2 words)
    if (/\s[-–—]\s/.test(c)) {
      // " - " somewhere in middle - usually means trim left details after "X - details"
      const parts = c.split(/\s[-–—]\s/);
      if (parts.length > 1) {
        const after = parts.slice(1).join(" - ");
        // If text after dash is short / fragmenty, this candidate is broken
        if (after.split(/\s+/).length < 3) s += 50;
      }
    }
    // Slight bonus for being shorter (without sacrificing meaning)
    s -= Math.max(0, target - c.length) * 0.1;
    return s;
  }

  let best = t;
  let bestScore = score(t);
  for (const c of candidates) {
    if (c.length < 1) continue;
    if (c.length >= t.length) continue;
    if (!/[א-תa-zA-Z0-9]/.test(c)) continue;
    const sc = score(c);
    if (sc < bestScore) {
      best = c;
      bestScore = sc;
    }
  }
  return best;
}

// Detect numeric / short factual options that must NOT be padded
function isFactualShort(text) {
  const t = text.trim();
  // Pure numbers / percentages / ratios / time
  if (/^[\d:.\s%\-+/]+$/.test(t)) return true;
  if (/^[\d]+(שניות|דקות|שעות|מ"ל|ק"ג|ס"מ|מ"ג|מק"ג|לדקה)$/.test(t.replace(/\s+/g, ""))) return true;
  // Anatomy-like single words (Hebrew word ≤ 8 chars)
  if (/^[א-ת]{2,8}$/.test(t)) return true;
  return false;
}

// Only pad clearly-throwaway distractors
const PAD_MAP = {
  "אין הבדל":              "אין הבדל קליני משמעותי",
  "אין דבר כזה":           "אין פרוטוקול כזה ברפואת חירום",
  "אין משמעות":            "אין השפעה ישירה על הטיפול",
  "אין כזה":               "אין מושג כזה בפרוטוקול",
  "אין":                   "לא רלוונטי במצב זה",
  "תלוי בגיל":             "תלוי בעיקר בגיל המטופל",
  "תלוי":                  "תלוי בנסיבות הפציעה",
  "תמיד":                  "תמיד, בכל המקרים ללא יוצא",
  "אף פעם":                "בשום מקרה, אף פעם",
  "אסור":                  "אסור בכל מצב",
  "לעולם לא":              "לעולם לא, גם בחירום",
  "לא צריך":               "לא נדרשת פעולה",
  "להתעלם":                "להתעלם ולהמשיך הלאה",
  "להמתין":                "להמתין ולא להתערב",
  "מהר":                   "כמה שיותר מהר",
  "חזקה":                  "החייאה חזקה ככל האפשר",
  "בשקט":                  "ביצוע בשקט מוחלט",
  "אותו דבר":              "אותו דבר בדיוק בכל המצבים",
  "תרגיל":                 "תרגיל יזום של הצוות",
  "המתנה":                 "המתנה ללא פעולה",
  "ספירת אנשים":           "ספירת מספר הנוכחים",
  "מדידת רוחב":            "מדידת רוחב המקום",
  "תיעוד":                 "תיעוד בלבד, ללא טיפול",
  "תרופה":                 "תרופה מרשם רגילה",
  "תרדמת":                 "מצב של תרדמת ממושכת",
  "פאניקה":                "התקף פאניקה חולף",
  "פיהוק":                 "פיהוק מתמשך",
  "פיגום משולש":           "פיגום בצורת משולש",
  "סוג של תכשיט":          "סוג של תכשיט קישוטי",
  "סוג של כפפה":           "סוג מיוחד של כפפה",
  "סוג של תרופה":          "סוג נדיר של תרופה",
  "סוג מזון":              "סוג מסוים של מזון",
  "צחוק":                  "צחוק מתמשך ולא מבוקר",
  "שעלים":                 "שעלים חזקים ומתמשכים",
  "התעטשות":               "התקף התעטשות",
  "סחרחורת":               "סחרחורת חזקה ופתאומית",
  "אש":                    "טראומה בעקבות אש",
  "פגישה אחת":             "פגישה אחת בלבד",
  "אין סימנים":            "אין סימנים בולטים",
  "מתוך סקרנות":           "מתוך סקרנות כללית",
  "לבדוק רעב":             "לבדוק רעב והרגלי אכילה",
  "מבחן":                  "מבחן כתוב רגיל",
  "אין צורך":              "אין שום צורך בכך",
  "להעיר ולתת מים":        "להעיר אותו ולהציע לו מים"
};

function padShortOption(text) {
  const trimmed = text.trim();
  if (PAD_MAP[trimmed]) return PAD_MAP[trimmed];
  return text;
}

// ============ Process file ============
const PATTERN = /(options:\s*\[)([\s\S]*?)(\],\s*correctIndex:\s*)(\d+)/g;

let stats = { totalBlocks: 0, trimmedCorrect: 0, paddedWrong: 0, changedBlocks: 0 };

src = src.replace(PATTERN, (full, openTag, body, closeTag, idxStr) => {
  stats.totalBlocks++;
  const correctIdx = parseInt(idxStr, 10);

  const positions = [];
  let inStr = false, start = -1, esc = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (inStr) {
      if (ch === '"') {
        positions.push({ start, end: i, content: body.slice(start + 1, i) });
        inStr = false;
      }
    } else if (ch === '"') { inStr = true; start = i; }
  }

  if (positions.length < 4 || correctIdx >= positions.length) return full;

  const decode = s => s.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  const decoded = positions.map(p => decode(p.content));

  // Skip questions where ALL options are short factual answers (numeric questions)
  const allFactual = decoded.every(isFactualShort);
  if (allFactual) return full;

  // Step 1: pad clearly-throwaway wrong options
  const afterPad = decoded.map((s, i) => i === correctIdx ? s : padShortOption(s));

  // Step 2: compute lengths and trim correct against PADDED wrongs
  const wrongLens = afterPad.map((s, i) => i === correctIdx ? -1 : s.length).filter(x => x >= 0);
  const maxWrong = Math.max(...wrongLens);
  const correctLen = decoded[correctIdx].length;

  let newCorrect = null;
  if (correctLen > maxWrong * 1.25 && correctLen - maxWrong >= 8) {
    const target = maxWrong + 4;
    const trimmed = tryTrim(decoded[correctIdx], target);
    if (trimmed !== decoded[correctIdx] && trimmed.length >= 1) {
      newCorrect = trimmed;
    }
  }

  const encode = s => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  let blockChanged = false;
  const repls = [];
  for (let i = 0; i < positions.length; i++) {
    let replacement = null;
    if (i === correctIdx) {
      if (newCorrect !== null && newCorrect !== decoded[i]) {
        replacement = encode(newCorrect);
        stats.trimmedCorrect++;
      }
    } else {
      if (afterPad[i] !== decoded[i]) {
        replacement = encode(afterPad[i]);
        stats.paddedWrong++;
      }
    }
    if (replacement !== null) {
      repls.push({ start: positions[i].start + 1, end: positions[i].end, replacement });
      blockChanged = true;
    }
  }

  if (!blockChanged) return full;
  stats.changedBlocks++;

  let newBody = body;
  for (let i = repls.length - 1; i >= 0; i--) {
    const r = repls[i];
    newBody = newBody.slice(0, r.start) + r.replacement + newBody.slice(r.end);
  }
  return openTag + newBody + closeTag + idxStr;
});

writeFileSync(file, src, "utf8");

console.log("=== REBALANCE STATS ===");
console.log(`Total blocks scanned:    ${stats.totalBlocks}`);
console.log(`Blocks modified:         ${stats.changedBlocks}`);
console.log(`Correct answers trimmed: ${stats.trimmedCorrect}`);
console.log(`Wrong answers padded:    ${stats.paddedWrong}`);
