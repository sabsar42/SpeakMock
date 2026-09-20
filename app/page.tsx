"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Download,
  Mic,
  Sparkles,
  Video,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking-dialog";
import { ResendLinkDialog } from "@/components/resend-link-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PAYMENT_METHOD_NAME =
  process.env.NEXT_PUBLIC_PAYMENT_METHOD_NAME ?? "bKash";
const AI_TEST_FEE = process.env.NEXT_PUBLIC_AI_TEST_FEE ?? "৳120";
const SESSION_FEE = process.env.NEXT_PUBLIC_SESSION_FEE ?? "৳500";

const steps = [
  {
    number: "01",
    title: "Book your slot",
    description:
      "Pick an available time and share your payment transaction ID.",
    icon: Calendar,
  },
  {
    number: "02",
    title: "Pay and confirm",
    description:
      "We verify your payment and confirm your slot within a few hours.",
    icon: CheckCircle,
  },
  {
    number: "03",
    title: "Speak with an examiner",
    description:
      "Join your session on Google Meet for a real IELTS speaking test.",
    icon: Mic,
  },
];

const faqs = [
  {
    question: "How long is the mock speaking test?",
    answer:
      "Each session runs 20 to 30 minutes and follows the real IELTS speaking format — Parts 1, 2, and 3.",
  },
  {
    question: "How do I pay for a session?",
    answer: `Payments are accepted via ${PAYMENT_METHOD_NAME}. After sending payment, enter your transaction ID on the booking form so we can verify it.`,
  },
  {
    question: "How soon will my booking be confirmed?",
    answer:
      "We manually verify each payment and usually confirm bookings within a few hours. You'll get an email once it's confirmed with your Google Meet link.",
  },
  {
    question: "What if I miss my session?",
    answer:
      "Please cancel or reschedule at least 24 hours in advance. No-shows are not eligible for a refund or automatic rescheduling.",
  },
  {
    question: "How do I get my result?",
    answer:
      "After your session, your examiner's feedback and band score report will appear on your session page. You'll have 72 hours to download it before the page expires.",
  },
];

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      <ResendLinkDialog open={resendOpen} onOpenChange={setResendOpen} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero/autumn-hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-[70%] bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
          {/* Fades the image into the page background at the bottom instead of
              cutting off in a hard horizontal line. */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/70 to-background" />
        </div>

        <Navbar transparent onBookClick={() => setBookingOpen(true)} />

        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-16 text-center sm:px-6 sm:pb-32 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-4 py-1.5 shadow-[0_0_22px_rgba(239,68,68,0.55)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Live
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-white/90">
              IELTS Speaking Mock Test
            </span>
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.4)] sm:text-6xl">
            IELTS Speaking Practice,{" "}
            <span className="text-dune-300">Simplified</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
            Practise with an AI examiner and get your band score in minutes, or
            book a live session with a real examiner.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.35)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                <Sparkles className="h-3 w-3" />
                Instant
              </span>
              <h2 className="mt-3 text-xl font-bold text-text-primary">AI Mock Test</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-text-secondary">
                <li>Results in minutes, not days</li>
                <li>AI examiner, available any time</li>
                <li>Full band breakdown and PDF report</li>
              </ul>
              <p className="mt-4 text-2xl font-bold text-accent">{AI_TEST_FEE}</p>
              <Button asChild size="lg" variant="accent" className="mt-4 w-full">
                <Link href="/ai-test">
                  Start Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.35)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Video className="h-3 w-3" />
                Live
              </span>
              <h2 className="mt-3 text-xl font-bold text-text-primary">Human Session</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-text-secondary">
                <li>Real certified examiner</li>
                <li>Live over Google Meet</li>
                <li>Personal feedback on your answers</li>
              </ul>
              <p className="mt-4 text-2xl font-bold text-primary">{SESSION_FEE}</p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => setBookingOpen(true)}
              >
                Book a Slot
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setResendOpen(true)}
              className="rounded-full bg-black/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm underline-offset-4 hover:underline"
            >
              Already booked? Get your link
            </button>
          </div>
        </div>
      </section>

      <main>
        {/* Comparison table — given a real header and full-width band instead
            of floating as an undersized box on plain background. */}
        <section className="border-b border-border bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-light px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Pick Your Path
              </span>
              <h2 className="mt-4 text-3xl font-bold text-text-primary">
                Two Ways to Practise
              </h2>
              <p className="mt-2 text-text-secondary">
                Same IELTS speaking format, different pace and price.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-5 py-3.5 font-semibold text-text-primary"> </th>
                    <th className="px-5 py-3.5 font-semibold text-accent">AI Mock Test</th>
                    <th className="px-5 py-3.5 font-semibold text-primary">Human Session</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="px-5 py-3.5 font-medium text-text-primary">Examiner</td>
                    <td className="px-5 py-3.5">AI avatar</td>
                    <td className="px-5 py-3.5">Real human examiner</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-5 py-3.5 font-medium text-text-primary">Scheduling</td>
                    <td className="px-5 py-3.5">Instant, no slot needed</td>
                    <td className="px-5 py-3.5">Requires slot booking</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-5 py-3.5 font-medium text-text-primary">Results</td>
                    <td className="px-5 py-3.5">Instant, auto-generated</td>
                    <td className="px-5 py-3.5">Within 72 hours</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-medium text-text-primary">Best for</td>
                    <td className="px-5 py-3.5">Affordable regular practice</td>
                    <td className="px-5 py-3.5">A serious pre-exam attempt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How It Works — alternating to a tinted background band for rhythm
            instead of another plain-white card. */}
        <section className="bg-primary-light/40 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-text-primary">
              How It Works
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-white bg-white p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Step {step.number}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature highlights on plain white for contrast against the tinted
            section above/below. */}
        <section className="bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-8">
              <h3 className="text-xl font-semibold text-text-primary">
                Real Examiners, Real Format
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Every session follows the exact IELTS speaking structure —
                Parts 1, 2, and 3 — conducted live over Google Meet by a
                certified examiner.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Nusrat Jahan
                    </p>
                    <p className="text-xs text-text-secondary">
                      Sat, Aug 29 · 3:00 PM
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Video className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-primary text-xs font-medium text-white">
                  Join Google Meet
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-8">
              <h3 className="text-xl font-semibold text-text-primary">
                Your Band Score, Fast
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Get a 10-minute live feedback session right after your test,
                plus a downloadable result report within 72 hours.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Overall Band Score
                </p>
                <p className="mt-1 text-3xl font-bold text-accent">7.5</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-light px-3 py-2 text-sm font-medium text-accent">
                  <Download className="h-4 w-4" />
                  speaking-result.pdf
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — tinted band again for the alternating rhythm, ends the page
            content before the dark footer. */}
        <section className="bg-primary-light/40 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Got Questions?
              </span>
              <h2 className="mt-4 text-3xl font-bold text-text-primary">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border bg-white">
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
