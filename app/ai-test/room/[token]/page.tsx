"use client";

import { use, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Loader2,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AVATAR_NAME = process.env.NEXT_PUBLIC_AVATAR_NAME ?? "Rami";

// --- Mock data for the UI-only build step. Replaced by real API/Simli/Groq
// wiring in later steps of the AVATAR.md build order. ---
const MOCK_PART1_QUESTIONS = [
  "Do you live in a house or an apartment?",
  "How long have you lived there?",
  "What do you like most about your home?",
  "Would you like to move somewhere else in the future?",
  "Is your neighborhood a good place to live?",
  "What kind of place would you like to live in when you are older?",
];

const MOCK_CUE_CARD = {
  topic: "Describe a skill you would like to learn",
  bulletPoints: [
    "what the skill is",
    "how you would learn it",
    "how long it would take",
    "and explain why you want to learn this skill",
  ],
  closingPrompt: "You should say...",
};

const MOCK_PART3_QUESTIONS = [
  "What skills do you think will be important in the future job market?",
  "Is it better to learn a skill through formal education or by practicing on your own?",
  "Do you think schools teach enough practical skills?",
  "How has technology changed the way people learn new skills?",
];

type RoomPhase =
  | "before_start"
  | "part1"
  | "part2_prep"
  | "part2_speaking"
  | "part3"
  | "generating"
  | "done";

type AvatarStatus = "idle" | "speaking" | "listening" | "processing";

type BrowserCheck = "supported" | "unsupported" | "checking";

const PREP_SECONDS = 60;
const SPEAKING_SECONDS = 120;

export default function AiTestRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  useState(use(params)); // token reserved for the real API wiring step

  const [phase, setPhase] = useState<RoomPhase>("before_start");
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [browserCheck, setBrowserCheck] = useState<BrowserCheck>("checking");
  const [micError, setMicError] = useState<string | null>(null);
  const [micChecked, setMicChecked] = useState(false);
  const [isCheckingMic, setIsCheckingMic] = useState(false);

  const [part1Index, setPart1Index] = useState(0);
  const [part3Index, setPart3Index] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [prepSecondsLeft, setPrepSecondsLeft] = useState(PREP_SECONDS);
  const [speakingSecondsLeft, setSpeakingSecondsLeft] = useState(SPEAKING_SECONDS);

  const [generatingStep, setGeneratingStep] = useState(0);

  useEffect(() => {
    const isChromeOrEdge = /Chrome|Edg\//.test(navigator.userAgent);
    setBrowserCheck(isChromeOrEdge ? "supported" : "unsupported");
  }, []);

  useEffect(() => {
    if (phase !== "part2_prep") return;
    if (prepSecondsLeft <= 0) {
      setPhase("part2_speaking");
      return;
    }
    const timer = setTimeout(() => setPrepSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, prepSecondsLeft]);

  useEffect(() => {
    if (phase !== "part2_speaking") return;
    if (speakingSecondsLeft <= 0) {
      setPhase("part3");
      setAvatarStatus("speaking");
      return;
    }
    const timer = setTimeout(() => setSpeakingSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, speakingSecondsLeft]);

  useEffect(() => {
    if (phase !== "generating") return;
    if (generatingStep >= 3) {
      const timer = setTimeout(() => setPhase("done"), 1200);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setGeneratingStep((s) => s + 1), 1400);
    return () => clearTimeout(timer);
  }, [phase, generatingStep]);

  async function checkMic() {
    setIsCheckingMic(true);
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicChecked(true);
    } catch {
      setMicError(
        "We couldn't access your microphone. Please allow microphone permission in your browser settings and try again."
      );
    } finally {
      setIsCheckingMic(false);
    }
  }

  function handleBeginTest() {
    setPhase("part1");
    setAvatarStatus("speaking");
    setTimeout(() => setAvatarStatus("listening"), 1500);
  }

  function handleDoneSpeakingPart1() {
    if (part1Index < MOCK_PART1_QUESTIONS.length - 1) {
      setAvatarStatus("speaking");
      setPart1Index((i) => i + 1);
      setTimeout(() => setAvatarStatus("listening"), 1200);
    } else {
      setAvatarStatus("speaking");
      setPhase("part2_prep");
      setPrepSecondsLeft(PREP_SECONDS);
    }
  }

  function handleStartSpeakingPart2() {
    setPhase("part2_speaking");
    setSpeakingSecondsLeft(SPEAKING_SECONDS);
    setAvatarStatus("listening");
  }

  function handleDoneSpeakingPart3() {
    if (part3Index < MOCK_PART3_QUESTIONS.length - 1) {
      setAvatarStatus("speaking");
      setPart3Index((i) => i + 1);
      setTimeout(() => setAvatarStatus("listening"), 1200);
    } else {
      setAvatarStatus("processing");
      setPhase("generating");
      setGeneratingStep(0);
    }
  }

  const statusLabel: Record<AvatarStatus, string> = {
    idle: "Ready",
    speaking: "Speaking...",
    listening: "Listening...",
    processing: "Processing...",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 lg:flex-row">
      <div className="relative flex h-[45vh] flex-col items-center justify-center bg-slate-900 lg:h-screen lg:w-[55%]">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-800 sm:h-56 sm:w-56">
          <Bot className="h-20 w-20 text-slate-500 sm:h-28 sm:w-28" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">{AVATAR_NAME}</p>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300">
          {avatarStatus === "speaking" && <Volume2 className="h-3.5 w-3.5 text-accent" />}
          {avatarStatus === "listening" && <Mic className="h-3.5 w-3.5 text-success animate-pulse" />}
          {avatarStatus === "processing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {statusLabel[avatarStatus]}
        </div>
        {avatarStatus === "listening" && (
          <div className="mt-4 flex items-end gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1.5 animate-pulse rounded-full bg-success"
                style={{
                  height: `${8 + ((i * 7) % 20)}px`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-white px-4 py-8 sm:px-8 lg:w-[45%] lg:overflow-y-auto">
        {phase === "before_start" && (
          <div className="mx-auto flex max-w-md flex-1 flex-col justify-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome to your AI Mock Test
            </h1>
            <p className="mt-2 text-text-secondary">
              You&apos;re about to take a ~15 minute IELTS speaking test with{" "}
              {AVATAR_NAME}, your AI examiner.
            </p>

            {browserCheck === "unsupported" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  For the best experience, please use Chrome or Edge. Your
                  current browser may not support all features.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-border bg-gray-50 p-5">
              <p className="text-sm font-medium text-text-primary">Microphone Check</p>
              <p className="mt-1 text-sm text-text-secondary">
                We need to confirm your microphone is working before you begin.
              </p>
              {micError && <p className="mt-3 text-sm text-error">{micError}</p>}
              <Button
                variant={micChecked ? "secondary" : "primary"}
                className="mt-4 w-full"
                onClick={checkMic}
                disabled={isCheckingMic}
              >
                {isCheckingMic ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : micChecked ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
                {micChecked ? "Microphone Working" : "Test My Microphone"}
              </Button>
            </div>

            <Button
              size="lg"
              variant="accent"
              className="mt-6 w-full"
              disabled={!micChecked}
              onClick={handleBeginTest}
            >
              Begin Test
            </Button>
            <p className="mt-3 text-center text-xs text-text-muted">~15 minutes</p>
          </div>
        )}

        {phase === "part1" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 1 — Introduction
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Question {part1Index + 1} of {MOCK_PART1_QUESTIONS.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-text-primary">
              {MOCK_PART1_QUESTIONS[part1Index]}
            </p>

            <RecordingToggle isRecording={isRecording} onToggle={setIsRecording} />

            <Button
              variant="ghost"
              size="sm"
              className="mt-6 self-center text-text-muted"
              onClick={handleDoneSpeakingPart1}
            >
              I&apos;m done speaking
            </Button>
          </div>
        )}

        {phase === "part2_prep" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 2 — Long Turn
            </span>
            <div className="mt-4 rounded-xl border border-border bg-gray-50 p-5">
              <h3 className="text-lg font-semibold text-text-primary">
                {MOCK_CUE_CARD.topic}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
                {MOCK_CUE_CARD.bulletPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-text-muted">
                {MOCK_CUE_CARD.closingPrompt}
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Preparation Time
              </p>
              <p
                className={cn(
                  "mt-1 text-5xl font-bold tabular-nums",
                  prepSecondsLeft <= 10 ? "text-accent" : "text-text-primary"
                )}
              >
                0:{prepSecondsLeft.toString().padStart(2, "0")}
              </p>
            </div>

            {prepSecondsLeft <= 0 && (
              <Button size="lg" variant="accent" className="mt-6 w-full" onClick={handleStartSpeakingPart2}>
                Start Speaking
              </Button>
            )}
          </div>
        )}

        {phase === "part2_speaking" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 2 — Long Turn
            </span>
            <h3 className="mt-3 text-lg font-semibold text-text-primary">
              {MOCK_CUE_CARD.topic}
            </h3>

            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{
                  width: `${((SPEAKING_SECONDS - speakingSecondsLeft) / SPEAKING_SECONDS) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-center text-sm text-text-muted">
              {Math.floor(speakingSecondsLeft / 60)}:
              {(speakingSecondsLeft % 60).toString().padStart(2, "0")} remaining
            </p>

            <RecordingToggle isRecording={isRecording} onToggle={setIsRecording} />
          </div>
        )}

        {phase === "part3" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 3 — Discussion
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Question {part3Index + 1} of {MOCK_PART3_QUESTIONS.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-text-primary">
              {MOCK_PART3_QUESTIONS[part3Index]}
            </p>

            <RecordingToggle isRecording={isRecording} onToggle={setIsRecording} />

            <Button
              variant="ghost"
              size="sm"
              className="mt-6 self-center text-text-muted"
              onClick={handleDoneSpeakingPart3}
            >
              I&apos;m done speaking
            </Button>
          </div>
        )}

        {phase === "generating" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="mt-5 text-xl font-semibold text-text-primary">
              Generating your results...
            </h2>
            <div className="mt-5 space-y-2 text-sm">
              {["Scoring answers...", "Writing feedback...", "Creating your PDF..."].map(
                (label, i) => (
                  <p
                    key={label}
                    className={cn(
                      "transition-colors",
                      i < generatingStep
                        ? "text-success"
                        : i === generatingStep
                          ? "font-medium text-text-primary"
                          : "text-text-muted"
                    )}
                  >
                    {label}
                  </p>
                )
              )}
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
            <h2 className="text-xl font-semibold text-text-primary">Your results are ready</h2>
            <p className="mt-2 text-sm text-text-secondary">
              (Redirects automatically to your result page once scoring is wired up.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordingToggle({
  isRecording,
  onToggle,
}: {
  isRecording: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!isRecording)}
      className={cn(
        "mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-sm font-medium transition-colors",
        isRecording
          ? "border-error bg-red-50 text-error"
          : "border-border bg-gray-50 text-text-secondary hover:border-primary hover:text-primary"
      )}
    >
      {isRecording ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
          </span>
          Recording...
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Tap to speak
        </>
      )}
    </button>
  );
}
