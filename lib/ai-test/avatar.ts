import { SimliClient } from "simli-client";

export interface AvatarProvider {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  destroy: () => void;
}

interface CreateSimliAvatarOptions {
  simliClient: SimliClient;
  /** Our own app session token (from the URL), used to authorize the TTS route — not Simli's session_token. */
  appSessionToken: string;
}

/**
 * Wraps SimliClient (audio-in only — see lib/ai-test/tts.ts for the
 * text-to-speech step) behind the AvatarProvider interface so the test room
 * page never talks to Simli directly. speak() fetches PCM16 audio from our
 * own /api/ai-test/speak route and feeds it to Simli in chunks.
 */
export function createSimliAvatar({
  simliClient,
  appSessionToken,
}: CreateSimliAvatarOptions): AvatarProvider {
  const CHUNK_SIZE = 6000; // bytes per sendAudioData call, per Simli's own example

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

      for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
        simliClient.sendAudioData(bytes.slice(offset, offset + CHUNK_SIZE));
      }
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
      new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          reject(new Error("Speech synthesis is not supported in this browser."));
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error("Speech synthesis failed."));
        window.speechSynthesis.speak(utterance);
      }),
    stop: () => window.speechSynthesis?.cancel(),
    destroy: () => window.speechSynthesis?.cancel(),
  };
}
