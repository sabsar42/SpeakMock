export function detectSilence(
  stream: MediaStream,
  onSilence: () => void,
  threshold = 0.01,
  silenceMs = 2000
): () => void {
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  let silenceStart: number | null = null;

  const tick = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
    if (rms < threshold) {
      if (!silenceStart) silenceStart = Date.now();
      else if (Date.now() - silenceStart > silenceMs) {
        clearInterval(tick);
        ctx.close();
        onSilence();
      }
    } else {
      silenceStart = null;
    }
  }, 100);

  return () => {
    clearInterval(tick);
    ctx.close();
  };
}
