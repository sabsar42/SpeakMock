import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ booking_id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { booking_id } = await params;
  const supabase = supabaseServer();

  const { data: entries, error } = await supabase
    .from("admin_activity_log")
    .select("*")
    .eq("booking_id", booking_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not load activity log." }, { status: 500 });
  }

  return NextResponse.json({ entries: entries ?? [] });
}
