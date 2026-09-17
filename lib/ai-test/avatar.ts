import { SimliClient } from "simli-client";

export interface AvatarProvider {
  /** Resolves only once the avatar has finished speaking the text aloud. */
  speak: (text: string) => Promise<void>;
  stop: () => void;
  destroy: () => void;
}

interface CreateSimliAvatarOptions {
  simliClient: SimliClient;
  /** Our own app session token (from the URL), used to authorize the TTS route — not Simli's session_token. */
  appSessionToken: string;
}

const CHUNK_SIZE = 6000; // bytes per sendAudioData call, per Simli's own example
const PCM16_BYTES_PER_SECOND = 16000 * 2; // 16kHz mono, 2 bytes/sample
const SILENT_EVENT_TIMEOUT_MS = 15_000;

/**
 * Wraps SimliClient (audio-in only — see lib/ai-test/tts.ts for the
 * text-to-speech step) behind the AvatarProvider interface so the test room
 * page never talks to Simli directly. speak() fetches PCM16 audio from our
 * own /api/ai-test/speak route, feeds it to Simli in chunks, and waits for
 * playback to finish so the caller never starts recording over the avatar.
 */
export function createSimliAvatar({
  simliClient,
  appSessionToken,
}: CreateSimliAvatarOptions): AvatarProvider {
  return {
    speak: async (text: string) => {
      const res = await fetch("/api/ai-test/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: appSessionToken, text }),
      });
      if (!res.ok) throw new Error("Could not generate speech audio.");

      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const audioDurationMs = (bytes.length / PCM16_BYTES_PER_SECOND) * 1000;

      // Wait for Simli's `silent` event, which fires when the avatar stops
      // talking. Fall back to the audio's own duration (plus headroom) if the
      // event never arrives, so a dropped event can't stall the whole exam.
      const finished = new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          simliClient.off("silent", done);
          clearTimeout(fallbackTimer);
          resolve();
        };
        const fallbackTimer = setTimeout(
          done,
          Math.min(audioDurationMs + 2000, SILENT_EVENT_TIMEOUT_MS)
        );
        simliClient.on("silent", done);
      });

      for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
        simliClient.sendAudioData(bytes.slice(offset, offset + CHUNK_SIZE));
      }

      await finished;
    },
    stop: () => simliClient.ClearBuffer(),
    destroy: () => {
      simliClient.stop();
    },
  };
}

/** Fallback: plays audio directly in the browser via Web Speech API, with no
 * lip-synced avatar face. Used if Simli fails to connect. */
export function createBrowserAvatar(): AvatarProvider {
  return {
    speak: (text) =>
      new Promise((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          resolve();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => resolve();
        // Resolve rather than reject on error: a failed line of speech should
        // not abort the exam, the student can still read the question onscreen.
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      }),
    stop: () => window.speechSynthesis?.cancel(),
    destroy: () => window.speechSynthesis?.cancel(),
  };
}
