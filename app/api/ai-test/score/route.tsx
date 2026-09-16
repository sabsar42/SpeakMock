import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { renderToBuffer } from "@react-pdf/renderer";
import { supabaseServer } from "@/lib/supabase/server";
import { sendAiTestResultReadyEmail } from "@/lib/resend/emails";
import { pickScoringModel } from "@/lib/ai-test/scoring-model";
import { SCORING_SYSTEM_PROMPT } from "@/lib/ai-test/scoring-prompt";
import { AiTestReportPdf } from "@/lib/ai-test/pdf/report";
import type { AiTestBooking, AiTestSession } from "@/lib/types";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "SpeakMock",
  },
});

interface ScoredCriterion {
  score: number;
  justification: string;
  examples: string[];
  tip: string;
}

interface ScoringResponse {
  fluency_coherence: ScoredCriterion;
  lexical_resource: ScoredCriterion;
  grammatical_range: ScoredCriterion;
  pronunciation: ScoredCriterion;
  overall_band: number;
  overall_feedback: string;
}

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("ai_test_sessions")
    .select("*")
    .eq("token", body.token)
    .maybeSingle<AiTestSession>();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("ai_test_bookings")
    .select("*")
    .eq("id", session.booking_id)
    .maybeSingle<AiTestBooking>();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const transcriptText = session.transcript
    .map((t) => `[Part ${t.part}] ${t.speaker === "examiner" ? "Examiner" : "Student"}: ${t.text}`)
    .join("\n");

  if (!transcriptText.trim()) {
    return NextResponse.json({ error: "No transcript to score." }, { status: 400 });
  }

  const model = pickScoringModel();
  let parsed: ScoringResponse;

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SCORING_SYSTEM_PROMPT },
        { role: "user", content: transcriptText },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    console.error("Scoring failed:", err);
    return NextResponse.json({ error: "Could not score the test." }, { status: 502 });
  }

  const { data: result, error: resultError } = await supabase
    .from("ai_test_results")
    .insert({
      session_id: session.id,
      fluency_coherence_score: parsed.fluency_coherence.score,
      fluency_coherence_justification: parsed.fluency_coherence.justification,
      fluency_coherence_examples: parsed.fluency_coherence.examples,
      fluency_coherence_tip: parsed.fluency_coherence.tip,
      lexical_resource_score: parsed.lexical_resource.score,
      lexical_resource_justification: parsed.lexical_resource.justification,
      lexical_resource_examples: parsed.lexical_resource.examples,
      lexical_resource_tip: parsed.lexical_resource.tip,
      grammatical_range_score: parsed.grammatical_range.score,
      grammatical_range_justification: parsed.grammatical_range.justification,
      grammatical_range_examples: parsed.grammatical_range.examples,
      grammatical_range_tip: parsed.grammatical_range.tip,
      pronunciation_score: parsed.pronunciation.score,
      pronunciation_justification: parsed.pronunciation.justification,
      pronunciation_examples: parsed.pronunciation.examples,
      pronunciation_tip: parsed.pronunciation.tip,
      overall_band: parsed.overall_band,
      overall_feedback: parsed.overall_feedback,
      raw_llm_response: parsed,
      model_used: model,
    })
    .select()
    .single();

  if (resultError || !result) {
    return NextResponse.json({ error: "Could not save scoring result." }, { status: 500 });
  }

  const pdfBuffer = await renderToBuffer(
    <AiTestReportPdf
      studentName={booking.student_name}
      testDate={new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
      fluencyCoherence={parsed.fluency_coherence}
      lexicalResource={parsed.lexical_resource}
      grammaticalRange={parsed.grammatical_range}
      pronunciation={parsed.pronunciation}
      overallBand={parsed.overall_band}
      overallFeedback={parsed.overall_feedback}
      transcript={session.transcript}
    />
  );

  const storagePath = `${session.id}/report.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("ai-results")
    .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("PDF upload failed:", uploadError);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  await supabase
    .from("ai_test_sessions")
    .update({
      result_file_path: uploadError ? null : storagePath,
      ended_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      phase: "completed",
    })
    .eq("id", session.id);

  await supabase.from("ai_test_bookings").update({ status: "completed" }).eq("id", booking.id);

  try {
    await sendAiTestResultReadyEmail(booking, body.token);
  } catch (emailError) {
    console.error("Failed to send AI test result-ready email:", emailError);
  }

  return NextResponse.json({ success: true });
}
