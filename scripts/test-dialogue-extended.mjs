// Extended QA - covers many natural-language dialogue patterns

const URL = "https://medic-practice.vercel.app/api/dialogue";

const cases = [
  // Opening questions (general)
  { q: "שלום אדוני איך אתה מרגיש תענה לי", caseId: "case-chest-pain", expect: ["כאב", "לוחץ", "התחיל", "חזה"] },
  { q: "למה קראת לנו תענה לי", caseId: "case-chest-pain", expect: ["כאב", "התחיל"] },
  { q: "מה השלום שלך תענה לי", caseId: "case-chest-pain", expect: ["כאב", "לוחץ"] },
  // Specific direct keyword matches
  { q: "מתי התחיל הכאב תענה לי", caseId: "case-chest-pain", expect: ["חצי שעה", "התחיל"] },
  { q: "האם אתה סוכרתי תענה לי", caseId: "case-chest-pain", expect: ["סוכרת"] },
  { q: "מה אתה לוקח תרופות תענה לי", caseId: "case-chest-pain", expect: ["רמיפריל", "מטפורמין"] },
  // Asthma case
  { q: "האם יש לך אסטמה תענה לי", caseId: "case-asthma", expect: ["אסטמה", "ילדות"] },
  { q: "מה הטריגר שגרם להתקף תענה לי", caseId: "case-asthma", expect: ["אבק"] },
  { q: "השתמשת במשאף תענה לי", caseId: "case-asthma", expect: ["ונטולין", "משאף"] },
  // Stroke case
  { q: "מתי ראית אותו בריא תענה לי", caseId: "case-stroke", expect: ["שעתיים", "טוב לאחרונה"] },
  { q: "האם הוא לוקח מדללי דם תענה לי", caseId: "case-stroke", expect: ["אקסרלטו", "פרפור"] },
  // Anaphylaxis case
  { q: "מה אכל תענה לי", caseId: "case-anaphylaxis", expect: ["עוגיות", "אגוזים"] },
  { q: "האם יש לו אפיפן תענה לי", caseId: "case-anaphylaxis", expect: ["אפיפן", "תיק"] }
];

(async () => {
  let pass = 0, fail = 0;
  for (const c of cases) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ caseId: c.caseId, userQuestion: c.q })
      });
      const data = await res.json();
      const matched = c.expect.some(k => data.answer.includes(k));
      if (matched) pass++; else fail++;
      console.log(`${matched ? "✅" : "❌"}  [${c.caseId}] "${c.q.slice(0, 45)}..."`);
      console.log(`     A: "${data.answer.slice(0, 70)}..."`);
      if (!matched) console.log(`     (expected one of: ${c.expect.join(", ")})`);
    } catch (e) {
      console.log("❌ ERROR:", e.message);
      fail++;
    }
  }
  console.log(`\n=== Result: ${pass}/${pass + fail} passed ===`);
})();
