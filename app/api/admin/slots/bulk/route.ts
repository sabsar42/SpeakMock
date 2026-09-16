import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { localDateTimeToIso } from "@/lib/utils";

interface BulkSlotsInput {
  dates?: string[]; // "YYYY-MM-DD"
  times?: string[]; // "HH:MM"
  exclude_dates?: string[]; // "YYYY-MM-DD"
  timezone?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: BulkSlotsInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const dates = body.dates ?? [];
  const times = body.times ?? [];
  const excludeSet = new Set(body.exclude_dates ?? []);
  const timezone = body.timezone || "Asia/Dhaka";

  if (dates.length === 0 || times.length === 0) {
    return NextResponse.json(
      { error: "At least one date and one time are required." },
      { status: 400 }
    );
  }

  const candidateDates = dates.filter((d) => !excludeSet.has(d));

  const rows = candidateDates.flatMap((date) =>
    times.map((time) => ({
      slot_datetime: localDateTimeToIso(date, time, timezone),
    }))
  );

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("available_slots")
    .upsert(rows, { onConflict: "slot_datetime", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not create slots." }, { status: 500 });
  }

  const created = data?.length ?? 0;
  const skipped = rows.length - created;

  return NextResponse.json({ created, skipped });
}
