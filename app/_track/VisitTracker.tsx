"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Fires one "visit" event per session (per tab). Idempotent — refreshes
// within the same session don't double-count.
export function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "__visitFiredAt";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    // De-dup within 30 minutes
    if (Date.now() - last < 30 * 60 * 1000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    track({ type: "visit", page: window.location.pathname });
  }, []);
  return null;
}
