import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/log-activity";
import { sendResultReadyEmail } from "@/lib/resend/emails";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.booking_id) {
    return NextResponse.json({ error: "booking_id is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", body.booking_id)
    .maybeSingle<Booking>();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("token, result_file_path")
    .eq("booking_id", body.booking_id)
    .maybeSingle();

  if (sessionError || !session?.result_file_path) {
    return NextResponse.json(
      { error: "No result has been uploaded for this booking yet." },
      { status: 400 }
    );
  }

  await sendResultReadyEmail(booking, session.token);
  await logActivity(supabase, booking.id, "result_email_resent");

  return NextResponse.json({ success: true });
}
