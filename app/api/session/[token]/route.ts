import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Booking, PublicSessionData, Session } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("sessions")
    .select("*, bookings(*)")
    .eq("token", token)
    .maybeSingle<Session & { bookings: Booking }>();

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!data || !data.bookings) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (data.is_deleted) {
    return NextResponse.json({ error: "expired" }, { status: 404 });
  }

  const { bookings: booking, ...session } = data;

  let resultFileUrl: string | null = null;
  if (session.result_file_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("results")
      .createSignedUrl(session.result_file_path, 60 * 60);
    resultFileUrl = signedUrlData?.signedUrl ?? null;
  }

  const publicData: PublicSessionData = {
    token: session.token,
    student_name: booking.student_name,
    student_email: booking.student_email,
    slot_datetime: booking.slot_datetime,
    booking_status: booking.booking_status,
    meet_link: session.meet_link,
    result_file_url: resultFileUrl,
    result_uploaded_at: session.result_uploaded_at,
    session_completed_at: session.session_completed_at,
    expires_at: session.expires_at,
    is_deleted: session.is_deleted,
  };

  return NextResponse.json(publicData);
}
