import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = supabaseServer();

  const { data: bookings, error } = await supabase
    .from("ai_test_bookings")
    .select("*, ai_test_sessions(token, avatar_provider)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load AI test bookings." }, { status: 500 });
  }

  return NextResponse.json({ bookings: bookings ?? [] });
}
