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

  // Whisper was trained on YouTube videos with subtitles, so when fed audio
  // with little or no real speech (silence, or a burst of the avatar's own
  // voice echoing through the speakers into the mic) it falls back to
  // filler phrases lifted from that training data — "Thank you.", "Thanks
  // for watching.", "Bye.", etc. — stated with completely normal-looking
  // confidence. This is a well-documented Whisper failure mode; per-segment
  // no_speech_prob/avg_logprob does NOT reliably catch it (verified against
  // Groq's actual API on 3s of pure silence: it returned "Thank you." with
  // no_speech_prob 0 and avg_logprob -0.29 — both look like a real,
  // confident transcription). A known-phrase blocklist is the documented,
  // reliable mitigation instead: if the *entire* transcript is nothing but
  // one of these stock phrases, it's essentially always this artifact, not
  // an IELTS candidate's actual answer.
  const HALLUCINATION_PHRASES = [
    "thank you",
    "thanks for watching",
    "thank you for watching",
    "please subscribe",
    "bye",
    "goodbye",
    "see you next time",
    "subtitles by",
    "amara.org",
  ];

  function isLikelyHallucination(text: string): boolean {
    const normalized = text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .trim();
    return HALLUCINATION_PHRASES.includes(normalized);
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    const text = result.text?.trim() ?? "";

    if (isLikelyHallucination(text)) {
      // Treat as "nothing was said" rather than saving a hallucinated stock
      // phrase as if it were the student's real answer.
      return NextResponse.json({ text: "" });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json({ error: "Could not transcribe audio." }, { status: 502 });
  }
}
