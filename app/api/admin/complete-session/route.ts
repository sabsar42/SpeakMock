import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { booking_id } = body;
  if (!booking_id) {
    return NextResponse.json({ error: "booking_id is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, booking_status")
    .eq("id", booking_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "Could not load booking." }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.booking_status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be marked complete." },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVENTY_TWO_HOURS_MS);

  const { error: updateBookingError } = await supabase
    .from("bookings")
    .update({ booking_status: "completed" })
    .eq("id", booking_id);

  if (updateBookingError) {
    return NextResponse.json({ error: "Could not update booking." }, { status: 500 });
  }

  const { error: updateSessionError } = await supabase
    .from("sessions")
    .update({
      session_completed_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("booking_id", booking_id);

  if (updateSessionError) {
    return NextResponse.json({ error: "Could not update session." }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: expiresAt.toISOString() });
}
