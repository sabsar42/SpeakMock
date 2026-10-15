"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle, Clock, Mic, Sparkles, Video } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking-dialog";
import { ResendLinkDialog } from "@/components/resend-link-dialog";
import { ExamDemo } from "@/components/landing/exam-demo";
import { SampleResult } from "@/components/landing/sample-result";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PAYMENT_METHOD_NAME = process.env.NEXT_PUBLIC_PAYMENT_METHOD_NAME ?? "bKash";
const AI_TEST_FEE = process.env.NEXT_PUBLIC_AI_TEST_FEE ?? "৳120";
const SESSION_FEE = process.env.NEXT_PUBLIC_SESSION_FEE ?? "৳500";

const humanSteps = [
  {
    title: "Book your slot",
    description: "Pick an available time and share your payment transaction ID.",
    icon: Calendar,
  },
  {
    title: "We confirm it",
    description: "We verify your payment and email your Google Meet link within a few hours.",
    icon: CheckCircle,
  },
  {
    title: "Speak with an examiner",
    description: "A live, full-format IELTS speaking test, with written feedback after.",
    icon: Video,
  },
];

const faqs = [
  {
    question: "How does the AI mock test work?",
    answer:
      "It's a live video call with an AI examiner that follows the real IELTS speaking format — Part 1 interview, Part 2 cue card with one minute to prepare, and Part 3 discussion. Your answers are transcribed as you speak and scored on all four IELTS criteria.",
  },
  {
    question: "What do I need for the AI test?",
    answer:
      "A laptop or desktop with Chrome or Edge, a working microphone and camera, and about 15 quiet minutes. Headphones help — they stop the examiner's voice echoing into your mic.",
  },
  {
    question: "How accurate is the AI band score?",
    answer:
      "It's a practice estimate, not an official IELTS score. It's built to show you where you stand and what to fix — for a serious pre-exam check, book a session with a human examiner.",
  },
  {
    question: "How do I pay?",
    answer: `Payments are accepted via ${PAYMENT_METHOD_NAME}. After sending payment, enter your transaction ID on the form so we can verify it — your link arrives by email once it's confirmed.`,
  },
  {
    question: "How long can I access my results?",
    answer:
      "Your result page and PDF report stay available for 72 hours after your test, so download the PDF if you want to keep it.",
  },
  {
    question: "What if I miss a human session?",
    answer:
      "Please cancel or reschedule at least 24 hours in advance. No-shows are not eligible for a refund or automatic rescheduling.",
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
          <Image src="/hero/autumn-hero.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          {/* Covers the full text block — the autumn image is bright below
              the clouds line, which washed out the subtitle and stat row. */}
          <div className="absolute inset-x-0 top-0 h-[88%] bg-gradient-to-b from-black/80 via-black/55 to-transparent" />
          {/* Fades the image into the page background instead of a hard line. */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/70 to-background" />
        </div>

        <Navbar transparent onBookClick={() => setBookingOpen(true)} />

        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pb-28 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-4 py-1.5 shadow-[0_0_22px_rgba(239,68,68,0.45)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-white/90">
              AI examiner · available 24/7
            </span>
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.4)] sm:text-6xl">
            Sit a real IELTS speaking test, <span className="text-dune-300">any time</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
            A face-to-face video call with an AI examiner in the real three-part format — and your
            band score with detailed feedback minutes later.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent" className="w-full sm:w-auto">
              <Link href="/ai-test">
                Start AI Mock Test · {AI_TEST_FEE}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-white/70 bg-white/90 sm:w-auto">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> ~15 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mic className="h-4 w-4" /> Parts 1, 2 &amp; 3
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 4-criteria band score + PDF
            </span>
          </div>

          <button
            onClick={() => setResendOpen(true)}
            className="mt-6 rounded-full bg-black/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm underline-offset-4 hover:underline"
          >
            Already booked? Get your link
          </button>
        </div>
      </section>

      <main>
        {/* How the AI test works — an animated walkthrough of the real exam room. */}
        <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                How it actually works
              </span>
              <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
                From &ldquo;hello&rdquo; to band score in one sitting
              </h2>
              <p className="mt-3 text-text-secondary">
                Here&apos;s the exam room you&apos;ll be in. Click any step to jump to it.
              </p>
            </div>
            <div className="mt-12">
              <ExamDemo />
            </div>
          </div>
        </section>

        {/* What you get back */}
        <section className="border-y border-border bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Your result
              </span>
              <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
                Feedback you can actually act on
              </h2>
              <p className="mt-3 text-text-secondary">
                Not just a number — every criterion comes with the reasoning, quotes from your own
                answers, and one concrete thing to practise. Explore a sample:
              </p>
            </div>
            <div className="mt-10">
              <SampleResult />
            </div>
          </div>
        </section>

        {/* Two ways to practise */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-text-primary">Two ways to practise</h2>
              <p className="mt-2 text-text-secondary">Same IELTS speaking format, different pace and price.</p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border-2 border-accent/40 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    <Sparkles className="h-3 w-3" /> Instant
                  </span>
                  <span className="text-2xl font-bold text-accent">{AI_TEST_FEE}</span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-text-primary">AI Mock Test</h3>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-text-secondary">
                  {[
                    "AI examiner over video, any time — no booking",
                    "Band score + feedback in minutes",
                    "Full PDF report with your transcript",
                    "Best for affordable, regular practice",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" variant="accent" className="mt-6 w-full">
                  <Link href="/ai-test">
                    Start Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    <Video className="h-3 w-3" /> Live
                  </span>
                  <span className="text-2xl font-bold text-primary">{SESSION_FEE}</span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-text-primary">Human Session</h3>
                <ol className="mt-3 flex-1 space-y-3">
                  {humanSteps.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                        <p className="text-sm text-text-secondary">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Button size="lg" variant="secondary" className="mt-6 w-full" onClick={() => setBookingOpen(true)}>
                  Book a Slot
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-3xl font-bold text-text-primary">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`item-${i}`} className="border-border bg-background">
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-dune-600 to-dune-700 px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="text-3xl font-bold text-white">Ready to hear your band score?</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/80">
              Fifteen minutes, three parts, one detailed report. No slot to wait for.
            </p>
            <Button asChild size="lg" className="mt-7 bg-white text-dune-700 hover:bg-white/90">
              <Link href="/ai-test">
                Start AI Mock Test <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
