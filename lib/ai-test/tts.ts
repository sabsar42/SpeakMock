import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = process.env.GROQ_TTS_VOICE ?? "troy";
const SIMLI_SAMPLE_RATE = 16000;

/**
 * Generates speech audio for the given text via Groq TTS and returns raw
 * PCM16 mono samples at 16kHz — the exact format Simli's sendAudioData
 * expects. Strips the WAV header Groq returns and resamples if the source
 * isn't already 16kHz (Orpheus's sample_rate isn't configurable per-request).
 */
export async function textToPcm16(text: string): Promise<Uint8Array> {
  const response = await groq.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: "wav",
  });

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const sourceSampleRate = readWavSampleRate(bytes);
  const dataChunkOffset = findDataChunkOffset(bytes);
  const pcm = bytes.slice(dataChunkOffset);

  if (sourceSampleRate === SIMLI_SAMPLE_RATE) return pcm;
  return resamplePcm16(pcm, sourceSampleRate, SIMLI_SAMPLE_RATE);
}

function readWavSampleRate(bytes: Uint8Array): number {
  // Sample rate is a 4-byte little-endian value at offset 24 in the "fmt "
  // subchunk of a canonical WAV header.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(24, true);
}

function resamplePcm16(pcm: Uint8Array, fromRate: number, toRate: number): Uint8Array {
  const inputSamples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 2);
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(inputSamples.length / ratio);
  const output = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    output[i] = inputSamples[Math.floor(i * ratio)];
  }

  return new Uint8Array(output.buffer);
}

function findDataChunkOffset(bytes: Uint8Array): number {
  // Search for the "data" subchunk id instead of assuming a fixed 44-byte
  // header, since WAV files can carry extra metadata chunks before it.
  for (let i = 12; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 0x64 && // d
      bytes[i + 1] === 0x61 && // a
      bytes[i + 2] === 0x74 && // t
      bytes[i + 3] === 0x61 // a
    ) {
      return i + 8; // skip "data" tag + 4-byte chunk size
    }
  }
  return 44; // fallback to the canonical header size
}
