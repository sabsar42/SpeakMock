import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/log-activity";

// Rejected bookings never block their slot from being re-booked — POST /api/booking
// only blocks slots with a pending/confirmed booking. This route exists purely to
// record admin intent in the activity log so there's a clear audit trail.
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

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_status")
    .eq("id", body.booking_id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.booking_status !== "rejected") {
    return NextResponse.json(
      { error: "Only rejected bookings can be marked as rebook-allowed." },
      { status: 400 }
    );
  }

  await logActivity(supabase, body.booking_id, "rebook_allowed");

  return NextResponse.json({ success: true });
}
