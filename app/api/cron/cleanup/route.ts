import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || !providedSecret || !timingSafeStringEqual(providedSecret, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = supabaseServer();
  const now = new Date().toISOString();

  const { data: expiredSessions, error: fetchError } = await supabase
    .from("sessions")
    .select("id, result_file_path")
    .lt("expires_at", now)
    .eq("is_deleted", false);

  if (fetchError) {
    return NextResponse.json({ error: "Could not query expired sessions." }, { status: 500 });
  }

  let deletedCount = 0;

  for (const session of expiredSessions ?? []) {
    if (session.result_file_path) {
      const { error: storageError } = await supabase.storage
        .from("results")
        .remove([session.result_file_path]);

      if (storageError) {
        console.error(
          `Failed to delete result file for session ${session.id}:`,
          storageError
        );
      }
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ is_deleted: true })
      .eq("id", session.id);

    if (updateError) {
      console.error(`Failed to mark session ${session.id} as deleted:`, updateError);
      continue;
    }

    deletedCount += 1;
  }

  return NextResponse.json({ deleted: deletedCount, timestamp: now });
}
