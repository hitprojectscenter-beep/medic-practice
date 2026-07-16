import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";
export const maxDuration = 10;

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, userId } = body || {};
    if (!type || !userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const uid = String(userId).slice(0, 64);
    const d = today();

    // All-time unique users + last seen
    await kv.sadd("users:all", uid);
    await kv.set(`users:${uid}:last_seen`, Date.now());

    switch (type) {
      case "visit": {
        await kv.hincrby(`stats:daily:${d}`, "visits", 1);
        await kv.sadd(`stats:daily:${d}:unique_users`, uid);
        break;
      }
      case "question_answered": {
        const { topic, correct } = body;
        await kv.hincrby(`stats:daily:${d}`, "questions_answered", 1);
        if (correct)
          await kv.hincrby(`stats:daily:${d}`, "questions_correct", 1);
        if (topic) {
          const t = String(topic).slice(0, 60);
          await kv.hincrby(`stats:topic:${t}`, "answered", 1);
          if (correct) await kv.hincrby(`stats:topic:${t}`, "correct", 1);
        }
        break;
      }
      case "anamnesis_completed": {
        const { caseId } = body;
        await kv.hincrby(`stats:daily:${d}`, "anamnesis_completed", 1);
        if (caseId) {
          const cid = String(caseId).slice(0, 60);
          await kv.hincrby(`stats:anamnesis:${cid}`, "completed", 1);
        }
        break;
      }
      case "scenario_started": {
        const { scenarioId } = body;
        await kv.hincrby(`stats:daily:${d}`, "scenarios_started", 1);
        if (scenarioId) {
          const sid = String(scenarioId).slice(0, 60);
          await kv.hincrby(`stats:scenario:${sid}`, "started", 1);
        }
        break;
      }
      case "scenario_completed": {
        const { scenarioId } = body;
        await kv.hincrby(`stats:daily:${d}`, "scenarios_completed", 1);
        if (scenarioId) {
          const sid = String(scenarioId).slice(0, 60);
          await kv.hincrby(`stats:scenario:${sid}`, "completed", 1);
        }
        break;
      }
      case "exam_completed": {
        const score = Math.max(0, Math.min(100, Number(body.score) || 0));
        await kv.hincrby(`stats:daily:${d}`, "exams_completed", 1);
        await kv.hincrby(`stats:daily:${d}`, "exam_score_sum", score);
        break;
      }
      default:
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
