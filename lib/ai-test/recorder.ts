let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let activeStream: MediaStream | null = null;

/** Returns the long-lived mic stream, requesting permission only on first use. */
export async function getMicStream(): Promise<MediaStream> {
  if (activeStream && activeStream.getTracks().some((t) => t.readyState === "live")) {
    return activeStream;
  }
  activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return activeStream;
}

export function isRecording(): boolean {
  return mediaRecorder?.state === "recording";
}

export async function startRecording(): Promise<MediaStream> {
  const stream = await getMicStream();

  // Guard against double-start: MediaRecorder throws InvalidStateError if
  // start() is called while already recording.
  if (mediaRecorder?.state === "recording") return stream;

  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  audioChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };
  mediaRecorder.start(250);
  return stream;
}

export function stopRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      resolve(new Blob(audioChunks, { type: "audio/webm" }));
      return;
    }
    mediaRecorder.onstop = () => {
      resolve(new Blob(audioChunks, { type: "audio/webm" }));
    };
    mediaRecorder.stop();
  });
}

/** Releases the microphone entirely. Call once when the test ends. */
export function releaseMic() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  mediaRecorder = null;
  activeStream?.getTracks().forEach((t) => t.stop());
  activeStream = null;
}
