import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import type { CalendarSlot } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: slots, error: slotsError } = await supabase
    .from("available_slots")
    .select("id, slot_datetime, is_active")
    .gte("slot_datetime", start)
    .lte("slot_datetime", end)
    .order("slot_datetime", { ascending: true });

  if (slotsError) {
    return NextResponse.json({ error: "Could not load slots." }, { status: 500 });
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, slot_datetime, booking_status, student_name")
    .gte("slot_datetime", start)
    .lte("slot_datetime", end)
    .in("booking_status", ["pending", "confirmed", "completed"]);

  if (bookingsError) {
    return NextResponse.json({ error: "Could not load bookings." }, { status: 500 });
  }

  const bookingByDatetime = new Map(
    (bookings ?? []).map((b) => [b.slot_datetime, b])
  );

  const result: CalendarSlot[] = (slots ?? []).map((slot) => {
    const booking = bookingByDatetime.get(slot.slot_datetime);
    return {
      id: slot.id,
      slot_datetime: slot.slot_datetime,
      is_active: slot.is_active,
      booking_id: booking?.id ?? null,
      booking_status: booking?.booking_status ?? null,
      student_name: booking?.student_name ?? null,
    };
  });

  return NextResponse.json({ slots: result });
}
