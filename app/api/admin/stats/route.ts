import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";
export const maxDuration = 15;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

type Daily = {
  date: string;
  visits: number;
  uniqueUsers: number;
  questionsAnswered: number;
  questionsCorrect: number;
  anamnesisCompleted: number;
  scenariosStarted: number;
  scenariosCompleted: number;
  examsCompleted: number;
  examScoreSum: number;
};

export async function GET(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const now = new Date();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const totalUsers = await kv.scard("users:all");

  const dailyStats: Daily[] = await Promise.all(
    days.map(async (d): Promise<Daily> => {
      const stats = (await kv.hgetall<any>(`stats:daily:${d}`)) || {};
      const uniqueUsers = await kv.scard(`stats:daily:${d}:unique_users`);
      return {
        date: d,
        visits: Number(stats.visits) || 0,
        uniqueUsers,
        questionsAnswered: Number(stats.questions_answered) || 0,
        questionsCorrect: Number(stats.questions_correct) || 0,
        anamnesisCompleted: Number(stats.anamnesis_completed) || 0,
        scenariosStarted: Number(stats.scenarios_started) || 0,
        scenariosCompleted: Number(stats.scenarios_completed) || 0,
        examsCompleted: Number(stats.exams_completed) || 0,
        examScoreSum: Number(stats.exam_score_sum) || 0,
      };
    })
  );

  const totals = dailyStats.reduce(
    (acc, d) => ({
      visits: acc.visits + d.visits,
      uniqueUsers: acc.uniqueUsers + d.uniqueUsers,
      questionsAnswered: acc.questionsAnswered + d.questionsAnswered,
      questionsCorrect: acc.questionsCorrect + d.questionsCorrect,
      anamnesisCompleted: acc.anamnesisCompleted + d.anamnesisCompleted,
      scenariosStarted: acc.scenariosStarted + d.scenariosStarted,
      scenariosCompleted: acc.scenariosCompleted + d.scenariosCompleted,
      examsCompleted: acc.examsCompleted + d.examsCompleted,
      examScoreSum: acc.examScoreSum + d.examScoreSum,
    }),
    {
      visits: 0,
      uniqueUsers: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      anamnesisCompleted: 0,
      scenariosStarted: 0,
      scenariosCompleted: 0,
      examsCompleted: 0,
      examScoreSum: 0,
    }
  );

  const today = dailyStats[dailyStats.length - 1];

  const topicKeys = await kv.keys("stats:topic:*");
  const topics = await Promise.all(
    topicKeys.map(async (k) => {
      const stats = (await kv.hgetall<any>(k)) || {};
      const answered = Number(stats.answered) || 0;
      const correct = Number(stats.correct) || 0;
      return {
        topic: k.replace("stats:topic:", ""),
        answered,
        correct,
        accuracy: answered > 0 ? Math.round((100 * correct) / answered) : 0,
      };
    })
  );
  topics.sort((a, b) => b.answered - a.answered);

  const scenarioKeys = await kv.keys("stats:scenario:*");
  const scenarios = await Promise.all(
    scenarioKeys.map(async (k) => {
      const stats = (await kv.hgetall<any>(k)) || {};
      const started = Number(stats.started) || 0;
      const completed = Number(stats.completed) || 0;
      return {
        id: k.replace("stats:scenario:", ""),
        started,
        completed,
        completionRate: started > 0 ? Math.round((100 * completed) / started) : 0,
      };
    })
  );
  scenarios.sort((a, b) => b.started - a.started);

  const anamnesisKeys = await kv.keys("stats:anamnesis:*");
  const anamnesis = await Promise.all(
    anamnesisKeys.map(async (k) => {
      const stats = (await kv.hgetall<any>(k)) || {};
      return {
        id: k.replace("stats:anamnesis:", ""),
        completed: Number(stats.completed) || 0,
      };
    })
  );
  anamnesis.sort((a, b) => b.completed - a.completed);

  return NextResponse.json({
    ok: true,
    persistent: kv.isReal(),
    generatedAt: Date.now(),
    totalUsers,
    today,
    last14days: dailyStats,
    totals,
    topics: topics.slice(0, 30),
    scenarios: scenarios.slice(0, 40),
    anamnesis: anamnesis.slice(0, 40),
    examAccuracy:
      totals.questionsAnswered > 0
        ? Math.round((100 * totals.questionsCorrect) / totals.questionsAnswered)
        : 0,
    examAvgScore:
      totals.examsCompleted > 0
        ? Math.round(totals.examScoreSum / totals.examsCompleted)
        : 0,
    scenarioCompletionRate:
      totals.scenariosStarted > 0
        ? Math.round((100 * totals.scenariosCompleted) / totals.scenariosStarted)
        : 0,
  });
}
