import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const token = formData.get("token");

  if (!(audio instanceof File) || typeof token !== "string" || !token) {
    return NextResponse.json(
      { error: "audio and token are required." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();
  const { data: session, error: sessionError } = await supabase
    .from("ai_test_sessions")
    .select("id, is_deleted")
    .eq("token", token)
    .maybeSingle();

  if (sessionError || !session || session.is_deleted) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    return NextResponse.json({ text: result.text });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json({ error: "Could not transcribe audio." }, { status: 502 });
  }
}
