import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  Chrome,
  MessageSquare,
  Mic,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const AI_TEST_FEE = process.env.NEXT_PUBLIC_AI_TEST_FEE ?? "৳120";
const SESSION_FEE = process.env.NEXT_PUBLIC_SESSION_FEE ?? "৳500";
const PAYMENT_METHOD_NAME = process.env.NEXT_PUBLIC_PAYMENT_METHOD_NAME ?? "bKash";
const AVATAR_NAME = process.env.NEXT_PUBLIC_AVATAR_NAME ?? "Rami";

const parts = [
  { label: "Part 1", title: "Introduction & Interview", duration: "4–5 min" },
  { label: "Part 2", title: "Individual Long Turn", duration: "3–4 min" },
  { label: "Part 3", title: "Two-Way Discussion", duration: "4–5 min" },
];

const included = [
  "Instant band score across all 4 IELTS criteria",
  "Detailed feedback with quoted examples from your answers",
  "Actionable improvement tips for each criterion",
  "Downloadable PDF report",
];

export default function AiTestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 pb-12 pt-16 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Bot className="h-3.5 w-3.5" />
            AI Mock Test
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold text-text-primary sm:text-5xl">
            Practice IELTS Speaking with an AI Examiner
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Meet {AVATAR_NAME}, your AI examiner. Complete a full IELTS
            speaking test in about 15 minutes and get your band score
            instantly — no waiting, no scheduling.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="accent">
              <Link href="/ai-test/pay">Start Now</Link>
            </Button>
          </div>
        </section>

        <section className="px-4 pb-12 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {parts.map((part) => (
              <Card key={part.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {part.label}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-text-primary">
                  {part.title}
                </h3>
                <p className="mt-1 text-sm text-text-muted">{part.duration}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-4 pb-12 sm:px-6">
          <Card className="mx-auto max-w-2xl">
            <h2 className="text-lg font-semibold text-text-primary">
              What you get
            </h2>
            <ul className="mt-4 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="px-4 pb-12 sm:px-6">
          <Card className="mx-auto max-w-2xl border-accent/30 bg-accent-light/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  AI Mock Test Fee
                </p>
                <p className="mt-1 text-3xl font-bold text-accent">{AI_TEST_FEE}</p>
              </div>
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Pay via {PAYMENT_METHOD_NAME}. Your test link arrives by Gmail
              once payment is verified.
            </p>
          </Card>
        </section>

        <section className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-text-primary"> </th>
                  <th className="px-4 py-3 font-semibold text-text-primary">
                    AI Mock Test
                  </th>
                  <th className="px-4 py-3 font-semibold text-text-primary">
                    Human Session
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-text-primary">Examiner</td>
                  <td className="px-4 py-3">AI Avatar ({AVATAR_NAME})</td>
                  <td className="px-4 py-3">Real human examiner</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-text-primary">Scheduling</td>
                  <td className="px-4 py-3">Instant, no slot needed</td>
                  <td className="px-4 py-3">Requires slot booking</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-text-primary">Duration</td>
                  <td className="px-4 py-3">~15 minutes</td>
                  <td className="px-4 py-3">20 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-text-primary">Results</td>
                  <td className="px-4 py-3">Instant, auto-generated</td>
                  <td className="px-4 py-3">Manual, uploaded later</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-text-primary">Price</td>
                  <td className="px-4 py-3 font-semibold text-accent">{AI_TEST_FEE}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{SESSION_FEE}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/ai-test/pay">
                <Mic className="h-4 w-4" />
                Start AI Mock Test
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book">
                <MessageSquare className="h-4 w-4" />
                Book a Human Session
              </Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
            <Chrome className="h-3.5 w-3.5" />
            Chrome or Edge recommended for the best experience
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
