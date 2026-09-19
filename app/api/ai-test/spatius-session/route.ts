import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Regional console host. Only relevant if the account's app was provisioned
// in a different region — see https://app.spatius.ai console settings.
const SPATIUS_CONSOLE_URL =
  process.env.SPATIUS_CONSOLE_URL ?? "https://console.us-west.spatius.ai";

// Session tokens must expire within 24h of issuance. 20 minutes covers the
// longest a Part 1-3 test can realistically run, with headroom.
const TOKEN_LIFETIME_SECONDS = 20 * 60;

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

  const apiKey = process.env.SPATIUS_API_KEY;
  const appId = process.env.NEXT_PUBLIC_SPATIUS_APP_ID;
  const avatarId = process.env.NEXT_PUBLIC_SPATIUS_AVATAR_ID;

  if (!apiKey || !appId || !avatarId) {
    return NextResponse.json(
      { error: "Spatius is not configured on the server." },
      { status: 500 }
    );
  }

  const expireAt = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;

  const spatiusRes = await fetch(`${SPATIUS_CONSOLE_URL}/v1/console/session-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ expireAt }),
  });

  const spatiusData = await spatiusRes.json();

  if (!spatiusRes.ok || !spatiusData.sessionToken) {
    console.error("Spatius session creation failed:", spatiusData);
    return NextResponse.json(
      { error: "Could not start the avatar session. Please try again." },
      { status: 502 }
    );
  }

  await supabase
    .from("ai_test_sessions")
    .update({ spatius_session_id: spatiusData.sessionToken })
    .eq("id", session.id);

  return NextResponse.json({
    session_token: spatiusData.sessionToken,
    app_id: appId,
    avatar_id: avatarId,
  });
}
