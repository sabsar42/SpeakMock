import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = supabaseServer();

  const { data: booking, error } = await supabase
    .from("ai_test_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load booking." }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { data: session } = await supabase
    .from("ai_test_sessions")
    .select("*")
    .eq("booking_id", id)
    .maybeSingle();

  let result = null;
  if (session) {
    const { data: resultData } = await supabase
      .from("ai_test_results")
      .select("*")
      .eq("session_id", session.id)
      .maybeSingle();
    result = resultData ?? null;
  }

  return NextResponse.json({ booking, session: session ?? null, result });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { admin_notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { error } = await supabase
    .from("ai_test_bookings")
    .update({ admin_notes: body.admin_notes ?? null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not save notes." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
