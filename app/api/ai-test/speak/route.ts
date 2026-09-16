import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { textToPcm16 } from "@/lib/ai-test/tts";

export async function POST(request: NextRequest) {
  let body: { token?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.token || !body.text?.trim()) {
    return NextResponse.json({ error: "token and text are required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("ai_test_sessions")
    .select("id, is_deleted")
    .eq("token", body.token)
    .maybeSingle();

  if (sessionError || !session || session.is_deleted) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  try {
    const pcm = await textToPcm16(body.text.trim());
    return new NextResponse(Buffer.from(pcm), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS generation failed:", err);
    return NextResponse.json({ error: "Could not generate speech." }, { status: 502 });
  }
}
