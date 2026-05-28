"use client";

// ============= Types =============
export type GameStats = {
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  totalAnamneses: number;
  totalExamsPassed: number;
  topicAccuracy: Record<string, { correct: number; total: number }>;
  achievementsUnlocked: string[];
  lastActiveDate: string;
  daysActive: string[]; // YYYY-MM-DD list
};

export type Rank = {
  level: number;
  title: string;
  emoji: string;
  color: string;
  minXp: number;
};

// ============= Constants =============
export const RANKS: Rank[] = [
  { level: 1, title: "חניך", emoji: "🌱", color: "#10b981", minXp: 0 },
  { level: 2, title: "חניך מתקדם", emoji: "🌿", color: "#14b8a6", minXp: 100 },
  { level: 3, title: "חובש מתחיל", emoji: "🩹", color: "#06b6d4", minXp: 250 },
  { level: 4, title: "חובש", emoji: "🚑", color: "#0ea5e9", minXp: 500 },
  { level: 5, title: "חובש מנוסה", emoji: "⚕️", color: "#3b82f6", minXp: 1000 },
  { level: 6, title: "חובש בכיר", emoji: "🏥", color: "#6366f1", minXp: 1750 },
  { level: 7, title: "חובש מומחה", emoji: "💉", color: "#8b5cf6", minXp: 2750 },
  { level: 8, title: "פראמדיק", emoji: "🚁", color: "#a855f7", minXp: 4000 },
  { level: 9, title: "פראמדיק בכיר", emoji: "🦸", color: "#d946ef", minXp: 5500 },
  { level: 10, title: "אגדה רפואית", emoji: "👑", color: "#f59e0b", minXp: 7500 }
];

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (s: GameStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-answer", title: "צעד ראשון", description: "ענית על השאלה הראשונה", emoji: "👶", check: s => s.totalAnswered >= 1 },
  { id: "10-correct", title: "מתחיל", description: "10 תשובות נכונות", emoji: "✅", check: s => s.totalCorrect >= 10 },
  { id: "50-correct", title: "מתמיד", description: "50 תשובות נכונות", emoji: "💪", check: s => s.totalCorrect >= 50 },
  { id: "100-correct", title: "ותיק", description: "100 תשובות נכונות", emoji: "🎯", check: s => s.totalCorrect >= 100 },
  { id: "streak-5", title: "מתחמם", description: "רצף של 5 תשובות נכונות", emoji: "🔥", check: s => s.bestStreak >= 5 },
  { id: "streak-10", title: "על האש", description: "רצף של 10 תשובות נכונות", emoji: "🔥🔥", check: s => s.bestStreak >= 10 },
  { id: "streak-20", title: "מקצוען", description: "רצף של 20 תשובות נכונות", emoji: "🔥🔥🔥", check: s => s.bestStreak >= 20 },
  { id: "first-anamnesis", title: "אנמנזה ראשונה", description: "השלמת מקרה אנמנזה", emoji: "🎙️", check: s => s.totalAnamneses >= 1 },
  { id: "5-anamneses", title: "אנמנזיסט", description: "5 מקרי אנמנזה", emoji: "🗣️", check: s => s.totalAnamneses >= 5 },
  { id: "15-anamneses", title: "מומחה אנמנזה", description: "כל 15 המקרים", emoji: "📋", check: s => s.totalAnamneses >= 15 },
  { id: "first-exam", title: "מבחן ראשון", description: "סיימת מבחן מעורב", emoji: "📝", check: s => s.totalExamsPassed >= 1 },
  { id: "5-exams", title: "תלמיד שקדן", description: "5 מבחנים", emoji: "📚", check: s => s.totalExamsPassed >= 5 },
  { id: "level-3", title: "חובש מתחיל", description: "הגעת לרמה 3", emoji: "🩹", check: s => s.level >= 3 },
  { id: "level-5", title: "חובש מנוסה", description: "הגעת לרמה 5", emoji: "⚕️", check: s => s.level >= 5 },
  { id: "level-8", title: "פראמדיק", description: "הגעת לרמה 8", emoji: "🚁", check: s => s.level >= 8 },
  { id: "level-10", title: "אגדה", description: "הגעת לרמה 10 - השיא!", emoji: "👑", check: s => s.level >= 10 },
  { id: "week-active", title: "שבוע של תרגול", description: "התאמנת 7 ימים שונים", emoji: "📅", check: s => s.daysActive.length >= 7 },
  { id: "month-active", title: "חודש של תרגול", description: "התאמנת 30 ימים שונים", emoji: "🗓️", check: s => s.daysActive.length >= 30 }
];

// ============= Storage =============
const STORAGE_KEY = "medic-practice-stats-v1";

const emptyStats = (): GameStats => ({
  xp: 0,
  level: 1,
  currentStreak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  totalAnamneses: 0,
  totalExamsPassed: 0,
  topicAccuracy: {},
  achievementsUnlocked: [],
  lastActiveDate: "",
  daysActive: []
});

export const loadStats = (): GameStats => {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as GameStats;
    return { ...emptyStats(), ...parsed };
  } catch {
    return emptyStats();
  }
};

export const saveStats = (stats: GameStats): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // storage full / disabled
  }
};

export const resetStats = (): GameStats => {
  const s = emptyStats();
  saveStats(s);
  return s;
};

// ============= Logic =============
export const calcLevel = (xp: number): number => {
  let lvl = 1;
  for (const r of RANKS) {
    if (xp >= r.minXp) lvl = r.level;
  }
  return lvl;
};

export const getRank = (level: number): Rank =>
  RANKS.find(r => r.level === level) || RANKS[0];

export const getNextRank = (level: number): Rank | null => {
  return RANKS.find(r => r.level === level + 1) || null;
};

export const xpToNextLevel = (xp: number): { current: number; needed: number; pct: number } => {
  const lvl = calcLevel(xp);
  const currentRank = getRank(lvl);
  const next = getNextRank(lvl);
  if (!next) return { current: xp - currentRank.minXp, needed: 0, pct: 100 };
  const diff = next.minXp - currentRank.minXp;
  const into = xp - currentRank.minXp;
  return { current: into, needed: diff, pct: Math.min(100, Math.round((into / diff) * 100)) };
};

const today = (): string => new Date().toISOString().slice(0, 10);

const updateDaysActive = (stats: GameStats): GameStats => {
  const t = today();
  if (stats.lastActiveDate === t) return stats;
  const set = new Set(stats.daysActive);
  set.add(t);
  return { ...stats, lastActiveDate: t, daysActive: Array.from(set) };
};

export type AnswerEvent = {
  kind: "quiz" | "anamnesis";
  topic: string;
  correct: boolean;
  /** למקרי אנמנזה: ציון מ-0 עד 100 */
  scorePct?: number;
};

const baseXpForQuiz = (correct: boolean, streak: number): number => {
  if (!correct) return 1; // נקודת ניחומים
  const base = 10;
  const streakBonus = Math.min(streak * 2, 30);
  return base + streakBonus;
};

const xpForAnamnesis = (scorePct: number): number => {
  return Math.round(scorePct * 0.5); // 0-50 XP per anamnesis case
};

export type StatChange = {
  xpGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  oldStreak: number;
  newStreak: number;
  unlockedAchievements: Achievement[];
};

export const recordAnswer = (event: AnswerEvent, currentStats: GameStats): { stats: GameStats; change: StatChange } => {
  let stats: GameStats = { ...currentStats };
  stats = updateDaysActive(stats);

  const oldLevel = stats.level;
  const oldStreak = stats.currentStreak;
  let xpGained = 0;

  if (event.kind === "quiz") {
    stats.totalAnswered += 1;
    if (event.correct) {
      stats.totalCorrect += 1;
      stats.currentStreak += 1;
      xpGained = baseXpForQuiz(true, stats.currentStreak);
    } else {
      stats.currentStreak = 0;
      xpGained = baseXpForQuiz(false, 0);
    }
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;

    // accuracy per topic
    const tag = event.topic || "כללי";
    const t = stats.topicAccuracy[tag] || { correct: 0, total: 0 };
    t.total += 1;
    if (event.correct) t.correct += 1;
    stats.topicAccuracy = { ...stats.topicAccuracy, [tag]: t };
  } else {
    // anamnesis
    stats.totalAnamneses += 1;
    xpGained = xpForAnamnesis(event.scorePct ?? 0);
  }

  stats.xp += xpGained;
  stats.level = calcLevel(stats.xp);

  const prevUnlocked = new Set(stats.achievementsUnlocked);
  const newUnlocks = ACHIEVEMENTS.filter(a => !prevUnlocked.has(a.id) && a.check(stats));
  if (newUnlocks.length > 0) {
    stats.achievementsUnlocked = [...stats.achievementsUnlocked, ...newUnlocks.map(a => a.id)];
  }

  saveStats(stats);

  return {
    stats,
    change: {
      xpGained,
      leveledUp: stats.level > oldLevel,
      oldLevel,
      newLevel: stats.level,
      oldStreak,
      newStreak: stats.currentStreak,
      unlockedAchievements: newUnlocks
    }
  };
};

export const recordExamComplete = (currentStats: GameStats): GameStats => {
  const stats = updateDaysActive({ ...currentStats, totalExamsPassed: currentStats.totalExamsPassed + 1 });
  // bonus XP for completing an exam
  stats.xp += 50;
  stats.level = calcLevel(stats.xp);
  const prev = new Set(stats.achievementsUnlocked);
  const fresh = ACHIEVEMENTS.filter(a => !prev.has(a.id) && a.check(stats));
  if (fresh.length) stats.achievementsUnlocked = [...stats.achievementsUnlocked, ...fresh.map(a => a.id)];
  saveStats(stats);
  return stats;
};

// ============= Streak-based emoji feedback =============
export const correctEmoji = (streak: number): string => {
  if (streak >= 20) return "🔥🔥🔥";
  if (streak >= 10) return "🔥🔥";
  if (streak >= 5) return "🔥";
  if (streak >= 3) return "⚡";
  return ["✅", "🎉", "✨", "💯", "🌟"][Math.floor(Math.random() * 5)];
};

export const wrongEmoji = (): string => {
  return ["💔", "😔", "🤔", "📚"][Math.floor(Math.random() * 4)];
};

export const milestoneEmoji = (score: number): string => {
  if (score >= 90) return "🏆";
  if (score >= 75) return "🥇";
  if (score >= 60) return "🥈";
  if (score >= 40) return "🥉";
  return "📖";
};
