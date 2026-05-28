import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured - using browser STT only" },
        { status: 503 }
      );
    }
    const form = await req.formData();
    const file = form.get("audio") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "he",
      response_format: "text"
    });
    const text = typeof transcription === "string" ? transcription : (transcription as any).text;
    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("/api/transcribe error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
