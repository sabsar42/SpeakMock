import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { AiTestSession, CueCard, QuestionBankItem } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = supabaseServer();

  const { data: session, error } = await supabase
    .from("ai_test_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle<AiTestSession>();

  if (error) {
    return NextResponse.json({ error: "Could not load session." }, { status: 500 });
  }

  if (!session || session.is_deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: booking } = await supabase
    .from("ai_test_bookings")
    .select("student_name, status")
    .eq("id", session.booking_id)
    .maybeSingle();

  const { data: part1Questions } = await supabase
    .from("question_bank")
    .select("*")
    .in("id", session.selected_part1_questions)
    .returns<QuestionBankItem[]>();

  const { data: part3Questions } = await supabase
    .from("question_bank")
    .select("*")
    .in("id", session.selected_part3_questions)
    .returns<QuestionBankItem[]>();

  const { data: cueCard } = await supabase
    .from("cue_cards")
    .select("*")
    .eq("id", session.selected_cue_card_id)
    .maybeSingle<CueCard>();

  // Preserve the order the questions were selected in, since Supabase's
  // `.in()` does not guarantee result order matches the id array order.
  const orderById = <T extends { id: string }>(ids: string[], rows: T[] | null): T[] =>
    ids.map((id) => rows?.find((r) => r.id === id)).filter((r): r is T => !!r);

  return NextResponse.json({
    studentName: booking?.student_name ?? "",
    phase: session.phase,
    part1Questions: orderById(session.selected_part1_questions, part1Questions ?? []),
    part3Questions: orderById(session.selected_part3_questions, part3Questions ?? []),
    cueCard: cueCard ?? null,
  });
}
