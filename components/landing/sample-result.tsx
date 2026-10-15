"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, Lightbulb, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn, stripWrappingQuotes } from "@/lib/utils";
import { SAMPLE_REPORT } from "@/lib/ai-test/sample-report";

const SAMPLE_PDF_URL = "/api/sample-report";

const CRITERIA = [
  { label: "Fluency & Coherence", short: "Fluency", data: SAMPLE_REPORT.fluencyCoherence },
  { label: "Lexical Resource", short: "Vocabulary", data: SAMPLE_REPORT.lexicalResource },
  { label: "Grammatical Range & Accuracy", short: "Grammar", data: SAMPLE_REPORT.grammaticalRange },
  { label: "Pronunciation", short: "Pronunciation", data: SAMPLE_REPORT.pronunciation },
];

/**
 * An explorable example of what a student actually receives — the same
 * fictional result the downloadable sample PDF is rendered from, so the
 * on-page preview and the PDF always agree.
 */
export function SampleResult() {
  const [active, setActive] = useState(0);
  const [pdfOpen, setPdfOpen] = useState(false);
  const criterion = CRITERIA[active];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Overall + criterion picker */}
        <div className="border-b border-border bg-background p-5 md:border-b-0 md:border-r">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Overall band</p>
          <p className="mt-1 text-5xl font-bold text-accent">{SAMPLE_REPORT.overallBand.toFixed(1)}</p>
          <p className="mt-1 text-xs text-text-muted">{SAMPLE_REPORT.studentName} · sample result</p>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-1">
            {CRITERIA.map((c, i) => (
              <button
                key={c.label}
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  i === active
                    ? "border-accent/40 bg-white font-semibold text-text-primary shadow-sm"
                    : "border-transparent text-text-secondary hover:bg-white"
                )}
              >
                <span>{c.short}</span>
                <span className={cn("tabular-nums", i === active ? "text-accent" : "text-text-muted")}>
                  {c.data.score.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected criterion detail */}
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold text-text-primary">{criterion.label}</h3>
            <span className="text-2xl font-bold tabular-nums text-accent">{criterion.data.score.toFixed(1)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-light">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(criterion.data.score / 9) * 100}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{criterion.data.justification}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">From your answers</p>
          <ul className="mt-2 space-y-2">
            {criterion.data.examples.map((example) => (
              <li key={example} className="flex gap-2 rounded-lg bg-background px-3 py-2 text-sm italic text-text-secondary">
                <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {stripWrappingQuotes(example)}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2.5 rounded-lg border border-accent/20 bg-accent-light/60 px-3.5 py-3 text-sm text-text-primary">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>
              <span className="font-semibold">Tip: </span>
              {criterion.data.tip}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <FileText className="h-4 w-4 text-accent" />
          Every test comes with a full PDF report, including your transcript.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="accent" onClick={() => setPdfOpen(true)}>
            <FileText className="h-3.5 w-3.5" />
            View sample PDF
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={SAMPLE_PDF_URL} download="speakmock-sample-report.pdf">
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-4xl px-4">
          <div className="flex items-center justify-between gap-3 border-b border-border py-3 pl-5 pr-14">
            <DialogTitle className="text-base">Sample result report</DialogTitle>
            <a
              href={SAMPLE_PDF_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {/* Phones often can't render a PDF inside an iframe — the "open in
              new tab" link above is the fallback there. */}
          <iframe src={SAMPLE_PDF_URL} title="Sample SpeakMock result report" className="h-[75vh] w-full bg-gray-100" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
