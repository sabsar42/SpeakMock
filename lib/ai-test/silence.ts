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
