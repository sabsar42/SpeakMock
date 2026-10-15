"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Mic, Pause, Play, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A scripted, animated walkthrough of the AI exam room for the landing page.
 * Pure HTML/CSS — no video file, no avatar session, nothing that costs money
 * per visit. Each step is a timeline: `t` is ms elapsed within the step, and
 * everything on screen is a function of (step, t), so jumping to any step or
 * pausing is just setting those two numbers.
 */

interface Step {
  title: string;
  blurb: string;
  durationMs: number;
}

const STEPS: Step[] = [
  {
    title: "Check your mic & camera",
    blurb: "A quick setup check makes sure the examiner can actually hear you.",
    durationMs: 4500,
  },
  {
    title: "Part 1 — Interview",
    blurb: "The examiner asks short questions about you. Just answer naturally.",
    durationMs: 9000,
  },
  {
    title: "Part 2 — Cue card",
    blurb: "One minute to prepare, then speak for up to two minutes.",
    durationMs: 8500,
  },
  {
    title: "Part 3 — Discussion",
    blurb: "Deeper questions linked to your Part 2 topic.",
    durationMs: 8000,
  },
  {
    title: "Get your band score",
    blurb: "Scored on all four IELTS criteria, with a PDF report in minutes.",
    durationMs: 6500,
  },
];

const PART1_Q = "Do you live in a house or an apartment?";
const PART1_A =
  "I live in a small apartment in the city centre. It suits me because everything is within walking distance.";
const PART3_Q = "Which skills will matter most for young people in the future?";
const PART3_A =
  "Probably the ones machines are bad at, like creative problem solving and communication.";
const CUE_TOPIC = "Describe a skill you would like to learn";
const CUE_POINTS = ["what the skill is", "how you would learn it", "why you want to learn it"];

const CRITERIA = [
  { label: "Fluency & Coherence", score: 7 },
  { label: "Lexical Resource", score: 6.5 },
  { label: "Grammatical Range", score: 6 },
  { label: "Pronunciation", score: 6.5 },
];

/** Fraction 0-1 of the way from `start` to `end` ms. */
function progress(t: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}

function typed(text: string, t: number, start: number, end: number) {
  return text.slice(0, Math.round(text.length * progress(t, start, end)));
}

export function ExamDemo() {
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    if (media.matches) setPlaying(false);
  }, []);

  // Only animate while on screen — no point burning CPU below the fold.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const interval = setInterval(() => setT((prev) => prev + 100), 100);
    return () => clearInterval(interval);
  }, [playing, visible]);

  // Advance in an effect rather than inside the setT updater — updaters must
  // be pure (React may run them twice), and a side effect there skips steps.
  useEffect(() => {
    if (reducedMotion || t < STEPS[step].durationMs) return;
    setStep((s) => (s + 1) % STEPS.length);
    setT(0);
  }, [t, step, reducedMotion]);

  function goTo(index: number) {
    setStep(index);
    // Without motion, show each step in its finished state rather than frame 0.
    setT(reducedMotion ? STEPS[index].durationMs * 0.8 : 0);
  }

  // Reduced motion: static, finished-looking frame for whichever step is shown.
  const now = reducedMotion ? STEPS[step].durationMs * 0.8 : t;

  return (
    <div ref={rootRef} className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* Step rail */}
      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const active = i === step;
          return (
            <li key={s.title}>
              <button
                onClick={() => goTo(i)}
                className={cn(
                  "group relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-accent/40 bg-white shadow-sm"
                    : "border-transparent hover:border-border hover:bg-white/60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active ? "bg-accent text-white" : i < step ? "bg-accent-light text-accent" : "bg-white text-text-muted"
                    )}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div>
                    <p className={cn("text-sm font-semibold", active ? "text-text-primary" : "text-text-secondary")}>
                      {s.title}
                    </p>
                    {active && <p className="mt-0.5 text-sm text-text-secondary">{s.blurb}</p>}
                  </div>
                </div>
                {active && !reducedMotion && (
                  <span
                    className="absolute bottom-0 left-0 h-0.5 bg-accent transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress(t, 0, s.durationMs) * 100}%` }}
                  />
                )}
              </button>
            </li>
          );
        })}
        {!reducedMotion && (
          <li className="pt-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-white hover:text-text-primary"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause demo" : "Play demo"}
            </button>
          </li>
        )}
      </ol>

      {/* Mock exam window */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl" aria-hidden>
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 truncate rounded bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
            speakmock · AI exam room
          </span>
        </div>
        <div className="relative aspect-[16/10] w-full">
          {step === 0 && <SetupScene t={now} />}
          {step === 1 && <QuestionScene t={now} label="Part 1 · Question 1 of 6" question={PART1_Q} answer={PART1_A} />}
          {step === 2 && <CueCardScene t={now} />}
          {step === 3 && <QuestionScene t={now} label="Part 3 · Question 1 of 4" question={PART3_Q} answer={PART3_A} />}
          {step === 4 && <ResultScene t={now} />}
        </div>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-0.5">
      {[0.5, 0.9, 0.6, 1, 0.7].map((h, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full bg-success", active && "animate-pulse")}
          style={{ height: active ? `${h * 100}%` : "20%", animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function Examiner({ speaking }: { speaking: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        {speaking && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-dune-500 to-dune-700 shadow-lg sm:h-28 sm:w-28">
          <Bot className="h-11 w-11 text-white sm:h-12 sm:w-12" />
        </div>
      </div>
    </div>
  );
}

function SelfTile({ listening }: { listening: boolean }) {
  return (
    <div className="absolute bottom-3 right-3 flex h-16 w-24 items-center justify-center rounded-lg border border-white/15 bg-slate-800 sm:h-20 sm:w-28">
      <User className="h-7 w-7 text-white/40" />
      {listening && (
        <>
          <span className="absolute left-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-error" />
          <div className="absolute bottom-1.5 left-1.5">
            <Waveform active />
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
      Rami
      {speaking && <span className="text-dune-300">· speaking</span>}
      {listening && <span className="text-success">· listening</span>}
    </div>
  );
}

function SetupScene({ t }: { t: number }) {
  const micOk = t > 1300;
  const camOk = t > 2600;
  const level = micOk ? 0.35 + 0.35 * Math.abs(Math.sin(t / 180)) : 0.08;
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="w-full max-w-xs space-y-2.5">
        <p className="text-sm font-semibold text-white">Before you begin</p>
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" /> Microphone
            </span>
            {micOk && <Check className="h-4 w-4 text-success" />}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-all duration-100", micOk ? "bg-success" : "bg-accent")}
              style={{ width: `${level * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-xs text-white/80">
          <span className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" /> Camera
          </span>
          {camOk && <Check className="h-4 w-4 text-success" />}
        </div>
        <div
          className={cn(
            "rounded-lg py-2 text-center text-xs font-semibold transition-colors duration-300",
            t > 3300 ? "bg-accent text-white" : "bg-white/10 text-white/40"
          )}
        >
          Begin Test
        </div>
      </div>
    </div>
  );
}

function QuestionScene({
  t,
  label,
  question,
  answer,
}: {
  t: number;
  label: string;
  question: string;
  answer: string;
}) {
  const speaking = t < 2600;
  const listening = t >= 2600 && t < 7600;
  const processing = t >= 7600;
  const shownAnswer = typed(answer, t, 2800, 7200);
  return (
    <>
      <Examiner speaking={speaking} />
      <StatusPill speaking={speaking} listening={listening} />
      <SelfTile listening={listening} />
      <div className="absolute inset-x-3 bottom-3 mr-28 sm:mr-32">
        <div className="rounded-xl bg-black/60 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">{label}</p>
          <p className="mt-0.5 text-xs font-medium text-white sm:text-sm">{typed(question, t, 0, 2000)}</p>
        </div>
        {(listening || processing) && (
          <p className="mt-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] text-slate-800 sm:text-xs">
            <span className="font-semibold text-accent">You: </span>
            {shownAnswer}
            {listening && <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-slate-800 align-middle" />}
          </p>
        )}
      </div>
    </>
  );
}

function CueCardScene({ t }: { t: number }) {
  const prepping = t < 4200;
  // Fast-forwarded: 60s of prep and 2min of speaking compressed into seconds.
  const prepLeft = Math.ceil(60 * (1 - progress(t, 400, 4200)));
  const speakLeft = Math.ceil(120 * (1 - progress(t, 4200, 8300)));
  return (
    <>
      <Examiner speaking={false} />
      <StatusPill speaking={false} listening={!prepping} />
      <SelfTile listening={!prepping} />
      <div
        className={cn(
          "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white",
          prepping ? "bg-black/50" : "bg-accent/80"
        )}
      >
        {prepping
          ? `Prep 0:${String(prepLeft).padStart(2, "0")}`
          : `${Math.floor(speakLeft / 60)}:${String(speakLeft % 60).padStart(2, "0")} left`}
      </div>
      <div
        className="absolute left-3 top-1/2 w-44 -translate-y-1/2 rounded-xl bg-white p-3 shadow-xl transition-all duration-500 sm:w-52"
        style={{ opacity: progress(t, 0, 400), transform: `translateY(-50%) translateX(${(1 - progress(t, 0, 400)) * -16}px)` }}
      >
        <p className="text-[9px] font-semibold uppercase tracking-wide text-accent">Part 2 · Cue card</p>
        <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-900 sm:text-xs">{CUE_TOPIC}</p>
        <p className="mt-1.5 text-[9px] text-slate-500">You should say:</p>
        <ul className="mt-0.5 list-disc space-y-0.5 pl-3.5 text-[10px] text-slate-600 sm:text-[11px]">
          {CUE_POINTS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <p className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-white/60">
        {prepping ? "Preparing… (fast-forwarded)" : "Speaking… (fast-forwarded)"}
      </p>
    </>
  );
}

function ResultScene({ t }: { t: number }) {
  const band = 6.5 * progress(t, 200, 1600);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5 bg-gradient-to-br from-slate-950 to-slate-900 p-5 sm:gap-8">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="#C81E4C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(band / 9) * 97.4} 97.4`}
          />
        </svg>
        <div className="text-center">
          <p className="text-2xl font-bold text-white sm:text-3xl">{band.toFixed(1)}</p>
          <p className="text-[9px] uppercase tracking-wide text-white/50">Overall band</p>
        </div>
      </div>
      <div className="w-full max-w-[13rem] space-y-2">
        {CRITERIA.map((c, i) => {
          const fill = progress(t, 900 + i * 300, 1900 + i * 300);
          return (
            <div key={c.label}>
              <div className="flex justify-between text-[10px] text-white/70 sm:text-[11px]">
                <span>{c.label}</span>
                <span className="font-semibold text-white">{fill > 0.95 ? c.score.toFixed(1) : ""}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-dune-500" style={{ width: `${(c.score / 9) * fill * 100}%` }} />
              </div>
            </div>
          );
        })}
        <p
          className="pt-1 text-[10px] text-dune-300 transition-opacity duration-500"
          style={{ opacity: progress(t, 3200, 3700) }}
        >
          PDF report ready to download ↓
        </p>
      </div>
    </div>
  );
}
