"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Download,
  Mic,
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
    <div className="relative min-h-screen">
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
      <ResendLinkDialog open={resendOpen} onOpenChange={setResendOpen} />

      <div className="fixed inset-0 -z-10">
        <Image
          src="/hero/desert-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-[65vh] bg-gradient-to-b from-black/80 via-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <Navbar transparent onBookClick={() => setBookingOpen(true)} />

      <main>
        <section className="relative">
          <div className="relative mx-auto max-w-3xl px-4 pb-32 pt-24 text-center sm:px-6 sm:pb-44 sm:pt-32">
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
              Book a live mock speaking test over Google Meet and get real
              examiner feedback with your band score — no guesswork.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="accent"
                onClick={() => setBookingOpen(true)}
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                className="bg-white/80 text-primary hover:bg-white"
                onClick={() => setResendOpen(true)}
              >
                Already booked? Get your link
              </Button>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
              Certified examiners &middot; Real IELTS format &middot; Fast
              confirmation
            </p>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/90 bg-white/30 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.3)] ring-1 ring-inset ring-white/40 sm:p-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-center text-3xl font-bold text-text-primary">
                How It Works
              </h2>
              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {steps.map((step) => (
                  <div key={step.number}>
                    <step.icon className="h-6 w-6 text-primary" />
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
          </div>
        </section>

        <section className="px-4 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/30 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.3)] ring-1 ring-inset ring-white/40">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-text-primary">
                  Real Examiners, Real Format
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Every session follows the exact IELTS speaking structure —
                  Parts 1, 2, and 3 — conducted live over Google Meet by a
                  certified examiner.
                </p>
                <div className="mt-6 rounded-xl border border-white/95 bg-white/70 p-4 shadow-sm">
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
                  <div className="mt-3 h-9 w-full rounded-lg bg-primary" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/30 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.3)] ring-1 ring-inset ring-white/40">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-text-primary">
                  Your Band Score, Fast
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Get a 10-minute live feedback session right after your test,
                  plus a downloadable result report within 72 hours.
                </p>
                <div className="mt-6 rounded-xl border border-white/95 bg-white/70 p-4 shadow-sm">
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
          </div>
        </section>

        <section className="px-4 pt-10 sm:px-6">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/90 bg-white/30 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.3)] ring-1 ring-inset ring-white/40 sm:p-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
            <div className="relative z-10">
              <div className="text-center">
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-light px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Got Questions?
                </span>
                <h2 className="mt-4 text-3xl font-bold text-text-primary">
                  Frequently Asked Questions
                </h2>
              </div>
              <Accordion type="single" collapsible className="mt-8 space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
