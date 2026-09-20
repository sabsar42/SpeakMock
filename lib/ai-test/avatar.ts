import { SimliClient } from "simli-client";
import { AvatarSDK, AvatarManager, AvatarView, ConversationState } from "@spatius/avatarkit";

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

interface CreateSpatiusAvatarOptions {
  avatarView: AvatarView;
  /** Our own app session token (from the URL), used to authorize the TTS route. */
  appSessionToken: string;
}

const SPATIUS_STATE_TIMEOUT_MS = 15_000;

/**
 * Wraps a connected Spatius AvatarView behind the AvatarProvider interface,
 * mirroring createSimliAvatar. Spatius has no built-in TTS either, so this
 * fetches PCM16 audio from our own /api/ai-test/speak route exactly like the
 * Simli path, and feeds it to the avatar's controller as a single send() call
 * (the SDK buffers the whole clip and streams it out internally).
 *
 * Spatius has no "finished speaking" event like Simli's `silent` — instead we
 * watch controller.onConversationState for a transition back to `idle`. Per
 * Spatius's own docs this can fire slightly before the tail of the audio
 * actually finishes playing, so we also cap the wait with the clip's own
 * duration as a safety net either way.
 */
export function createSpatiusAvatar({
  avatarView,
  appSessionToken,
}: CreateSpatiusAvatarOptions): AvatarProvider {
  const controller = avatarView.controller;

  return {
    speak: async (text: string) => {
      const res = await fetch("/api/ai-test/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: appSessionToken, text }),
      });
      if (!res.ok) throw new Error("Could not generate speech audio.");

      const buffer = await res.arrayBuffer();
      const audioDurationMs = (buffer.byteLength / PCM16_BYTES_PER_SECOND) * 1000;

      const finished = new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          controller.onConversationState = null;
          clearTimeout(fallbackTimer);
          resolve();
        };
        const fallbackTimer = setTimeout(
          done,
          Math.min(audioDurationMs + 2000, SPATIUS_STATE_TIMEOUT_MS)
        );
        controller.onConversationState = (state: ConversationState) => {
          if (state === ConversationState.idle) done();
        };
      });

      controller.send(buffer, true);

      await finished;
    },
    stop: () => controller.interrupt(),
    // avatarView.dispose() already closes its AvatarController internally
    // (per its own docs) — calling controller.close() first as well throws
    // "Cannot close a closed AudioContext" on teardown.
    destroy: () => {
      avatarView.dispose();
      AvatarSDK.cleanup();
    },
  };
}

/**
 * Connects to Spatius and returns a ready AvatarView. Must be called from a
 * user-gesture handler (initializeAudioContext requires it). Throws on any
 * failure so the caller can fall back to createBrowserAvatar, same pattern
 * as the Simli connection path.
 */
export async function connectSpatiusAvatar({
  appId,
  sessionToken,
  avatarId,
  container,
}: {
  appId: string;
  sessionToken: string;
  avatarId: string;
  container: HTMLElement;
}): Promise<AvatarView> {
  await AvatarSDK.initialize(appId, {});
  AvatarSDK.setSessionToken(sessionToken);

  const avatar = await AvatarManager.shared.load(avatarId);
  const avatarView = new AvatarView(avatar, container);

  await avatarView.controller.initializeAudioContext();
  await avatarView.controller.start();

  return avatarView;
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
