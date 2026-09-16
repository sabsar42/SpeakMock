import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { AiTestPhase, AiTestSession, TranscriptTurn } from "@/lib/types";

const VALID_PHASES: AiTestPhase[] = [
  "not_started",
  "part1",
  "part2_prep",
  "part2_speaking",
  "part3",
  "scoring",
  "completed",
];

export async function POST(request: NextRequest) {
  let body: {
    token?: string;
    speaker?: "examiner" | "student";
    text?: string;
    part?: 1 | 2 | 3;
    question_id?: string | null;
    phase?: AiTestPhase;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token, speaker, text, part, question_id, phase } = body;

  if (!token || !speaker || !text?.trim() || !part) {
    return NextResponse.json(
      { error: "token, speaker, text, and part are required." },
      { status: 400 }
    );
  }

  if (phase && !VALID_PHASES.includes(phase)) {
    return NextResponse.json({ error: "Invalid phase." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("ai_test_sessions")
    .select("id, transcript, started_at")
    .eq("token", token)
    .maybeSingle<AiTestSession>();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const turn: TranscriptTurn = {
    speaker,
    text: text.trim(),
    part,
    question_id: question_id ?? null,
    at: new Date().toISOString(),
  };

  const updatedTranscript = [...(session.transcript ?? []), turn];

  const update: Record<string, unknown> = { transcript: updatedTranscript };
  if (phase) update.phase = phase;
  if (!session.started_at) update.started_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("ai_test_sessions")
    .update(update)
    .eq("id", session.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not save turn." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
