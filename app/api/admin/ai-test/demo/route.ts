import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import type { CueCard, QuestionBankItem, TranscriptTurn } from "@/lib/types";

/**
 * Sample answers at roughly band 6-7, used to demo the scoring pipeline
 * without anyone having to sit a real 15-minute test.
 */
const SAMPLE_ANSWERS: Record<string, string> = {
  part1_1:
    "I live in a fairly small apartment in the centre of the city, on the fourth floor. It only has two bedrooms, but it suits me well because everything I need is within walking distance.",
  part1_2:
    "I have been living there for about three years now. I moved in just after I started my current job, mainly because the commute from my old place was taking almost an hour each way.",
  part1_3:
    "What I like most is probably the natural light. There are big windows facing east, so in the morning the whole living room fills up with sunlight, which makes it a really pleasant place to have breakfast or read.",
  part1_4:
    "Yes, I think so, eventually. At the moment the apartment is fine for one person, but if my circumstances change I would like somewhere with a bit more space, ideally with a small garden or a balcony.",
  part1_5:
    "It is a decent neighbourhood, yes. It is quite lively, with plenty of cafes and a market at the weekend, although the downside is that it can get noisy late at night, especially on Fridays.",
  part1_6:
    "When I am older I imagine I would prefer something quieter, maybe in a smaller town near the coast. Somewhere with less traffic and a slower pace of life, but still close enough to a city for hospitals and so on.",
  part2:
    "The skill I would most like to learn is playing the piano. I have wanted to learn it since I was a child, but I never really had the opportunity because we did not have an instrument at home. I would probably learn it by taking weekly lessons with a proper teacher, because I think having someone correct your technique early on makes a big difference, and then practising for maybe half an hour every evening on my own. Realistically I think it would take a few years to get to a level where I could play something people would actually enjoy listening to, although you can learn simple pieces within a few months. The main reason I want to learn it is that I find playing music genuinely relaxing. When I listen to piano pieces I always think it must be wonderful to be able to create that sound yourself, rather than just listening to a recording. I also think it would be a good counterbalance to my work, which is very screen-based and analytical.",
  part3_1:
    "I think the most important skills will be the ones machines are not very good at, so things like creative problem solving, communication and being able to work with people from different backgrounds. Technical skills matter too, obviously, but they change so quickly that the ability to keep learning is probably more valuable than any particular tool you happen to know today.",
  part3_2:
    "It depends a lot on the skill, I would say. For something like medicine or engineering, formal education is essential because you need the underlying theory and there are safety implications. But for many practical skills, such as programming or design, people can and do learn extremely effectively on their own, especially now that there are so many resources online. Ideally you would combine both.",
  part3_3:
    "Not really, no. I think schools tend to focus quite heavily on academic subjects, which is understandable, but many students leave without knowing basic things like how to manage money, how to write a job application, or how to cook properly. Some schools have started introducing these things, which I think is a positive development, but it is far from universal.",
};

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { mode?: "prefilled" | "empty" };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const mode = body.mode ?? "prefilled";

  const supabase = supabaseServer();

  const { data: part1Pool } = await supabase
    .from("question_bank")
    .select("*")
    .eq("part", 1)
    .eq("is_active", true)
    .eq("topic_category", "Home")
    .limit(6)
    .returns<QuestionBankItem[]>();

  const { data: cueCard } = await supabase
    .from("cue_cards")
    .select("*")
    .eq("is_active", true)
    .eq("topic", "Describe a skill you would like to learn")
    .maybeSingle<CueCard>();

  if (!part1Pool?.length || !cueCard) {
    return NextResponse.json(
      { error: "Question bank is not seeded. Run seed-ai-test-questions.sql first." },
      { status: 500 }
    );
  }

  const { data: part3Pool } = await supabase
    .from("question_bank")
    .select("*")
    .eq("part", 3)
    .eq("is_active", true)
    .eq("cue_card_id", cueCard.id)
    .limit(3)
    .returns<QuestionBankItem[]>();

  if (!part3Pool?.length) {
    return NextResponse.json(
      { error: "The demo cue card has no linked Part 3 questions." },
      { status: 500 }
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("ai_test_bookings")
    .insert({
      student_name: "Demo Candidate",
      student_email: "demo@speakmock.local",
      transaction_id: "DEMO",
      payment_status: "verified",
      status: mode === "prefilled" ? "in_progress" : "approved",
      admin_notes: "Demo test created from the admin panel. Safe to delete.",
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Could not create demo booking." }, { status: 500 });
  }

  const token = nanoid(32);
  const transcript: TranscriptTurn[] = [];

  if (mode === "prefilled") {
    const now = Date.now();
    let step = 0;
    const push = (
      speaker: "examiner" | "student",
      text: string,
      part: 1 | 2 | 3,
      questionId: string | null
    ) => {
      transcript.push({
        speaker,
        text,
        part,
        question_id: questionId,
        at: new Date(now + step++ * 20_000).toISOString(),
      });
    };

    part1Pool.forEach((q, i) => {
      push("examiner", q.question_text, 1, q.id);
      push("student", SAMPLE_ANSWERS[`part1_${i + 1}`] ?? SAMPLE_ANSWERS.part1_1, 1, q.id);
    });

    push(
      "examiner",
      `${cueCard.topic}. ${cueCard.bullet_points.join(", ")}.`,
      2,
      cueCard.id
    );
    push("student", SAMPLE_ANSWERS.part2, 2, cueCard.id);

    part3Pool.forEach((q, i) => {
      push("examiner", q.question_text, 3, q.id);
      push("student", SAMPLE_ANSWERS[`part3_${i + 1}`] ?? SAMPLE_ANSWERS.part3_1, 3, q.id);
    });
  }

  const { error: sessionError } = await supabase.from("ai_test_sessions").insert({
    booking_id: booking.id,
    token,
    selected_part1_questions: part1Pool.map((q) => q.id),
    selected_cue_card_id: cueCard.id,
    selected_part3_questions: part3Pool.map((q) => q.id),
    transcript,
    phase: mode === "prefilled" ? "part3" : "not_started",
    started_at: mode === "prefilled" ? new Date().toISOString() : null,
  });

  if (sessionError) {
    await supabase.from("ai_test_bookings").delete().eq("id", booking.id);
    return NextResponse.json({ error: "Could not create demo session." }, { status: 500 });
  }

  return NextResponse.json({ success: true, token, booking_id: booking.id, mode });
}

/** Removes every demo booking (and its cascaded session/result rows). */
export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = supabaseServer();

  const { data: demos } = await supabase
    .from("ai_test_bookings")
    .select("id, ai_test_sessions(id, result_file_path)")
    .eq("transaction_id", "DEMO")
    .returns<
      { id: string; ai_test_sessions: { id: string; result_file_path: string | null }[] | null }[]
    >();

  const filePaths = (demos ?? [])
    .flatMap((d) => d.ai_test_sessions ?? [])
    .map((s) => s.result_file_path)
    .filter((p): p is string => !!p);

  if (filePaths.length > 0) {
    await supabase.storage.from("ai-results").remove(filePaths);
  }

  const { error } = await supabase
    .from("ai_test_bookings")
    .delete()
    .eq("transaction_id", "DEMO");

  if (error) {
    return NextResponse.json({ error: "Could not remove demo tests." }, { status: 500 });
  }

  return NextResponse.json({ success: true, removed: demos?.length ?? 0 });
}
