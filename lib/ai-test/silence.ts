interface DetectSilenceOptions {
  /** RMS below this level counts as silence. */
  threshold?: number;
  /** Silence duration (ms) at which onWarning fires — a "still there?" nudge. */
  warningMs?: number;
  /** Silence duration (ms) at which the turn actually ends. Needs real
   * headroom over warningMs so a normal thinking pause mid-sentence doesn't
   * get mistaken for the student finishing — natural speech has pauses of
   * 1-3s that are not the end of an answer. */
  cutoffMs?: number;
  /** Fires once when sustained silence first crosses warningMs. Cleared
   * automatically if the student starts talking again before the cutoff. */
  onWarning?: () => void;
  /** Fires once when sustained silence crosses cutoffMs — the turn is over. */
  onSilence: () => void;
}

/**
 * Live mic level meter, used by the pre-test mic check. Reports a 0-1 volume
 * reading roughly every 100ms so the UI can show real movement and require
 * the student to actually make sound — confirming input is *reaching* the
 * mic, not just that getUserMedia() granted permission. A stream from the
 * wrong input device (e.g. a disconnected external mic still selected as
 * default) passes permission fine but produces silence the whole test,
 * which is what caused a real answer to transcribe as Whisper's stock
 * "Thank you." hallucination on silence.
 */
export function watchMicLevel(stream: MediaStream, onLevel: (level: number) => void): () => void {
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  const tick = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
    // Scaled so normal speaking volume reads well above the low end, without
    // clipping at 1 for a loud voice. Purely a UI meter, not a hard gate.
    onLevel(Math.min(1, rms * 12));
  }, 100);

  return () => {
    clearInterval(tick);
    ctx.close();
  };
}

/**
 * Watches a mic stream for sustained silence. Two thresholds: a `warningMs`
 * nudge the caller can use to show "still there?" feedback, and a longer
 * `cutoffMs` that actually ends the turn. Speaking again before the cutoff
 * resets both.
 */
export function detectSilence(
  stream: MediaStream,
  { threshold = 0.01, warningMs = 3000, cutoffMs = 5500, onWarning, onSilence }: DetectSilenceOptions
): () => void {
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  let silenceStart: number | null = null;
  let warned = false;

  const tick = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
    if (rms < threshold) {
      if (!silenceStart) silenceStart = Date.now();
      const elapsed = Date.now() - silenceStart;
      if (!warned && elapsed > warningMs) {
        warned = true;
        onWarning?.();
      }
      if (elapsed > cutoffMs) {
        clearInterval(tick);
        ctx.close();
        onSilence();
      }
    } else {
      silenceStart = null;
      warned = false;
    }
  }, 100);

  return () => {
    clearInterval(tick);
    ctx.close();
  };
}
