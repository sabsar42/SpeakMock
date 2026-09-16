import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/log-activity";
import { sendBookingConfirmedEmailOnly } from "@/lib/resend/emails";
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

  if (booking.booking_status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed bookings have a confirmation email to resend." },
      { status: 400 }
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("token, meet_link")
    .eq("booking_id", body.booking_id)
    .maybeSingle();

  if (sessionError || !session?.meet_link) {
    return NextResponse.json({ error: "No session found for this booking." }, { status: 404 });
  }

  await sendBookingConfirmedEmailOnly(booking, session.meet_link, session.token);
  await logActivity(supabase, booking.id, "confirmation_resent");

  return NextResponse.json({ success: true });
}
