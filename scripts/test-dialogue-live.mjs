// Tests the live API using Node's fetch (proper UTF-8) - mimics the browser

const URL = "https://medic-practice.vercel.app/api/dialogue";

const cases = [
  { q: "מה כואב לך תענה לי", expect: "כאב|לוחץ|החזה" },
  { q: "מתי התחיל הכאב תענה לי", expect: "התחיל|חצי שעה" },
  { q: "האם אתה סוכרתי תענה לי", expect: "סוכרת" },
  { q: "מקרין הכאב תענה לי", expect: "זרוע|לסת|מקרין" },
  { q: "מה אתה לוקח תרופות תענה לי", expect: "רמיפריל|תרופה" },
  { q: "מה אתה מעשן תענה לי", expect: "מעשן|עישון" },
  { q: "האם יש לך אלרגיה תענה לי", expect: "אלרגיות|אלרגיה" }
];

(async () => {
  for (const c of cases) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ caseId: "case-chest-pain", userQuestion: c.q })
      });
      const data = await res.json();
      const matchExpected = new RegExp(c.expect).test(data.answer);
      const mark = matchExpected ? "✅" : "❌";
      console.log(`${mark}  Q: "${c.q}"`);
      console.log(`    A: "${data.answer.slice(0, 70)}"`);
      console.log(`    debug:`, JSON.stringify(data.debug || {}));
      console.log();
    } catch (e) {
      console.log(`❌  Q: "${c.q}" — error:`, e.message);
    }
  }
})();
