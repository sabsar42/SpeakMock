import { NextRequest, NextResponse } from "next/server";
import { generateIceServers } from "simli-client";
import { supabaseServer } from "@/lib/supabase/server";

const SIMLI_API_URL = "https://api.simli.ai";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
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

  const apiKey = process.env.SIMLI_API_KEY;
  const faceId = process.env.NEXT_PUBLIC_SIMLI_FACE_ID;

  if (!apiKey || !faceId) {
    return NextResponse.json(
      { error: "Simli is not configured on the server." },
      { status: 500 }
    );
  }

  const simliRes = await fetch(`${SIMLI_API_URL}/compose/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-simli-api-key": apiKey,
    },
    body: JSON.stringify({
      faceId,
      handleSilence: true,
      maxSessionLength: 1200,
      maxIdleTime: 60,
    }),
  });

  const simliData = await simliRes.json();

  if (!simliRes.ok || !simliData.session_token) {
    console.error("Simli session creation failed:", simliData);
    return NextResponse.json(
      { error: "Could not start the avatar session. Please try again." },
      { status: 502 }
    );
  }

  const iceServers = await generateIceServers(apiKey, SIMLI_API_URL);

  await supabase
    .from("ai_test_sessions")
    .update({ simli_session_id: simliData.session_token })
    .eq("id", session.id);

  return NextResponse.json({
    session_token: simliData.session_token,
    ice_servers: iceServers,
  });
}
