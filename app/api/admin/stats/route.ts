import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

const SESSION_FEE_NUMBER = parseFloat(
  (process.env.NEXT_PUBLIC_SESSION_FEE ?? "0").replace(/[^0-9.]/g, "")
) || 0;

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = supabaseServer();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, booking_status, confirmed_at");

  if (error) {
    return NextResponse.json({ error: "Could not load stats." }, { status: 500 });
  }

  const rows = bookings ?? [];
  const now = new Date();
  const thisMonth = now.getUTCMonth();
  const thisYear = now.getUTCFullYear();

  const total = rows.length;
  const pending = rows.filter((b) => b.booking_status === "pending").length;
  const confirmed = rows.filter((b) => b.booking_status === "confirmed").length;
  const completed = rows.filter((b) => b.booking_status === "completed").length;

  const confirmedThisMonth = rows.filter((b) => {
    if (b.booking_status !== "confirmed" && b.booking_status !== "completed") return false;
    if (!b.confirmed_at) return false;
    const d = new Date(b.confirmed_at);
    return d.getUTCMonth() === thisMonth && d.getUTCFullYear() === thisYear;
  }).length;

  const revenueThisMonth = confirmedThisMonth * SESSION_FEE_NUMBER;

  const completedIds = rows.filter((b) => b.booking_status === "completed").map((b) => b.id);
  let awaitingResult = 0;

  if (completedIds.length > 0) {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("booking_id, result_file_path")
      .in("booking_id", completedIds);

    awaitingResult = (sessions ?? []).filter((s) => !s.result_file_path).length;
  }

  return NextResponse.json({
    total,
    pending,
    confirmed,
    completed,
    revenueThisMonth,
    awaitingResult,
  });
}
