"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { SimliClient } from "simli-client";
import {
  AlertTriangle,
  Bot,
  Flag,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Video,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  connectSpatiusAvatar,
  createBrowserAvatar,
  createSimliAvatar,
  createSpatiusAvatar,
  type AvatarProvider,
} from "@/lib/ai-test/avatar";
import {
  getCameraStream,
  getMicStream,
  releaseCamera,
  releaseMic,
  startRecording,
  stopRecording,
} from "@/lib/ai-test/recorder";
import { detectSilence, watchMicLevel } from "@/lib/ai-test/silence";
import type { AvatarProviderName, CueCard, QuestionBankItem } from "@/lib/types";

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
const MIN_ANSWER_MS = 1500;

interface SessionData {
  studentName: string;
  avatarProvider: AvatarProviderName;
  part1Questions: QuestionBankItem[];
  part3Questions: QuestionBankItem[];
  cueCard: CueCard | null;
}

/** The one caption line shown over the call — either the examiner's question
 * (Part 1/3), the cue card prompt (Part 2), or null once the student is just
 * expected to talk without a new prompt on screen. */
type Caption = { label: string; text: string } | null;

export default function AiTestRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selfViewRef = useRef<HTMLVideoElement>(null);
  const spatiusContainerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<AvatarProvider | null>(null);
  const stopSilenceWatchRef = useRef<(() => void) | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualFinishRef = useRef<(() => void) | null>(null);

  // Guards against a turn advancing twice — the silence watcher and the
  // part-2 time limit can both race to end the same turn.
  const turnSettledRef = useRef(false);
  const sessionDataRef = useRef<SessionData | null>(null);
  const part1IndexRef = useRef(0);
  const part3IndexRef = useRef(0);

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
  // Live level meter during the mic check — proves sound is actually
  // reaching the selected input device, not just that permission was
  // granted. A stream from the wrong/disconnected input device passes
  // getUserMedia() fine but stays silent the whole test, which is what
  // makes every real answer transcribe as Whisper's stock hallucination
  // on silence instead of an actual transcription failure.
  const [micLevel, setMicLevel] = useState(0);
  const [micHeardSound, setMicHeardSound] = useState(false);
  const stopMicLevelWatchRef = useRef<(() => void) | null>(null);

  // The camera feed is purely a self-view — never sent to the server or
  // analyzed, it just makes this feel like the two-way video call a real
  // IELTS speaking test is. It's required to begin (same as the mic check)
  // since that's the whole point of the room, but its own failure is still
  // isolated from the mic/recording pipeline: a camera problem is shown as
  // its own checklist item rather than being able to corrupt the exam.
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);

  const [part1Index, setPart1Index] = useState(0);
  const [part3Index, setPart3Index] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  // Shows a "still there?" nudge once silence has gone on for a few seconds,
  // well before the turn actually ends — see detectSilence's warningMs/cutoffMs.
  const [silenceWarning, setSilenceWarning] = useState(false);
  // "Something's wrong" pauses the exam (no audio recorded, no timers
  // running) and shows a small recovery panel instead of silently breaking.
  const [flaggedIssue, setFlaggedIssue] = useState(false);

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
        if (!data.part1Questions?.length || !data.part3Questions?.length || !data.cueCard) {
          setLoadError("This test is missing its question set. Please contact support.");
          setPhase("error");
          return;
        }
        sessionDataRef.current = data;
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

  // --- Connect to whichever avatar backend the admin picked for this booking ---
  const connectSimli = useCallback(async () => {
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
  }, [token]);

  const connectSpatius = useCallback(async () => {
    const res = await fetch("/api/ai-test/spatius-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Spatius session failed");

    if (!spatiusContainerRef.current) throw new Error("Missing avatar container");

    const avatarView = await connectSpatiusAvatar({
      appId: data.app_id,
      sessionToken: data.session_token,
      avatarId: data.avatar_id,
      container: spatiusContainerRef.current,
    });

    avatarRef.current = createSpatiusAvatar({ avatarView, appSessionToken: token });
  }, [token]);

  const connectAvatar = useCallback(async () => {
    setConnectionState("connecting");
    const provider = sessionDataRef.current?.avatarProvider ?? "simli";
    try {
      if (provider === "spatius") {
        await connectSpatius();
      } else {
        await connectSimli();
      }
      setUsingFallbackAvatar(false);
      setConnectionState("connected");
    } catch (err) {
      console.error(`${provider} connection failed, falling back to browser speech:`, err);
      avatarRef.current = createBrowserAvatar();
      setUsingFallbackAvatar(true);
      setConnectionState("connected");
    }
  }, [connectSimli, connectSpatius]);

  useEffect(() => {
    if (phase === "before_start" && micChecked && cameraOn && !avatarRef.current) {
      connectAvatar();
    }
  }, [phase, micChecked, cameraOn, connectAvatar]);

  useEffect(() => {
    return () => {
      avatarRef.current?.destroy();
      stopSilenceWatchRef.current?.();
      stopMicLevelWatchRef.current?.();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      releaseMic();
      releaseCamera();
    };
  }, []);

  // The level meter is only needed for the pre-test check — stop it once
  // the exam actually starts so it isn't fighting detectSilence for the
  // same AudioContext/analyser during real turns.
  useEffect(() => {
    if (phase !== "before_start" && stopMicLevelWatchRef.current) {
      stopMicLevelWatchRef.current();
      stopMicLevelWatchRef.current = null;
    }
  }, [phase]);

  async function handleCheckCamera() {
    setIsCheckingCamera(true);
    setCameraError(null);
    try {
      const stream = await getCameraStream();
      if (selfViewRef.current) selfViewRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setCameraError("Couldn't access your camera. Check your browser permissions.");
    } finally {
      setIsCheckingCamera(false);
    }
  }

  async function speak(text: string) {
    setAvatarStatus("speaking");
    try {
      await avatarRef.current?.speak(text);
    } catch (err) {
      console.error("Avatar speak failed:", err);
    }
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

  /**
   * Starts listening for the student's answer. Mostly automatic — silence
   * detection (or, in Part 2, the time limit) ends the turn on its own — but
   * "I'm done" lets the student end it early on purpose, since silence alone
   * can't tell "finished early" from "still thinking".
   */
  async function listenForAnswer(
    part: 1 | 2 | 3,
    questionId: string | null,
    onDone: () => void,
    options?: { autoStopMs?: number; useSilenceDetection?: boolean }
  ) {
    const { autoStopMs, useSilenceDetection = true } = options ?? {};

    try {
      const stream = await startRecording();
      turnSettledRef.current = false;
      setIsRecording(true);
      setSilenceWarning(false);
      setAvatarStatus("listening");

      const startedAt = Date.now();

      const finish = async (force = false) => {
        if (turnSettledRef.current) return;
        // Ignore silence detected before the student has had a chance to speak.
        if (!force && Date.now() - startedAt < MIN_ANSWER_MS) return;
        turnSettledRef.current = true;

        stopSilenceWatchRef.current?.();
        stopSilenceWatchRef.current = null;
        if (autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current);
          autoStopTimerRef.current = null;
        }
        manualFinishRef.current = null;
        setSilenceWarning(false);

        await captureAnswer(part, questionId);
        onDone();
      };

      manualFinishRef.current = () => void finish(true);

      if (useSilenceDetection) {
        stopSilenceWatchRef.current = detectSilence(stream, {
          onWarning: () => setSilenceWarning(true),
          onSilence: () => void finish(),
        });
      }
      if (autoStopMs) {
        autoStopTimerRef.current = setTimeout(() => void finish(true), autoStopMs);
      }
    } catch {
      setIsRecording(false);
      setMicError("Lost access to your microphone. Please check your browser permissions.");
    }
  }

  /** Stops the recorder, transcribes, and persists the student's answer. */
  async function captureAnswer(part: 1 | 2 | 3, questionId: string | null) {
    setIsRecording(false);
    setAvatarStatus("processing");

    const blob = await stopRecording();
    if (blob.size === 0) {
      await saveTurn("student", "(No audio was recorded for this answer.)", part, questionId);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");
      formData.append("token", token);
      const res = await fetch("/api/ai-test/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      // An empty string (as opposed to a failed request) means the audio was
      // processed fine but no real speech was detected in it — distinct from
      // an actual transcription failure, so the scorer isn't misled into
      // thinking something went wrong when the student just didn't answer.
      const text = !res.ok
        ? "(Could not transcribe this answer.)"
        : data.text?.trim()
          ? data.text
          : "(No speech was detected in this answer.)";
      await saveTurn("student", text, part, questionId);
    } catch (err) {
      console.error("Transcription failed:", err);
      await saveTurn("student", "(Could not transcribe this answer.)", part, questionId);
    }
  }

  // Level at which the live meter counts as "we heard you" — well below
  // normal speaking volume so it fires quickly, but well above the noise
  // floor of an open mic in a quiet room.
  const MIC_HEARD_THRESHOLD = 0.08;

  async function handleCheckMic() {
    setIsCheckingMic(true);
    setMicError(null);
    setMicHeardSound(false);
    try {
      const stream = await getMicStream();
      setMicChecked(true);
      stopMicLevelWatchRef.current?.();
      stopMicLevelWatchRef.current = watchMicLevel(stream, (level) => {
        setMicLevel(level);
        if (level > MIC_HEARD_THRESHOLD) setMicHeardSound(true);
      });
    } catch {
      setMicError(
        "We couldn't access your microphone. Please allow microphone permission in your browser settings and try again."
      );
    } finally {
      setIsCheckingMic(false);
    }
  }

  async function handleBeginTest() {
    const data = sessionDataRef.current;
    if (!data) return;
    setPhase("part1");
    part1IndexRef.current = 0;
    setPart1Index(0);
    const question = data.part1Questions[0];
    await saveTurn("examiner", question.question_text, 1, question.id, "part1");
    await speak(question.question_text);
    listenForAnswer(1, question.id, advancePart1);
  }

  async function advancePart1() {
    const data = sessionDataRef.current;
    if (!data) return;

    const nextIndex = part1IndexRef.current + 1;
    if (nextIndex < data.part1Questions.length) {
      part1IndexRef.current = nextIndex;
      setPart1Index(nextIndex);
      const question = data.part1Questions[nextIndex];
      await saveTurn("examiner", question.question_text, 1, question.id);
      await speak(question.question_text);
      listenForAnswer(1, question.id, advancePart1);
      return;
    }

    setPhase("part2_prep");
    setPrepSecondsLeft(PREP_SECONDS);
    if (data.cueCard) {
      await saveTurn(
        "examiner",
        `${data.cueCard.topic}. ${data.cueCard.bullet_points.join(", ")}.`,
        2,
        data.cueCard.id,
        "part2_prep"
      );
      await speak(
        `${data.cueCard.topic}. You have one minute to prepare, then up to two minutes to speak.`
      );
    }
    setAvatarStatus("idle");
  }

  useEffect(() => {
    if (phase !== "part2_prep" || prepSecondsLeft <= 0) return;
    const timer = setTimeout(() => setPrepSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, prepSecondsLeft]);

  // Prep time counts down on its own into the speaking turn — no button, to
  // match a real examiner just starting to listen once the minute is up.
  useEffect(() => {
    if (phase === "part2_prep" && prepSecondsLeft === 0) {
      startSpeakingPart2();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prepSecondsLeft]);

  function startSpeakingPart2() {
    const data = sessionDataRef.current;
    if (!data?.cueCard) return;
    setPhase("part2_speaking");
    setSpeakingSecondsLeft(SPEAKING_SECONDS);
    // Part 2 is a sustained monologue where natural pauses are expected, so
    // the 2-minute limit ends the turn, not silence.
    listenForAnswer(2, data.cueCard.id, startPart3, {
      autoStopMs: SPEAKING_SECONDS * 1000,
      useSilenceDetection: false,
    });
  }

  useEffect(() => {
    if (phase !== "part2_speaking" || speakingSecondsLeft <= 0) return;
    const timer = setTimeout(() => setSpeakingSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, speakingSecondsLeft]);

  async function startPart3() {
    const data = sessionDataRef.current;
    if (!data) return;
    setPhase("part3");
    part3IndexRef.current = 0;
    setPart3Index(0);
    const question = data.part3Questions[0];
    await saveTurn("examiner", question.question_text, 3, question.id, "part3");
    await speak(question.question_text);
    listenForAnswer(3, question.id, advancePart3);
  }

  async function advancePart3() {
    const data = sessionDataRef.current;
    if (!data) return;

    const nextIndex = part3IndexRef.current + 1;
    if (nextIndex < data.part3Questions.length) {
      part3IndexRef.current = nextIndex;
      setPart3Index(nextIndex);
      const question = data.part3Questions[nextIndex];
      await saveTurn("examiner", question.question_text, 3, question.id);
      await speak(question.question_text);
      listenForAnswer(3, question.id, advancePart3);
      return;
    }

    await speak("Thank you, that is the end of the test. I am preparing your results now.");
    avatarRef.current?.stop();
    releaseMic();
    setAvatarStatus("processing");
    setPhase("generating");
    setGeneratingStep(0);
    runScoring();
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
        "We had trouble generating your results. Your answers are saved — please contact support with your test link and we will finish scoring it."
      );
      setPhase("error");
    }
  }

  useEffect(() => {
    if (phase !== "generating" || generatingStep >= 2) return;
    const timer = setTimeout(() => setGeneratingStep((s) => s + 1), 2000);
    return () => clearTimeout(timer);
  }, [phase, generatingStep]);

  /** Voluntarily ends the current turn early, same as silence would. */
  function handleDoneSpeaking() {
    manualFinishRef.current?.();
  }

  /**
   * "Something's wrong" — e.g. the examiner moved on too early. Pauses the
   * exam: stops recording/timers without saving a turn, so the student isn't
   * scored on a cut-off answer, and shows a small recovery panel instead of
   * silently breaking or losing progress.
   */
  function handleFlagIssue() {
    if (turnSettledRef.current) return;
    turnSettledRef.current = true;
    stopSilenceWatchRef.current?.();
    stopSilenceWatchRef.current = null;
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    manualFinishRef.current = null;
    setIsRecording(false);
    setSilenceWarning(false);
    void stopRecording(); // discard — this turn is being flagged, not scored
    setFlaggedIssue(true);
  }

  /** Repeats the current question/prompt and resumes listening, same as if
   * the turn had just started. */
  function handleResumeFromFlag() {
    setFlaggedIssue(false);
    if (phase === "part1") {
      const data = sessionDataRef.current;
      const question = data?.part1Questions[part1IndexRef.current];
      if (question) {
        speak(question.question_text).then(() =>
          listenForAnswer(1, question.id, advancePart1)
        );
      }
    } else if (phase === "part2_speaking") {
      startSpeakingPart2();
    } else if (phase === "part3") {
      const data = sessionDataRef.current;
      const question = data?.part3Questions[part3IndexRef.current];
      if (question) {
        speak(question.question_text).then(() =>
          listenForAnswer(3, question.id, advancePart3)
        );
      }
    }
  }

  const inCall =
    phase === "part1" || phase === "part2_prep" || phase === "part2_speaking" || phase === "part3";

  const caption: Caption = (() => {
    if (!sessionData) return null;
    if (phase === "part1") {
      return {
        label: `Part 1 · Question ${part1Index + 1} of ${sessionData.part1Questions.length}`,
        text: sessionData.part1Questions[part1Index].question_text,
      };
    }
    if ((phase === "part2_prep" || phase === "part2_speaking") && sessionData.cueCard) {
      return { label: "Part 2 · Cue Card", text: sessionData.cueCard.topic };
    }
    if (phase === "part3") {
      return {
        label: `Part 3 · Question ${part3Index + 1} of ${sessionData.part3Questions.length}`,
        text: sessionData.part3Questions[part3Index].question_text,
      };
    }
    return null;
  })();

  const showExaminerVideo =
    phase !== "loading" &&
    !usingFallbackAvatar &&
    connectionState === "connected" &&
    sessionData?.avatarProvider !== "spatius";
  const showSpatiusView =
    phase !== "loading" &&
    !usingFallbackAvatar &&
    connectionState === "connected" &&
    sessionData?.avatarProvider === "spatius";
  const showFallbackIcon =
    phase !== "loading" && (usingFallbackAvatar || connectionState !== "connected");

  // One tree, mounted for the whole page lifetime: the video/canvas/audio
  // elements the avatar SDKs attach to must never unmount mid-call, so every
  // phase is an overlay on top of the same call surface rather than a
  // separate return per phase.
  //
  // The examiner's feed is a tightly-cropped face (Simli/Spatius both render
  // a close-up), so filling the entire viewport with it — the original
  // "full-bleed video call" version — blew the face up far too large.
  // Contained to a centered panel instead, like an actual video-call window.
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
      <div className="relative h-[70vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 sm:h-[75vh]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn("h-full w-full object-cover", !showExaminerVideo && "hidden")}
        />
        <audio ref={audioRef} autoPlay className="hidden" />

        {/* Spatius renders into this container itself (it creates its own canvas). */}
        <div ref={spatiusContainerRef} className={cn("h-full w-full", !showSpatiusView && "hidden")} />

        {showFallbackIcon && (
          <div className="flex h-full w-full items-center justify-center">
            {connectionState === "connecting" ? (
              <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
            ) : (
              <Bot className="h-28 w-28 text-slate-600" />
            )}
          </div>
        )}
      </div>

      {/* Self-view, like the picture-in-picture tile on any real video call.
          Mounted once here (not re-created per phase) so the same <video>
          element serves both the camera-check preview and the in-call tile —
          it just stays anchored to this same corner throughout. */}
      <div
        className={cn(
          "absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl sm:h-36 sm:w-52",
          !cameraOn && "hidden"
        )}
      >
        <video
          ref={selfViewRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        {isRecording && (
          <span className="absolute left-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
          </span>
        )}
      </div>

      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      )}

      {phase === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-4 text-center">
          <AlertTriangle className="h-8 w-8 text-error" />
          <p className="mt-4 max-w-md text-slate-300">{loadError}</p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {phase === "before_start" && sessionData && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-slate-950 px-4 py-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-white">Welcome, {sessionData.studentName}</h1>
            <p className="mt-2 text-slate-400">
              You&apos;re about to take a ~15 minute IELTS speaking test with {AVATAR_NAME}, your
              AI examiner — a live video call, just like the real exam.
            </p>

            {browserCheck === "unsupported" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-800 bg-amber-950/50 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>For the best experience, please use Chrome or Edge.</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-medium text-white">Microphone Check</p>
                <p className="mt-1 text-sm text-slate-400">
                  {micChecked
                    ? "Say something out loud — we need to see the level move before you begin."
                    : "We need to confirm your microphone is working before you begin."}
                </p>
                {micError && <p className="mt-3 text-sm text-error">{micError}</p>}
                {micChecked && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-100",
                        micHeardSound ? "bg-success" : "bg-accent"
                      )}
                      style={{ width: `${Math.max(4, micLevel * 100)}%` }}
                    />
                  </div>
                )}
                <Button
                  variant={micHeardSound ? "secondary" : "primary"}
                  className="mt-4 w-full"
                  onClick={handleCheckMic}
                  disabled={isCheckingMic}
                >
                  {isCheckingMic ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : micHeardSound ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                  {micHeardSound
                    ? "Microphone Working"
                    : micChecked
                      ? "Waiting to hear you..."
                      : "Test My Microphone"}
                </Button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-medium text-white">Camera Check</p>
                <p className="mt-1 text-sm text-slate-400">
                  This is a real video call — the examiner needs to see you, so your camera must
                  be on to begin. Your feed is never recorded or sent anywhere else.
                </p>
                {/* The self-view preview appears in the corner PiP tile once
                    the camera is on — see the fixed corner tile above. */}
                {cameraError && <p className="mt-3 text-sm text-error">{cameraError}</p>}
                <Button
                  variant={cameraOn ? "secondary" : "primary"}
                  className="mt-4 w-full"
                  onClick={handleCheckCamera}
                  disabled={isCheckingCamera || cameraOn}
                >
                  {isCheckingCamera ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  {cameraOn ? "Camera Working" : "Turn On Camera"}
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              variant="accent"
              className="mt-6 w-full"
              disabled={!micHeardSound || !cameraOn || connectionState !== "connected"}
              onClick={handleBeginTest}
            >
              {micHeardSound && cameraOn && connectionState === "connecting" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {micHeardSound && cameraOn && connectionState === "connecting"
                ? "Connecting to your examiner..."
                : "Begin Test"}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">~15 minutes</p>
          </div>
        </div>
      )}

      {inCall && (
        <>
          {/* Top-left: who you're talking to, plus a live status pill. */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
            <span>{AVATAR_NAME}</span>
            {avatarStatus === "speaking" && <Volume2 className="h-3.5 w-3.5 text-accent" />}
            {avatarStatus === "listening" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
            )}
            {avatarStatus === "processing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>

          {/* Top-right: Part 2 timers, when relevant. */}
          {phase === "part2_prep" && (
            <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-white backdrop-blur">
              Prep: 0:{prepSecondsLeft.toString().padStart(2, "0")}
            </div>
          )}
          {phase === "part2_speaking" && (
            <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-white backdrop-blur">
              {Math.floor(speakingSecondsLeft / 60)}:
              {(speakingSecondsLeft % 60).toString().padStart(2, "0")} remaining
            </div>
          )}

          {/* A quiet "still there?" nudge once silence has gone on a few
              seconds — well before the turn actually ends, so pausing to
              think never feels risky. */}
          {silenceWarning && isRecording && (
            <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full border border-accent/40 bg-accent-light/90 px-3.5 py-1.5 text-xs font-medium text-accent-dark shadow backdrop-blur">
              Still there? Keep speaking, or press &ldquo;I&apos;m done&rdquo; below.
            </div>
          )}

          {/* Caption bar: the current question/cue card, like a subtitle. */}
          {caption && (
            <div className="absolute inset-x-0 bottom-20 flex justify-center px-4 sm:bottom-24">
              <div className="max-w-xl rounded-2xl bg-black/55 px-5 py-3.5 text-center backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  {caption.label}
                </p>
                <p className="mt-1 text-base font-medium text-white sm:text-lg">{caption.text}</p>
                {phase === "part2_speaking" && (
                  <p className="mt-2 text-xs text-slate-300">
                    Speak for up to 2 minutes — I&apos;ll let you know when we move on.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual controls: silence normally ends the turn on its own, but
              these let the student end early on purpose or flag a problem
              (e.g. the examiner moved on wrongly) instead of being stuck. */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 px-4">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 text-slate-900 hover:bg-white"
              disabled={!isRecording}
              onClick={handleDoneSpeaking}
            >
              <Mic className="h-3.5 w-3.5" />
              I&apos;m done
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 bg-black/40 text-white backdrop-blur hover:bg-black/60"
              onClick={handleFlagIssue}
            >
              <Flag className="h-3.5 w-3.5" />
              Something&apos;s wrong
            </Button>
          </div>

          {micError && (
            <div className="absolute inset-x-0 bottom-24 flex justify-center px-4">
              <p className="rounded-lg bg-red-950/80 px-4 py-2 text-sm text-error backdrop-blur">
                {micError}
              </p>
            </div>
          )}

          {flaggedIssue && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                <Flag className="mx-auto h-8 w-8 text-accent" />
                <h3 className="mt-3 text-lg font-semibold text-text-primary">Test paused</h3>
                <p className="mt-1.5 text-sm text-text-secondary">
                  No worries — nothing was lost. Press below and {AVATAR_NAME} will repeat the
                  current question so you can answer it properly.
                </p>
                <Button className="mt-5 w-full" onClick={handleResumeFromFlag}>
                  Repeat the Question
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {(phase === "generating" || phase === "done") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 px-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-5 text-xl font-semibold text-white">Generating your results...</h2>
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
                        ? "font-medium text-white"
                        : "text-slate-500"
                  )}
                >
                  {label}
                </p>
              )
            )}
          </div>
          <p className="mt-5 text-xs text-slate-500">
            This can take up to a minute. Please keep this page open.
          </p>
        </div>
      )}
    </div>
  );
}
