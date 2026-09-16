import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import type { SlotTemplateConfig } from "@/lib/types";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = supabaseServer();
  const { data: templates, error } = await supabase
    .from("slot_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load templates." }, { status: 500 });
  }

  return NextResponse.json({ templates: templates ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { name?: string; config?: SlotTemplateConfig };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name?.trim() || !body.config) {
    return NextResponse.json({ error: "name and config are required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: template, error } = await supabase
    .from("slot_templates")
    .insert({ name: body.name.trim(), config: body.config })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save template." }, { status: 500 });
  }

  return NextResponse.json({ template });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from("slot_templates").delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete template." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
