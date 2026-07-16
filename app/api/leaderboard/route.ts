import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

type Entry = {
  userId: string;
  username: string;
  xp: number;
  level: number;
  rankTitle: string;
  rankEmoji: string;
  accuracy: number;
  questionsAnswered: number;
  totalStudyTimeMs: number;
  daysActive: number;
  examScoresAvg: number;
  lastActive: number;
};

/**
 * In-memory store. Survives between requests as long as the serverless
 * function stays warm. Cold starts wipe it - acceptable trade-off
 * without a real DB. To enable persistence, attach a Vercel KV store
 * and swap getStore() to use it.
 */
const store: Map<string, Entry> = (globalThis as any).__lbStore || new Map();
(globalThis as any).__lbStore = store;

const MAX_ENTRIES = 500;

const sanitize = (e: any): Entry | null => {
  if (!e || typeof e !== "object") return null;
  if (typeof e.userId !== "string" || !e.userId) return null;
  return {
    userId: String(e.userId).slice(0, 64),
    username: String(e.username || "חובש/ת").slice(0, 40),
    xp: Math.max(0, Math.min(99999, Number(e.xp) || 0)),
    level: Math.max(1, Math.min(99, Number(e.level) || 1)),
    rankTitle: String(e.rankTitle || "חניך").slice(0, 30),
    rankEmoji: String(e.rankEmoji || "🌱").slice(0, 4),
    accuracy: Math.max(0, Math.min(100, Number(e.accuracy) || 0)),
    questionsAnswered: Math.max(0, Math.min(99999, Number(e.questionsAnswered) || 0)),
    totalStudyTimeMs: Math.max(0, Math.min(7 * 24 * 60 * 60 * 1000 * 365, Number(e.totalStudyTimeMs) || 0)),
    daysActive: Math.max(0, Math.min(3650, Number(e.daysActive) || 0)),
    examScoresAvg: Math.max(0, Math.min(100, Number(e.examScoresAvg) || 0)),
    lastActive: Date.now()
  };
};

export async function GET() {
  // Return up to MAX_ENTRIES entries, freshest first activity, then sorted by xp client-side
  const entries = Array.from(store.values())
    .sort((a, b) => b.xp - a.xp)
    .slice(0, MAX_ENTRIES);
  return NextResponse.json({ entries, totalUsers: store.size });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sanitized = sanitize(body);
    if (!sanitized) {
      return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
    }
    // Anti-spam: light rate by user id (store.size cap)
    if (store.size > MAX_ENTRIES * 2 && !store.has(sanitized.userId)) {
      // Drop oldest 50% to keep store healthy
      const sorted = Array.from(store.entries()).sort((a, b) => a[1].lastActive - b[1].lastActive);
      sorted.slice(0, Math.floor(sorted.length / 2)).forEach(([k]) => store.delete(k));
    }
    store.set(sanitized.userId, sanitized);
    return NextResponse.json({ status: "ok", totalUsers: store.size });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
