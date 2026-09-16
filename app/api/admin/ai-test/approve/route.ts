import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { sendAiTestApprovedEmail } from "@/lib/resend/emails";
import type { AiTestBooking, CueCard, QuestionBankItem } from "@/lib/types";

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { booking_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.booking_id) {
    return NextResponse.json({ error: "booking_id is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: booking, error: bookingError } = await supabase
    .from("ai_test_bookings")
    .select("*")
    .eq("id", body.booking_id)
    .maybeSingle<AiTestBooking>();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending bookings can be approved." },
      { status: 400 }
    );
  }

  // Pick one random topic category with at least 6 active Part 1 questions.
  const { data: part1Questions, error: part1Error } = await supabase
    .from("question_bank")
    .select("*")
    .eq("part", 1)
    .eq("is_active", true)
    .returns<QuestionBankItem[]>();

  const { data: cueCards, error: cueCardsError } = await supabase
    .from("cue_cards")
    .select("*")
    .eq("is_active", true)
    .returns<CueCard[]>();

  if (part1Error || cueCardsError || !part1Questions?.length || !cueCards?.length) {
    return NextResponse.json(
      { error: "Question bank is not seeded. Cannot approve a test yet." },
      { status: 500 }
    );
  }

  const topicGroups = new Map<string, QuestionBankItem[]>();
  for (const q of part1Questions) {
    const group = topicGroups.get(q.topic_category) ?? [];
    group.push(q);
    topicGroups.set(q.topic_category, group);
  }
  const eligibleTopics = [...topicGroups.entries()].filter(([, qs]) => qs.length >= 6);

  if (eligibleTopics.length === 0) {
    return NextResponse.json(
      { error: "No Part 1 topic has enough active questions." },
      { status: 500 }
    );
  }

  const [, topicQuestions] = eligibleTopics[Math.floor(Math.random() * eligibleTopics.length)];
  const selectedPart1 = pickRandom(topicQuestions, 6).map((q) => q.id);

  const cueCard = cueCards[Math.floor(Math.random() * cueCards.length)];

  const { data: part3Questions, error: part3Error } = await supabase
    .from("question_bank")
    .select("*")
    .eq("part", 3)
    .eq("is_active", true)
    .eq("cue_card_id", cueCard.id)
    .returns<QuestionBankItem[]>();

  if (part3Error || !part3Questions?.length) {
    return NextResponse.json(
      { error: "Selected cue card has no linked Part 3 questions." },
      { status: 500 }
    );
  }

  const selectedPart3 = pickRandom(part3Questions, Math.min(4, part3Questions.length)).map(
    (q) => q.id
  );

  const token = nanoid(32);

  const { error: sessionError } = await supabase.from("ai_test_sessions").insert({
    booking_id: booking.id,
    token,
    selected_part1_questions: selectedPart1,
    selected_cue_card_id: cueCard.id,
    selected_part3_questions: selectedPart3,
  });

  if (sessionError) {
    return NextResponse.json(
      { error: "Could not create test session." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("ai_test_bookings")
    .update({ status: "approved", payment_status: "verified" })
    .eq("id", booking.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not update booking." }, { status: 500 });
  }

  try {
    await sendAiTestApprovedEmail(booking, token);
  } catch (emailError) {
    console.error("Failed to send AI test approval email:", emailError);
  }

  return NextResponse.json({ success: true, token });
}
