import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { AiTestBooking, AiTestResult, AiTestSession } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = supabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("ai_test_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle<AiTestSession>();

  if (sessionError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!session || session.is_deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 404 });
  }

  const { data: booking } = await supabase
    .from("ai_test_bookings")
    .select("*")
    .eq("id", session.booking_id)
    .maybeSingle<AiTestBooking>();

  const { data: result } = await supabase
    .from("ai_test_results")
    .select("*")
    .eq("session_id", session.id)
    .maybeSingle<AiTestResult>();

  if (!booking || !result) {
    return NextResponse.json({ error: "not_ready" }, { status: 404 });
  }

  let pdfUrl: string | null = null;
  if (session.result_file_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("ai-results")
      .createSignedUrl(session.result_file_path, 60 * 60);
    pdfUrl = signedUrlData?.signedUrl ?? null;
  }

  return NextResponse.json({
    studentName: booking.student_name,
    testDate: session.ended_at,
    expiresAt: session.expires_at,
    transcript: session.transcript,
    result,
    pdfUrl,
  });
}
