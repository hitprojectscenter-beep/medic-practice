// Smoke test - verify all 40 new cases respond properly via the AI.

const URL = "https://medic-practice.vercel.app/api/dialogue";

const NEW_CASE_IDS = [
  // Batch 1
  "case-chf-exacerbation", "case-pe-massive", "case-pneumothorax-spontaneous",
  "case-aortic-dissection", "case-stemi-inferior", "case-copd-exacerbation",
  "case-status-asthmaticus", "case-sah", "case-meningitis-adult", "case-dka",
  // Batch 2
  "case-gi-bleed-upper", "case-cholecystitis", "case-kidney-stone", "case-pyelonephritis",
  "case-ectopic-pregnancy", "case-preeclampsia", "case-imminent-delivery",
  "case-head-injury", "case-spinal-injury", "case-opioid-od", "case-co-poisoning",
  "case-croup", "case-fb-aspiration-toddler", "case-tia", "case-hemorrhagic-stroke",
  // Batch 3
  "case-pulmonary-edema-acute", "case-bowel-obstruction", "case-testicular-torsion",
  "case-pediatric-burn-scald", "case-arrhythmia-svt", "case-bell-palsy",
  "case-vertigo-bppv", "case-alcohol-intox", "case-electrical-injury",
  "case-stab-neck", "case-blunt-abd-trauma", "case-suicide-attempt",
  "case-sepsis-elderly", "case-anaphylaxis-bee", "case-crush-injury"
];

let pass = 0, fail = 0;
for (const id of NEW_CASE_IDS) {
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        caseId: id,
        userQuestion: "מה כואב לך תענה לי",
        history: []
      })
    });
    const data = await res.json();
    const ok = res.ok && data.answer && data.answer.length > 10;
    if (ok) pass++; else fail++;
    console.log(`${ok ? "✅" : "❌"}  [${id}] (${data.source}): ${data.answer?.slice(0, 70) || "ERROR"}`);
  } catch (e) {
    fail++;
    console.log(`❌  [${id}] error: ${e.message}`);
  }
}
console.log(`\n=== ${pass}/${NEW_CASE_IDS.length} new cases working ===`);
