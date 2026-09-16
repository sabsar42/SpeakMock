"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Lightbulb, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCountdown } from "@/lib/utils";
import type { AiCriterionScore, AiTestResult, TranscriptTurn } from "@/lib/types";

interface ResultData {
  studentName: string;
  testDate: string | null;
  expiresAt: string | null;
  transcript: TranscriptTurn[];
  result: AiTestResult;
  pdfUrl: string | null;
}

function ringColorClass(band: number): string {
  if (band < 5) return "border-error";
  if (band < 7) return "border-warning";
  return "border-success";
}

const CRITERIA: {
  key: "fluency_coherence" | "lexical_resource" | "grammatical_range" | "pronunciation";
  label: string;
}[] = [
  { key: "fluency_coherence", label: "Fluency & Coherence" },
  { key: "lexical_resource", label: "Lexical Resource" },
  { key: "grammatical_range", label: "Grammatical Range & Accuracy" },
  { key: "pronunciation", label: "Pronunciation" },
];

function criterionFromResult(result: AiTestResult, key: (typeof CRITERIA)[number]["key"]): AiCriterionScore {
  return {
    score: result[`${key}_score`],
    justification: result[`${key}_justification`],
    examples: result[`${key}_examples`],
    tip: result[`${key}_tip`],
  };
}

export default function AiTestResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [data, setData] = useState<ResultData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not_ready" | "expired" | "error">(
    "loading"
  );
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ai-test/result/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          if (json.error === "expired") setStatus("expired");
          else if (json.error === "not_ready") setStatus("not_ready");
          else setStatus("error");
          return;
        }
        setData(json);
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!data?.expiresAt) return;
    const update = () => setMsRemaining(new Date(data.expiresAt!).getTime() - Date.now());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [data?.expiresAt]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-14 sm:px-6">
        {status === "loading" && (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your result...
          </p>
        )}

        {status === "not_ready" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            Your result isn&apos;t ready yet. Please check back shortly.
          </p>
        )}

        {status === "expired" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            This result has expired and has been removed.
          </p>
        )}

        {status === "error" && (
          <p className="mx-auto max-w-md py-16 text-center text-text-secondary">
            Something went wrong loading your result. Please try again shortly.
          </p>
        )}

        {status === "ok" && data && (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-center text-2xl font-bold text-text-primary">
              {data.studentName}&apos;s IELTS Mock Speaking Result
            </h1>
            {data.testDate && (
              <p className="mt-1 text-center text-sm text-text-muted">
                {new Date(data.testDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center">
              <div
                className={cn(
                  "flex h-36 w-36 items-center justify-center rounded-full border-[6px]",
                  ringColorClass(data.result.overall_band)
                )}
              >
                <span className="text-5xl font-bold text-text-primary">
                  {data.result.overall_band}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                Estimated Band Score
              </p>
              <p className="mt-1 max-w-md text-center text-xs text-text-muted">
                This is an AI-generated estimate for practice purposes and is not an official
                IELTS score.
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-center text-sm text-text-secondary">
              {data.result.overall_feedback}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {CRITERIA.map(({ key, label }) => {
                const criterion = criterionFromResult(data.result, key);
                return (
                  <div key={key} className="rounded-xl border border-border bg-white p-5">
                    <p className="text-3xl font-bold text-primary">{criterion.score}</p>
                    <h3 className="mt-1 text-sm font-semibold text-text-primary">{label}</h3>
                    <p className="mt-2 text-sm text-text-secondary">{criterion.justification}</p>
                    {criterion.examples.map((example, i) => (
                      <blockquote
                        key={i}
                        className="mt-2 border-l-2 border-border pl-3 text-xs italic text-text-muted"
                      >
                        &ldquo;{example}&rdquo;
                      </blockquote>
                    ))}
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent-light px-3 py-2 text-xs text-accent">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {criterion.tip}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-text-muted">
              Pronunciation is estimated from speech transcription clarity, not direct audio
              analysis.
            </p>

            {data.pdfUrl && (
              <div className="mt-6 flex justify-center">
                <Button asChild size="lg">
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download PDF Report
                  </a>
                </Button>
              </div>
            )}

            <div className="mt-10">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">Full Transcript</h2>
              <Tabs defaultValue="1">
                <TabsList>
                  <TabsTrigger value="1">Part 1</TabsTrigger>
                  <TabsTrigger value="2">Part 2</TabsTrigger>
                  <TabsTrigger value="3">Part 3</TabsTrigger>
                </TabsList>
                {([1, 2, 3] as const).map((part) => (
                  <TabsContent key={part} value={String(part)}>
                    <div className="space-y-3 rounded-xl border border-border bg-white p-5">
                      {data.transcript
                        .filter((t) => t.part === part)
                        .map((turn, i) => (
                          <p key={i} className="text-sm">
                            <span className="font-semibold text-text-primary">
                              {turn.speaker === "examiner" ? "Examiner" : data.studentName}:{" "}
                            </span>
                            <span className="text-text-secondary">{turn.text}</span>
                          </p>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {msRemaining !== null && (
              <p className="mt-6 text-center text-xs text-text-muted">
                This result page expires in {formatCountdown(msRemaining)}
              </p>
            )}

            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary-light p-6 text-center">
              <h3 className="text-lg font-semibold text-text-primary">
                Want a real examiner&apos;s assessment?
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Book a live human session for a full IELTS speaking test experience.
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link href="/book">Book a Human Session</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
