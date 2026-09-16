import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { sendBookingConfirmedEmail } from "@/lib/resend/emails";
import { logActivity } from "@/lib/log-activity";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string; meet_link?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { booking_id, meet_link } = body;

  if (!booking_id || !meet_link?.trim()) {
    return NextResponse.json(
      { error: "booking_id and meet_link are required." },
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

  if (booking.booking_status !== "pending") {
    return NextResponse.json(
      { error: "Only pending bookings can be confirmed." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "verified",
      booking_status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", booking_id);

  if (updateError) {
    return NextResponse.json({ error: "Could not confirm booking." }, { status: 500 });
  }

  const token = nanoid(32);

  const { error: sessionError } = await supabase.from("sessions").insert({
    booking_id,
    token,
    meet_link: meet_link.trim(),
  });

  if (sessionError) {
    return NextResponse.json(
      { error: "Booking updated, but session creation failed." },
      { status: 500 }
    );
  }

  try {
    await sendBookingConfirmedEmail(
      { ...booking, booking_status: "confirmed", payment_status: "verified" },
      meet_link.trim(),
      token
    );
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
  }

  await logActivity(supabase, booking_id, "confirmed", `Meet link: ${meet_link.trim()}`);

  return NextResponse.json({ success: true, token });
}
