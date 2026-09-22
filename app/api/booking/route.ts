import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";
import { sendBookingReceivedEmail, sendAdminBookingAlertEmail } from "@/lib/resend/emails";
import { logActivity } from "@/lib/log-activity";
import type { Booking } from "@/lib/types";

export async function GET() {
  const supabase = supabaseServer();

  const { data: slots, error: slotsError } = await supabase
    .from("available_slots")
    .select("slot_datetime")
    .eq("is_active", true)
    .gt("slot_datetime", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    .order("slot_datetime", { ascending: true });

  if (slotsError) {
    return NextResponse.json({ error: "Could not load available slots." }, { status: 500 });
  }

  const { data: takenBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("slot_datetime")
    .in("booking_status", ["pending", "confirmed"]);

  if (bookingsError) {
    return NextResponse.json({ error: "Could not load available slots." }, { status: 500 });
  }

  const takenSet = new Set((takenBookings ?? []).map((b) => b.slot_datetime));
  const availableSlots = (slots ?? [])
    .map((s) => s.slot_datetime)
    .filter((slotDatetime) => !takenSet.has(slotDatetime));

  return NextResponse.json({ slots: availableSlots });
}

export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    slot_datetime?: string;
    transaction_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, phone, slot_datetime, transaction_id } = body;

  if (!name?.trim() || !phone?.trim() || !slot_datetime || !transaction_id?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: slot, error: slotError } = await supabase
    .from("available_slots")
    .select("id, is_active")
    .eq("slot_datetime", slot_datetime)
    .maybeSingle();

  if (slotError) {
    return NextResponse.json({ error: "Could not verify slot availability." }, { status: 500 });
  }

  if (!slot || !slot.is_active) {
    return NextResponse.json(
      { error: "This slot is no longer available. Please choose another." },
      { status: 400 }
    );
  }

  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_datetime", slot_datetime)
    .in("booking_status", ["pending", "confirmed"])
    .maybeSingle();

  if (existingBookingError) {
    return NextResponse.json({ error: "Could not verify slot availability." }, { status: 500 });
  }

  if (existingBooking) {
    return NextResponse.json(
      { error: "This slot has just been taken. Please choose another." },
      { status: 400 }
    );
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      student_name: name.trim(),
      student_email: email.trim(),
      student_phone: phone.trim(),
      slot_datetime,
      transaction_id: transaction_id.trim(),
    })
    .select()
    .single<Booking>();

  if (insertError || !booking) {
    return NextResponse.json({ error: "Could not create booking. Please try again." }, { status: 500 });
  }

  try {
    await Promise.all([
      sendBookingReceivedEmail(booking),
      sendAdminBookingAlertEmail(booking),
    ]);
  } catch (emailError) {
    console.error("Failed to send booking emails:", emailError);
  }

  await logActivity(supabase, booking.id, "submitted");

  return NextResponse.json({ success: true });
}
