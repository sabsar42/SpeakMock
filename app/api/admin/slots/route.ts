import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = supabaseServer();

  const { data: slots, error } = await supabase
    .from("available_slots")
    .select("*")
    .order("slot_datetime", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not load slots." }, { status: 500 });
  }

  return NextResponse.json({ slots: slots ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { slot_datetime?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.slot_datetime) {
    return NextResponse.json({ error: "slot_datetime is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: slot, error } = await supabase
    .from("available_slots")
    .insert({ slot_datetime: body.slot_datetime })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not create slot. It may already exist." }, { status: 500 });
  }

  return NextResponse.json({ slot });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { slot_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.slot_id) {
    return NextResponse.json({ error: "slot_id is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { error } = await supabase
    .from("available_slots")
    .update({ is_active: false })
    .eq("id", body.slot_id);

  if (error) {
    return NextResponse.json({ error: "Could not deactivate slot." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
