"use client";

/**
 * Leaderboard / dashboard system
 *
 * Two data sources:
 * 1. Ghost users (baseline distribution from realistic medic-student percentiles)
 *    — always available, no network call.
 * 2. Real users via /api/leaderboard — opt-in via "share my stats" toggle.
 *
 * The dashboard merges both and reports the user's rank + percentile.
 */

import { loadProfile, UserProfile } from "./userProfile";
import { loadStats, GameStats, getRank } from "./gamification";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  xp: number;
  level: number;
  rankTitle: string;
  rankEmoji: string;
  accuracy: number;        // 0-100
  questionsAnswered: number;
  totalStudyTimeMs: number;
  daysActive: number;
  examScoresAvg: number;   // 0-100
  lastActive: number;      // timestamp
  isYou?: boolean;
  isGhost?: boolean;
};

// ============ Ghost users (deterministic seeded distribution) ============
// Based on a realistic Israeli medic course cohort:
// - ~10% experts (4000+ XP, 85+% accuracy)
// - ~20% advanced (2000-4000 XP, 75-85%)
// - ~35% intermediate (800-2000 XP, 60-75%)
// - ~35% beginners (under 800 XP, 40-60%)

const HEBREW_NICKNAMES = [
  "אורי המהיר", "נועה החדה", "יואב הקרבי", "תמר המנוסה", "דניאל הזריז",
  "שירה הסטודנטית", "איתי החובש", "מיה הוותיקה", "רן המתחיל", "ליאת המקצועית",
  "אדם המסור", "עומר הלוחם", "הילה הסבלנית", "ערן המומחה", "יערה המתאמנת",
  "אריאל המהיר", "שני הנחושה", "ניר הלמדן", "טל היסודית", "אופיר הזריז",
  "רוני הסטז'ר", "מאי המתמידה", "עמית הצעיר", "אביגיל הוותיקה", "יונתן המעמיק",
  "סיון הקרבית", "אסף הקפדן", "רונית הרצינית", "אבי הוותיק", "נטע המוכשרת"
];

const GHOST_USERS: LeaderboardEntry[] = HEBREW_NICKNAMES.map((name, i) => {
  // Bucket-based distribution
  let xp: number, accuracy: number, level: number, questionsAnswered: number, examScoresAvg: number;
  if (i < 3) {
    // Top tier - 10%
    xp = 4200 + (i * 380);
    accuracy = 88 + (i * 1.2);
    level = 8;
    questionsAnswered = 380 + i * 25;
    examScoresAvg = 90 + (i * 1.5);
  } else if (i < 9) {
    // Advanced - 20%
    xp = 2100 + ((i - 3) * 230);
    accuracy = 76 + ((i - 3) * 1.4);
    level = 6 + Math.floor((i - 3) / 3);
    questionsAnswered = 200 + ((i - 3) * 22);
    examScoresAvg = 78 + ((i - 3) * 1.3);
  } else if (i < 19) {
    // Intermediate - 35%
    xp = 850 + ((i - 9) * 100);
    accuracy = 62 + ((i - 9) * 1.3);
    level = 3 + Math.floor((i - 9) / 4);
    questionsAnswered = 100 + ((i - 9) * 8);
    examScoresAvg = 65 + ((i - 9) * 1.2);
  } else {
    // Beginners - 35%
    xp = 80 + ((i - 19) * 60);
    accuracy = 42 + ((i - 19) * 1.5);
    level = 1 + Math.floor((i - 19) / 5);
    questionsAnswered = 12 + ((i - 19) * 6);
    examScoresAvg = 45 + ((i - 19) * 1.3);
  }
  const r = getRank(level);
  const totalStudyMin = Math.round(questionsAnswered * 0.7 + xp / 25); // ~0.7 min per question
  const daysActive = Math.min(45, Math.max(1, Math.round(xp / 120)));
  return {
    userId: `ghost-${i}`,
    username: name,
    xp,
    level,
    rankTitle: r.title,
    rankEmoji: r.emoji,
    accuracy: Math.round(accuracy),
    questionsAnswered,
    totalStudyTimeMs: totalStudyMin * 60 * 1000,
    daysActive,
    examScoresAvg: Math.round(examScoresAvg),
    lastActive: Date.now() - (i * 1000 * 60 * 60 * (Math.random() * 24)),
    isGhost: true
  };
});

// ============ Build current user's entry from local profile ============
export const buildYourEntry = (): LeaderboardEntry | null => {
  const profile = loadProfile();
  const stats = loadStats();
  if (!stats || stats.totalAnswered === 0) {
    // Not enough data yet
    return {
      userId: profile.userId,
      username: profile.username,
      xp: 0,
      level: 1,
      rankTitle: "חניך/ה",
      rankEmoji: "🌱",
      accuracy: 0,
      questionsAnswered: 0,
      totalStudyTimeMs: 0,
      daysActive: 0,
      examScoresAvg: 0,
      lastActive: Date.now(),
      isYou: true
    };
  }
  const rank = getRank(stats.level || 1);
  const accuracy = stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const totalStudyTimeMs = profile.examHistory.reduce((s, e) => s + (e.durationMs || 0), 0);
  const examScores = profile.examHistory.filter(e => e.type === "exam");
  const examScoresAvg = examScores.length
    ? Math.round(examScores.reduce((s, e) => s + e.scorePercent, 0) / examScores.length)
    : accuracy;
  return {
    userId: profile.userId,
    username: profile.username,
    xp: stats.xp,
    level: stats.level,
    rankTitle: rank.title,
    rankEmoji: rank.emoji,
    accuracy,
    questionsAnswered: stats.totalAnswered,
    totalStudyTimeMs,
    daysActive: stats.daysActive?.length || 1,
    examScoresAvg,
    lastActive: Date.now(),
    isYou: true
  };
};

// ============ Compose the merged leaderboard ============
export const buildLeaderboard = (realUsers: LeaderboardEntry[] = []): LeaderboardEntry[] => {
  const me = buildYourEntry();
  const all = [...GHOST_USERS, ...realUsers];
  if (me) {
    // Replace existing entry with same userId if present
    const existingIdx = all.findIndex(e => e.userId === me.userId);
    if (existingIdx >= 0) all[existingIdx] = me;
    else all.push(me);
  }
  // Rank by XP descending
  all.sort((a, b) => b.xp - a.xp);
  return all;
};

export type RankInfo = {
  rank: number;
  totalUsers: number;
  percentile: number;
  betterThanCount: number;
};

export const computeMyRank = (board: LeaderboardEntry[]): RankInfo | null => {
  const idx = board.findIndex(e => e.isYou);
  if (idx < 0) return null;
  const total = board.length;
  const rank = idx + 1;
  const betterThanCount = total - rank;
  const percentile = Math.round((betterThanCount / Math.max(1, total - 1)) * 100);
  return { rank, totalUsers: total, percentile, betterThanCount };
};

// ============ Real leaderboard sync via API ============
type RealLeaderboardResponse = {
  entries: Omit<LeaderboardEntry, "isYou" | "isGhost">[];
};

export const fetchRealLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const res = await fetch("/api/leaderboard", { method: "GET", cache: "no-store" });
    if (!res.ok) return [];
    const data: RealLeaderboardResponse = await res.json();
    return (data.entries || []).map(e => ({ ...e }));
  } catch {
    return [];
  }
};

export const syncMyStats = async (entry: LeaderboardEntry): Promise<void> => {
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
  } catch {
    // Silent fail - leaderboard is best-effort
  }
};

// ============ Formatting helpers ============
export const formatStudyTime = (ms: number): string => {
  if (!ms || ms < 1000) return "0 דק׳";
  const totalMin = Math.round(ms / (1000 * 60));
  if (totalMin < 60) return `${totalMin} דק׳`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m ? `${h} ש׳ ${m} דק׳` : `${h} ש׳`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH ? `${d} ימים ${remH} ש׳` : `${d} ימים`;
};

export const formatLastActive = (ts: number): string => {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "כעת";
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} ש׳`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `לפני ${days} ימים`;
  return `לפני ${Math.floor(days / 7)} שבועות`;
};
