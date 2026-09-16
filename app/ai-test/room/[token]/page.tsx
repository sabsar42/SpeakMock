"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { SimliClient } from "simli-client";
import {
  AlertTriangle,
  Bot,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createBrowserAvatar, createSimliAvatar, type AvatarProvider } from "@/lib/ai-test/avatar";
import { startRecording, stopRecording } from "@/lib/ai-test/recorder";
import { detectSilence } from "@/lib/ai-test/silence";
import type { CueCard, QuestionBankItem } from "@/lib/types";

const AVATAR_NAME = process.env.NEXT_PUBLIC_AVATAR_NAME ?? "Rami";

type RoomPhase =
  | "loading"
  | "before_start"
  | "part1"
  | "part2_prep"
  | "part2_speaking"
  | "part3"
  | "generating"
  | "done"
  | "error";

type AvatarStatus = "idle" | "speaking" | "listening" | "processing";
type BrowserCheck = "supported" | "unsupported" | "checking";
type ConnectionState = "connecting" | "connected" | "failed";

const PREP_SECONDS = 60;
const SPEAKING_SECONDS = 120;

interface SessionData {
  studentName: string;
  part1Questions: QuestionBankItem[];
  part3Questions: QuestionBankItem[];
  cueCard: CueCard | null;
}

export default function AiTestRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const avatarRef = useRef<AvatarProvider | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopSilenceWatchRef = useRef<(() => void) | null>(null);

  const [phase, setPhase] = useState<RoomPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [usingFallbackAvatar, setUsingFallbackAvatar] = useState(false);

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

  // --- Load question set ---
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ai-test/session/${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(
            data.error === "not_found"
              ? "This test link is invalid or has expired."
              : "Could not load your test. Please try again."
          );
          setPhase("error");
          return;
        }
        setSessionData(data);
        setPhase("before_start");
      } catch {
        if (!cancelled) {
          setLoadError("Could not reach the server. Please check your connection.");
          setPhase("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const isChromeOrEdge = /Chrome|Edg\//.test(navigator.userAgent);
    setBrowserCheck(isChromeOrEdge ? "supported" : "unsupported");
  }, []);

  // --- Connect to Simli once we know the mic works ---
  const connectAvatar = useCallback(async () => {
    setConnectionState("connecting");
    try {
      const res = await fetch("/api/ai-test/simli-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Simli session failed");

      if (!videoRef.current || !audioRef.current) throw new Error("Missing media elements");

      const simliClient = new SimliClient(
        data.session_token,
        videoRef.current,
        audioRef.current,
        data.ice_servers ?? null
      );
      await simliClient.start();

      avatarRef.current = createSimliAvatar({ simliClient, appSessionToken: token });
      setUsingFallbackAvatar(false);
      setConnectionState("connected");
    } catch (err) {
      console.error("Simli connection failed, falling back to browser TTS:", err);
      avatarRef.current = createBrowserAvatar();
      setUsingFallbackAvatar(true);
      setConnectionState("connected");
    }
  }, [token]);

  useEffect(() => {
    if (phase === "before_start" && micChecked) {
      connectAvatar();
    }
  }, [phase, micChecked, connectAvatar]);

  useEffect(() => {
    return () => {
      avatarRef.current?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopSilenceWatchRef.current?.();
    };
  }, []);

  async function speak(text: string) {
    setAvatarStatus("speaking");
    try {
      await avatarRef.current?.speak(text);
    } catch (err) {
      console.error("Avatar speak failed:", err);
    }
    setAvatarStatus("listening");
  }

  async function saveTurn(
    speaker: "examiner" | "student",
    text: string,
    part: 1 | 2 | 3,
    questionId: string | null,
    newPhase?: string
  ) {
    try {
      await fetch("/api/ai-test/save-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, speaker, text, part, question_id: questionId, phase: newPhase }),
      });
    } catch (err) {
      console.error("Failed to save turn:", err);
    }
  }

  async function beginRecording(part: 1 | 2 | 3, questionId: string | null, autoStopMs?: number) {
    try {
      const stream = await startRecording(streamRef.current ?? undefined);
      streamRef.current = stream;
      setIsRecording(true);
      setAvatarStatus("listening");

      if (!autoStopMs) {
        stopSilenceWatchRef.current = detectSilence(stream, () => {
          finishRecording(part, questionId);
        });
      }
    } catch {
      setMicError("Lost access to your microphone. Please check your browser permissions.");
    }
  }

  async function finishRecording(part: 1 | 2 | 3, questionId: string | null) {
    stopSilenceWatchRef.current?.();
    stopSilenceWatchRef.current = null;
    if (!isRecording) return;
    setIsRecording(false);
    setAvatarStatus("processing");

    const blob = await stopRecording(false);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");
      formData.append("token", token);
      const res = await fetch("/api/ai-test/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      const text = res.ok ? data.text : "(Could not transcribe this answer.)";
      await saveTurn("student", text, part, questionId);
    } catch (err) {
      console.error("Transcription failed:", err);
    }
  }

  async function handleCheckMic() {
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

  async function handleBeginTest() {
    if (!sessionData) return;
    setPhase("part1");
    const question = sessionData.part1Questions[0];
    await saveTurn("examiner", question.question_text, 1, question.id, "part1");
    await speak(question.question_text);
    beginRecording(1, question.id);
  }

  async function advancePart1() {
    if (!sessionData) return;
    await finishRecording(1, sessionData.part1Questions[part1Index].id);

    if (part1Index < sessionData.part1Questions.length - 1) {
      const nextIndex = part1Index + 1;
      setPart1Index(nextIndex);
      const question = sessionData.part1Questions[nextIndex];
      await saveTurn("examiner", question.question_text, 1, question.id);
      await speak(question.question_text);
      beginRecording(1, question.id);
    } else {
      setPhase("part2_prep");
      setPrepSecondsLeft(PREP_SECONDS);
      if (sessionData.cueCard) {
        await saveTurn(
          "examiner",
          `${sessionData.cueCard.topic}. ${sessionData.cueCard.bullet_points.join(", ")}.`,
          2,
          sessionData.cueCard.id,
          "part2_prep"
        );
        await speak(`${sessionData.cueCard.topic}. You have one minute to prepare.`);
      }
    }
  }

  useEffect(() => {
    if (phase !== "part2_prep") return;
    if (prepSecondsLeft <= 0) return;
    const timer = setTimeout(() => setPrepSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, prepSecondsLeft]);

  async function startSpeakingPart2() {
    if (!sessionData?.cueCard) return;
    setPhase("part2_speaking");
    setSpeakingSecondsLeft(SPEAKING_SECONDS);
    beginRecording(2, sessionData.cueCard.id, SPEAKING_SECONDS * 1000);
  }

  useEffect(() => {
    if (phase !== "part2_speaking") return;
    if (speakingSecondsLeft <= 0) {
      (async () => {
        if (!sessionData) return;
        await finishRecording(2, sessionData.cueCard?.id ?? null);
        setPhase("part3");
        const question = sessionData.part3Questions[0];
        await saveTurn("examiner", question.question_text, 3, question.id, "part3");
        await speak(question.question_text);
        beginRecording(3, question.id);
      })();
      return;
    }
    const timer = setTimeout(() => setSpeakingSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, speakingSecondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  async function advancePart3() {
    if (!sessionData) return;
    await finishRecording(3, sessionData.part3Questions[part3Index].id);

    if (part3Index < sessionData.part3Questions.length - 1) {
      const nextIndex = part3Index + 1;
      setPart3Index(nextIndex);
      const question = sessionData.part3Questions[nextIndex];
      await saveTurn("examiner", question.question_text, 3, question.id);
      await speak(question.question_text);
      beginRecording(3, question.id);
    } else {
      avatarRef.current?.stop();
      setAvatarStatus("processing");
      setPhase("generating");
      setGeneratingStep(0);
      runScoring();
    }
  }

  async function runScoring() {
    try {
      const res = await fetch("/api/ai-test/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      setPhase("done");
      window.location.href = `/ai-test/result/${token}`;
    } catch (err) {
      console.error("Scoring failed:", err);
      setLoadError(
        "We had trouble generating your results. Please contact support with your test link."
      );
      setPhase("error");
    }
  }

  useEffect(() => {
    if (phase !== "generating") return;
    if (generatingStep >= 2) return;
    const timer = setTimeout(() => setGeneratingStep((s) => s + 1), 2000);
    return () => clearTimeout(timer);
  }, [phase, generatingStep]);

  const statusLabel: Record<AvatarStatus, string> = {
    idle: "Ready",
    speaking: "Speaking...",
    listening: "Listening...",
    processing: "Processing...",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 lg:flex-row">
      <div className="relative flex h-[45vh] flex-col items-center justify-center bg-slate-900 lg:h-screen lg:w-[55%]">
        {!usingFallbackAvatar ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={cn(
              "h-40 w-40 rounded-full object-cover sm:h-56 sm:w-56",
              connectionState !== "connected" && "hidden"
            )}
          />
        ) : null}
        <audio ref={audioRef} autoPlay className="hidden" />

        {(usingFallbackAvatar || connectionState !== "connected") && (
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-800 sm:h-56 sm:w-56">
            {connectionState === "connecting" ? (
              <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
            ) : (
              <Bot className="h-20 w-20 text-slate-500 sm:h-28 sm:w-28" />
            )}
          </div>
        )}

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
                style={{ height: `${8 + ((i * 7) % 20)}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-white px-4 py-8 sm:px-8 lg:w-[45%] lg:overflow-y-auto">
        {phase === "loading" && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {phase === "error" && (
          <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-error" />
            <p className="mt-4 text-text-secondary">{loadError}</p>
            <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {phase === "before_start" && sessionData && (
          <div className="mx-auto flex max-w-md flex-1 flex-col justify-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome, {sessionData.studentName}
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
              {micError && (
                <p className="mt-3 text-sm text-error">
                  {micError} You can also check your{" "}
                  <a
                    href="chrome://settings/content/microphone"
                    className="underline"
                  >
                    browser microphone settings
                  </a>
                  .
                </p>
              )}
              <Button
                variant={micChecked ? "secondary" : "primary"}
                className="mt-4 w-full"
                onClick={handleCheckMic}
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
              disabled={!micChecked || connectionState !== "connected"}
              onClick={handleBeginTest}
            >
              {micChecked && connectionState === "connecting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Begin Test
            </Button>
            <p className="mt-3 text-center text-xs text-text-muted">~15 minutes</p>
          </div>
        )}

        {phase === "part1" && sessionData && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 1 — Introduction
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Question {part1Index + 1} of {sessionData.part1Questions.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-text-primary">
              {sessionData.part1Questions[part1Index].question_text}
            </p>

            <RecordingIndicator isRecording={isRecording} />

            <Button
              variant="ghost"
              size="sm"
              className="mt-6 self-center text-text-muted"
              onClick={advancePart1}
            >
              I&apos;m done speaking
            </Button>
          </div>
        )}

        {phase === "part2_prep" && sessionData?.cueCard && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 2 — Long Turn
            </span>
            <div className="mt-4 rounded-xl border border-border bg-gray-50 p-5">
              <h3 className="text-lg font-semibold text-text-primary">
                {sessionData.cueCard.topic}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
                {sessionData.cueCard.bullet_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-text-muted">
                {sessionData.cueCard.closing_prompt}
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
              <Button size="lg" variant="accent" className="mt-6 w-full" onClick={startSpeakingPart2}>
                Start Speaking
              </Button>
            )}
          </div>
        )}

        {phase === "part2_speaking" && sessionData?.cueCard && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 2 — Long Turn
            </span>
            <h3 className="mt-3 text-lg font-semibold text-text-primary">
              {sessionData.cueCard.topic}
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

            <RecordingIndicator isRecording={isRecording} />
          </div>
        )}

        {phase === "part3" && sessionData && (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Part 3 — Discussion
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Question {part3Index + 1} of {sessionData.part3Questions.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-text-primary">
              {sessionData.part3Questions[part3Index].question_text}
            </p>

            <RecordingIndicator isRecording={isRecording} />

            <Button
              variant="ghost"
              size="sm"
              className="mt-6 self-center text-text-muted"
              onClick={advancePart3}
            >
              I&apos;m done speaking
            </Button>
          </div>
        )}

        {(phase === "generating" || phase === "done") && (
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
      </div>
    </div>
  );
}

function RecordingIndicator({ isRecording }: { isRecording: boolean }) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-sm font-medium",
        isRecording ? "border-error bg-red-50 text-error" : "border-border bg-gray-50 text-text-secondary"
      )}
    >
      {isRecording ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
          </span>
          Recording your answer...
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Preparing microphone...
        </>
      )}
    </div>
  );
}
