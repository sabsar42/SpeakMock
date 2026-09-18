import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { renderToBuffer } from "@react-pdf/renderer";
import { supabaseServer } from "@/lib/supabase/server";
import { sendAiTestResultReadyEmail } from "@/lib/resend/emails";
import { scoringModelFallbackOrder } from "@/lib/ai-test/scoring-model";
import { SCORING_SYSTEM_PROMPT } from "@/lib/ai-test/scoring-prompt";
import { AiTestReportPdf } from "@/lib/ai-test/pdf/report";
import type { AiTestBooking, AiTestSession } from "@/lib/types";

// One LLM call can take 20-50s on free-tier models, and this route can try
// several in sequence plus generate a PDF afterward. With Fluid Compute
// (Vercel's default), Hobby allows up to 300s — use most of that budget so
// the fallback loop below has real room to try multiple models.
export const maxDuration = 280;

function createOpenRouterClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "SpeakMock",
    },
    // The SDK retries failed/timed-out requests twice by default, which
    // stacks with our own across-model fallback below: a single stuck model
    // could otherwise consume 3x its timeout before this loop even sees the
    // failure. We already retry via other models, so disable the SDK's own.
    maxRetries: 0,
  });
}

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

const CRITERION_KEYS = [
  "fluency_coherence",
  "lexical_resource",
  "grammatical_range",
  "pronunciation",
] as const;

/**
 * Free-tier models often wrap JSON in prose or code fences despite the prompt,
 * so pull out the outermost JSON object before parsing, then verify the shape
 * rather than trusting it — a malformed score would otherwise be written to the
 * database as nulls and surface as a broken result page.
 */
function parseScoringResponse(raw: string): ScoringResponse {
  const withoutFences = raw.replace(/```json|```/g, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response contained no JSON object.");
  }

  const parsed = JSON.parse(withoutFences.slice(start, end + 1)) as ScoringResponse;

  for (const key of CRITERION_KEYS) {
    const criterion = parsed[key];
    if (!criterion || typeof criterion.score !== "number") {
      throw new Error(`Model response is missing a valid "${key}" score.`);
    }
    if (!Array.isArray(criterion.examples)) criterion.examples = [];
    if (typeof criterion.justification !== "string") criterion.justification = "";
    if (typeof criterion.tip !== "string") criterion.tip = "";
  }

  if (typeof parsed.overall_band !== "number") {
    const average =
      CRITERION_KEYS.reduce((sum, key) => sum + parsed[key].score, 0) / CRITERION_KEYS.length;
    parsed.overall_band = Math.round(average * 2) / 2;
  }
  if (typeof parsed.overall_feedback !== "string") parsed.overall_feedback = "";

  return parsed;
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

  // Free-tier OpenRouter models are frequently and individually rate-limited
  // upstream — one model failing is routine, not a sign every model is down.
  // Try each configured model in turn and only give up once all have failed,
  // but budget the total time against Vercel's function limit (maxDuration
  // above): a single slow/hung model must not consume the whole request, and
  // once time is nearly spent, stop trying further fallbacks rather than
  // risk a hard timeout with no response at all.
  const REQUEST_BUDGET_MS = 250_000; // stay under the 280s function limit
  const PER_MODEL_TIMEOUT_MS = 30_000;
  const startedAt = Date.now();

  const openrouter = createOpenRouterClient();
  const modelsToTry = scoringModelFallbackOrder();
  let parsed: ScoringResponse | null = null;
  let modelUsed: string | null = null;
  let lastError: unknown = null;

  for (const candidateModel of modelsToTry) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > REQUEST_BUDGET_MS - 5000) {
      lastError = new Error("Time budget exhausted before all models were tried.");
      break;
    }

    try {
      const completion = await openrouter.chat.completions.create(
        {
          model: candidateModel,
          messages: [
            { role: "system", content: SCORING_SYSTEM_PROMPT },
            { role: "user", content: transcriptText },
          ],
          temperature: 0.3,
        },
        { timeout: PER_MODEL_TIMEOUT_MS }
      );

      const raw = completion.choices[0]?.message?.content ?? "";
      parsed = parseScoringResponse(raw);
      modelUsed = candidateModel;
      break;
    } catch (err) {
      console.error(`Scoring failed with model ${candidateModel}:`, err);
      lastError = err;
    }
  }

  if (!parsed || !modelUsed) {
    console.error("All scoring models failed:", lastError);
    return NextResponse.json(
      { error: "All scoring models are temporarily unavailable. Please try again shortly." },
      { status: 502 }
    );
  }

  // ai_test_results.session_id is UNIQUE; clearing any prior row lets a test be
  // re-scored (used by the admin demo, and after a transient model failure).
  await supabase.from("ai_test_results").delete().eq("session_id", session.id);

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
      model_used: modelUsed,
    })
    .select()
    .single();

  if (resultError || !result) {
    return NextResponse.json({ error: "Could not save scoring result." }, { status: 500 });
  }

  // The score is already saved at this point, so a PDF failure here must not
  // fail the whole request — the student should still get their result page.
  // (This previously crashed the route with an unhandled rejection, returning
  // a bare 500 with no body even though scoring itself had succeeded.)
  let resultFilePath: string | null = null;
  try {
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
    } else {
      resultFilePath = storagePath;
    }
  } catch (pdfError) {
    console.error("PDF generation failed:", pdfError);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  await supabase
    .from("ai_test_sessions")
    .update({
      result_file_path: resultFilePath,
      ended_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      phase: "completed",
    })
    .eq("id", session.id);

  await supabase.from("ai_test_bookings").update({ status: "completed" }).eq("id", booking.id);

  // Demo tests are created by the admin with a placeholder address, so there is
  // no real inbox to notify.
  if (booking.transaction_id !== "DEMO") {
    try {
      await sendAiTestResultReadyEmail(booking, body.token);
    } catch (emailError) {
      console.error("Failed to send AI test result-ready email:", emailError);
    }
  }

  return NextResponse.json({ success: true });
}
