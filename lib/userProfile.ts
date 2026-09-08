"use client";

/**
 * User Profile System
 *
 * Local-first store of per-user practice trends + topic mastery.
 * Data lives in localStorage as a single namespaced JSON blob,
 * but the shape is designed to be backend-portable (sync to a real DB later).
 */

import { questions, topics as ALL_TOPICS } from "@/data/questions";

const STORAGE_KEY = "medic-app-user-profile-v1";

export type ExamRecord = {
  timestamp: number;
  type: "quiz" | "exam" | "anamnesis";
  topic?: string; // for topic-specific quizzes
  scorePercent: number;
  questionsTotal: number;
  questionsCorrect: number;
  durationMs?: number;
};

export type TopicMastery = {
  topic: string;
  answered: number;
  correct: number;
  accuracy: number; // 0-1
  mastery: "weak" | "developing" | "strong"; // < 0.5, 0.5-0.75, > 0.75
  lastPracticedTimestamp?: number;
};

export type UserProfile = {
  userId: string;
  username: string;
  createdAt: number;
  examHistory: ExamRecord[];
  /** Per-question history: { [questionId]: { times, correct, lastAnswered } } */
  questionHistory: Record<string, { times: number; correct: number; lastAnswered: number }>;
};

/** Skill level 1-5 derived from overall accuracy + sample size */
export type SkillLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  emoji: string;
  description: string;
};

/** Trend over last N exams */
export type TrendInfo = {
  direction: "up" | "down" | "stable" | "no-data";
  delta: number; // percentage points
  recentAvg: number;
  previousAvg: number;
  sampleSize: number;
};

// ============ Storage helpers ============
const generateUserId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const emptyProfile = (): UserProfile => ({
  userId: generateUserId(),
  username: "חובש/ת",
  createdAt: Date.now(),
  examHistory: [],
  questionHistory: {}
});

export const loadProfile = (): UserProfile => {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const p = emptyProfile();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      return p;
    }
    const parsed = JSON.parse(raw) as UserProfile;
    // Validate / migrate
    if (!parsed.userId) parsed.userId = generateUserId();
    if (!parsed.username) parsed.username = "חובש/ת";
    if (!parsed.examHistory) parsed.examHistory = [];
    if (!parsed.questionHistory) parsed.questionHistory = {};
    return parsed;
  } catch {
    return emptyProfile();
  }
};

export const saveProfile = (p: UserProfile): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
};

export const setUsername = (name: string): UserProfile => {
  const p = loadProfile();
  p.username = name.trim() || "חובש/ת";
  saveProfile(p);
  return p;
};

export const recordAnswer = (questionId: string, correct: boolean): void => {
  const p = loadProfile();
  const cur = p.questionHistory[questionId] || { times: 0, correct: 0, lastAnswered: 0 };
  p.questionHistory[questionId] = {
    times: cur.times + 1,
    correct: cur.correct + (correct ? 1 : 0),
    lastAnswered: Date.now()
  };
  saveProfile(p);
};

export const recordExam = (rec: Omit<ExamRecord, "timestamp">): void => {
  const p = loadProfile();
  p.examHistory.unshift({ ...rec, timestamp: Date.now() });
  // Cap history at 200 entries
  if (p.examHistory.length > 200) p.examHistory = p.examHistory.slice(0, 200);
  saveProfile(p);
};

// ============ Derived analytics ============
export const computeTopicMastery = (p: UserProfile): TopicMastery[] => {
  const result: TopicMastery[] = [];
  for (const topic of ALL_TOPICS) {
    const qIds = questions.filter(q => q.topic === topic).map(q => q.id);
    let answered = 0;
    let correct = 0;
    let lastTs = 0;
    for (const qid of qIds) {
      const h = p.questionHistory[qid];
      if (h) {
        answered += h.times;
        correct += h.correct;
        if (h.lastAnswered > lastTs) lastTs = h.lastAnswered;
      }
    }
    const accuracy = answered ? correct / answered : 0;
    const mastery: TopicMastery["mastery"] = answered < 3 ? "weak" : accuracy < 0.5 ? "weak" : accuracy < 0.75 ? "developing" : "strong";
    result.push({
      topic,
      answered,
      correct,
      accuracy,
      mastery,
      lastPracticedTimestamp: lastTs || undefined
    });
  }
  return result.sort((a, b) => a.accuracy - b.accuracy);
};

export const computeSkillLevel = (p: UserProfile): SkillLevel => {
  const totalQs = Object.values(p.questionHistory).reduce((s, h) => s + h.times, 0);
  const totalCorrect = Object.values(p.questionHistory).reduce((s, h) => s + h.correct, 0);

  if (totalQs < 10) {
    return { level: 1, title: "מתחיל/ה", emoji: "🌱", description: `נדרשות עוד ${10 - totalQs} שאלות לקביעת רמה.` };
  }

  const overallAccuracy = totalCorrect / totalQs;

  if (overallAccuracy < 0.5) return { level: 1, title: "מתחיל/ה", emoji: "🌱", description: "התחל עם נושאי בסיס - אנטומיה, טרמינולוגיה, החייאה." };
  if (overallAccuracy < 0.65) return { level: 2, title: "מתאמן/ת", emoji: "📖", description: "אתה משתפר. התמקד בנושאים החלשים שלך לעלייה ברמה." };
  if (overallAccuracy < 0.80) return { level: 3, title: "חובש/ת", emoji: "🩺", description: "טוב מאוד! נסה תרגול במצבי לחץ ומקרים מורכבים." };
  if (overallAccuracy < 0.90) return { level: 4, title: "חובש/ת מנוסה", emoji: "🏥", description: "רמה מצוינת. התמקד בפינוחים, התמודדות עם מקרי גבול." };
  return { level: 5, title: "חובש/ת בכיר/ה", emoji: "👨‍⚕️", description: "רמה גבוהה! המשך לתחזק עם תרגול מתקדם ומקרים מאתגרים." };
};

export const computeTrend = (p: UserProfile): TrendInfo => {
  const history = p.examHistory.filter(e => e.type === "quiz" || e.type === "exam");
  if (history.length < 4) {
    return { direction: "no-data", delta: 0, recentAvg: 0, previousAvg: 0, sampleSize: history.length };
  }
  const recent = history.slice(0, 3);
  const previous = history.slice(3, 6);
  const recentAvg = recent.reduce((s, e) => s + e.scorePercent, 0) / recent.length;
  const previousAvg = previous.length
    ? previous.reduce((s, e) => s + e.scorePercent, 0) / previous.length
    : recentAvg;
  const delta = Math.round(recentAvg - previousAvg);
  const direction: TrendInfo["direction"] =
    delta > 5 ? "up" : delta < -5 ? "down" : "stable";
  return {
    direction,
    delta,
    recentAvg: Math.round(recentAvg),
    previousAvg: Math.round(previousAvg),
    sampleSize: recent.length
  };
};

// ============ Adaptive question selection ============
/**
 * Choose a quiz pool that emphasizes the user's weakest topics.
 * Strategy: 60% of slots from weak topics, 25% from developing, 15% from strong (reinforcement).
 */
export const buildAdaptiveQuizPool = (
  desiredCount: number,
  filterTopic?: string,
  filterTopics?: string[]
): typeof questions => {
  const p = loadProfile();
  // Multi-topic filter (union of topics)
  if (filterTopics && filterTopics.length > 0) {
    const set = new Set(filterTopics);
    return rankByNeed(questions.filter(q => set.has(q.topic)), p).slice(0, desiredCount);
  }
  if (filterTopic && filterTopic !== "all") {
    // Topic-locked - just shuffle topic questions, but deprioritize ones answered correctly recently
    return rankByNeed(questions.filter(q => q.topic === filterTopic), p).slice(0, desiredCount);
  }

  const mastery = computeTopicMastery(p);
  const weakTopics = mastery.filter(m => m.mastery === "weak").map(m => m.topic);
  const developingTopics = mastery.filter(m => m.mastery === "developing").map(m => m.topic);
  const strongTopics = mastery.filter(m => m.mastery === "strong").map(m => m.topic);

  const weakQs = questions.filter(q => weakTopics.includes(q.topic as any));
  const devQs = questions.filter(q => developingTopics.includes(q.topic as any));
  const strQs = questions.filter(q => strongTopics.includes(q.topic as any));

  const weakSlots = Math.round(desiredCount * 0.6);
  const devSlots = Math.round(desiredCount * 0.25);
  const strongSlots = desiredCount - weakSlots - devSlots;

  const pool = [
    ...rankByNeed(weakQs, p).slice(0, weakSlots),
    ...rankByNeed(devQs, p).slice(0, devSlots),
    ...rankByNeed(strQs, p).slice(0, strongSlots)
  ];

  // If we couldn't fill (e.g. user has only practiced 1-2 topics), pad with random
  if (pool.length < desiredCount) {
    const seen = new Set(pool.map(q => q.id));
    const rest = questions.filter(q => !seen.has(q.id));
    rest.sort(() => Math.random() - 0.5);
    pool.push(...rest.slice(0, desiredCount - pool.length));
  }

  // Shuffle final pool so user doesn't see weak-topics clustered first
  pool.sort(() => Math.random() - 0.5);
  return pool;
};

/**
 * Rank questions by how much the user "needs" them:
 * - Never answered ⇒ highest priority
 * - Answered incorrectly recently ⇒ high priority
 * - Answered correctly long ago ⇒ medium
 * - Answered correctly recently ⇒ low
 */
const rankByNeed = (qs: typeof questions, p: UserProfile): typeof questions => {
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  return [...qs].sort((a, b) => {
    const ha = p.questionHistory[a.id];
    const hb = p.questionHistory[b.id];
    const scoreA = needScore(ha, now, WEEK);
    const scoreB = needScore(hb, now, WEEK);
    return scoreB - scoreA;
  });
};

const needScore = (h: UserProfile["questionHistory"][string] | undefined, now: number, week: number): number => {
  if (!h || h.times === 0) return 100; // never seen → top priority
  const accuracy = h.correct / h.times;
  const ageWeeks = (now - h.lastAnswered) / week;
  // Lower accuracy → higher need; older → higher need (forgetting curve)
  return (1 - accuracy) * 60 + Math.min(ageWeeks * 10, 40);
};

// ============ Export reset ============
export const resetProfile = (): UserProfile => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return loadProfile();
};
