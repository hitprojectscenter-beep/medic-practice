// Simulates a multi-turn conversation. Each turn passes the FULL history.
// Verifies that the patient gives DIFFERENT answers as the conversation progresses.

const URL = "https://medic-practice.vercel.app/api/dialogue";

const conversation = [
  "שלום אדוני איך אתה מרגיש למה קראת לנו תענה לי",
  "מה כואב לך תענה לי",
  "האם הכאב מקרין לאן תענה לי",
  "מה אתה לוקח תרופות תענה לי",
  "האם יש לך אלרגיות תענה לי",
  "האם אתה מעשן תענה לי",
  "מתי בדיוק התחיל הכאב תענה לי",
  "האם יש לך בחילה תענה לי",
  "האם יש לך סוכרת תענה לי",
  "מה אכלת לאחרונה תענה לי"
];

(async () => {
  const history = [];
  console.log("=== Multi-turn conversation simulation ===\n");
  const seenAnswers = new Set();
  let dupes = 0;
  for (const q of conversation) {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        caseId: "case-chest-pain",
        userQuestion: q,
        history
      })
    });
    const data = await res.json();
    const a = data.answer;
    const isDupe = seenAnswers.has(a);
    if (isDupe) dupes++;
    seenAnswers.add(a);
    const tag = isDupe ? "🔁 DUPE" : "✨ NEW ";
    console.log(`Q (${data.source}): ${q.slice(0, 50)}`);
    console.log(`${tag} A: ${a.slice(0, 90)}`);
    console.log();
    history.push({ q, a });
  }
  console.log(`=== Result: ${seenAnswers.size}/${conversation.length} unique answers (${dupes} duplicates) ===`);
})();
