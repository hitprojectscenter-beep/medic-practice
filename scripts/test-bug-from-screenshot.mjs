// Replays the exact questions from the user's bug-report screenshot

const URL = "https://medic-practice.vercel.app/api/dialogue";

const cases = [
  {
    q: "שלום אדוני איך אתה מרגיש למה קראת לנו תענה לי",
    badAnswer: "אין לי אלרגיות שאני יודע", // what the screenshot showed (WRONG)
    note: "Opening: how are you + why did you call us"
  },
  {
    q: "אוקיי זה מצוין שאין לך אלרגיות תגיד לי בבקשה מה אתה מרגיש האם כואב לך למה בעצם הזמנת אותנו תענה לי בקשה",
    badAnswer: "אין לי אלרגיות שאני יודע",
    note: "Follow-up: how do you feel + does it hurt + why did you call"
  }
];

(async () => {
  console.log("=== Replaying bug from screenshot ===\n");
  for (const c of cases) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ caseId: "case-chest-pain", userQuestion: c.q })
      });
      const data = await res.json();
      const stillBad = data.answer === c.badAnswer;
      console.log(`${stillBad ? "❌ STILL BUGGY" : "✅ FIXED"}  ${c.note}`);
      console.log(`  Q: "${c.q.slice(0, 60)}..."`);
      console.log(`  A: "${data.answer}"`);
      console.log();
    } catch (e) {
      console.log("❌ ERROR:", e.message);
    }
  }
})();
