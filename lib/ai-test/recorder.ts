let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let activeStream: MediaStream | null = null;

export async function startRecording(stream?: MediaStream): Promise<MediaStream> {
  activeStream = stream ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));
  mediaRecorder = new MediaRecorder(activeStream, { mimeType: "audio/webm" });
  audioChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };
  mediaRecorder.start(250);
  return activeStream;
}

export function stopRecording(stopTracks = true): Promise<Blob> {
  return new Promise((resolve) => {
    if (!mediaRecorder) {
      resolve(new Blob([], { type: "audio/webm" }));
      return;
    }
    mediaRecorder.onstop = () => {
      resolve(new Blob(audioChunks, { type: "audio/webm" }));
      if (stopTracks) activeStream?.getTracks().forEach((t) => t.stop());
    };
    mediaRecorder.stop();
  });
}
