"use client";

// Client-side event tracker for the admin dashboard.
// Fire-and-forget: never blocks UI, never throws.

export type TrackEvent =
  | { type: "visit"; page?: string }
  | { type: "question_answered"; topic?: string; correct: boolean }
  | { type: "anamnesis_completed"; caseId?: string; score?: number }
  | { type: "scenario_started"; scenarioId?: string }
  | { type: "scenario_completed"; scenarioId?: string }
  | { type: "exam_completed"; score: number };

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("userProfile");
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.id) return String(p.id);
      if (p?.username) return "u_" + String(p.username);
    }
  } catch {}
  let anon = localStorage.getItem("anonId");
  if (!anon) {
    anon =
      "anon_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36);
    localStorage.setItem("anonId", anon);
  }
  return anon;
}

export function track(event: TrackEvent): void {
  if (typeof window === "undefined") return;
  const userId = getUserId();
  if (!userId) return;
  const payload = { ...event, userId };
  try {
    // keepalive lets the request complete even during page navigation
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
