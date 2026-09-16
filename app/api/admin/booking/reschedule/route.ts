import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/log-activity";
import { sendBookingConfirmedEmail } from "@/lib/resend/emails";
import { formatSlotDateTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string; new_slot_datetime?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { booking_id, new_slot_datetime } = body;
  if (!booking_id || !new_slot_datetime) {
    return NextResponse.json(
      { error: "booking_id and new_slot_datetime are required." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .maybeSingle<Booking>();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.booking_status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be rescheduled." },
      { status: 400 }
    );
  }

  const { data: newSlot, error: slotError } = await supabase
    .from("available_slots")
    .select("id, is_active")
    .eq("slot_datetime", new_slot_datetime)
    .maybeSingle();

  if (slotError || !newSlot || !newSlot.is_active) {
    return NextResponse.json(
      { error: "The selected slot is not available." },
      { status: 400 }
    );
  }

  const { data: conflict } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_datetime", new_slot_datetime)
    .in("booking_status", ["pending", "confirmed"])
    .maybeSingle();

  if (conflict) {
    return NextResponse.json(
      { error: "That slot is already booked." },
      { status: 400 }
    );
  }

  const oldSlotDatetime = booking.slot_datetime;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      slot_datetime: new_slot_datetime,
      rescheduled_from: oldSlotDatetime,
    })
    .eq("id", booking_id);

  if (updateError) {
    return NextResponse.json({ error: "Could not reschedule booking." }, { status: 500 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("token, meet_link")
    .eq("booking_id", booking_id)
    .maybeSingle();

  const updatedBooking: Booking = { ...booking, slot_datetime: new_slot_datetime };

  if (session?.meet_link) {
    try {
      await sendBookingConfirmedEmail(updatedBooking, session.meet_link, session.token);
    } catch (emailError) {
      console.error("Failed to send reschedule notification email:", emailError);
    }
  }

  await logActivity(
    supabase,
    booking_id,
    "rescheduled",
    `${formatSlotDateTime(oldSlotDatetime)} → ${formatSlotDateTime(new_slot_datetime)}`
  );

  return NextResponse.json({ success: true });
}
