// Specifically test Q2 with the exact history from Q1

const history = [{
  q: "שלום אדוני איך אתה מרגיש למה קראת לנו תענה לי",
  a: "כאב לוחץ, כבד, לא חד. כמו לחץ חזק."
}];

const res = await fetch("https://medic-practice.vercel.app/api/dialogue", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    caseId: "case-chest-pain",
    userQuestion: "מה כואב לך תענה לי",
    history
  })
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
