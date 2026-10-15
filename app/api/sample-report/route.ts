import { generateAiTestReportPdf } from "@/lib/ai-test/pdf/report";
import { SAMPLE_REPORT } from "@/lib/ai-test/sample-report";

// Fixed input, so render once at build time and serve the static file —
// the landing page preview costs nothing per visit.
export const dynamic = "force-static";

export async function GET() {
  const pdf = await generateAiTestReportPdf(SAMPLE_REPORT);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="speakmock-sample-report.pdf"',
    },
  });
}
