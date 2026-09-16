import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { sendBookingRejectedEmail } from "@/lib/resend/emails";
import { logActivity } from "@/lib/log-activity";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string; rejection_reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { booking_id, rejection_reason } = body;

  if (!booking_id || !rejection_reason?.trim()) {
    return NextResponse.json(
      { error: "booking_id and rejection_reason are required." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .maybeSingle<Booking>();

  if (fetchError) {
    return NextResponse.json({ error: "Could not load booking." }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      booking_status: "rejected",
      payment_status: "rejected",
      rejection_reason: rejection_reason.trim(),
    })
    .eq("id", booking_id);

  if (updateError) {
    return NextResponse.json({ error: "Could not reject booking." }, { status: 500 });
  }

  try {
    await sendBookingRejectedEmail(booking, rejection_reason.trim());
  } catch (emailError) {
    console.error("Failed to send rejection email:", emailError);
  }

  await logActivity(supabase, booking_id, "rejected", rejection_reason.trim());

  return NextResponse.json({ success: true });
}
