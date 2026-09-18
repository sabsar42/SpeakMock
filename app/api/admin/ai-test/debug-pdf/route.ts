import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { generateAiTestReportPdf } from "@/lib/ai-test/pdf/report";

/**
 * Temporary diagnostic route to isolate PDF generation failures in
 * production without needing direct access to Vercel's function logs.
 * Safe to remove once pdf-lib is confirmed working on Vercel.
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const pdfBuffer = await generateAiTestReportPdf({
      studentName: "Debug Test",
      testDate: "Test Date",
      fluencyCoherence: { score: 7, justification: "Test", examples: ["Example one"], tip: "Tip" },
      lexicalResource: { score: 7, justification: "Test", examples: ["Example two"], tip: "Tip" },
      grammaticalRange: { score: 7, justification: "Test", examples: ["Example three"], tip: "Tip" },
      pronunciation: { score: 7, justification: "Test", examples: ["Example four"], tip: "Tip" },
      overallBand: 7,
      overallFeedback: "Test feedback.",
      transcript: [
        { speaker: "examiner", text: "Test question?", part: 1, question_id: null, at: new Date().toISOString() },
        { speaker: "student", text: "Test answer.", part: 1, question_id: null, at: new Date().toISOString() },
      ],
    });

    return NextResponse.json({
      success: true,
      bufferLength: pdfBuffer.length,
      bufferType: pdfBuffer.constructor.name,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      },
      { status: 500 }
    );
  }
}
