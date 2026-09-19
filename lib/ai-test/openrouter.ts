import OpenAI from "openai";

export function createOpenRouterClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "SpeakMock",
    },
    // The SDK retries failed/timed-out requests twice by default, which
    // stacks with our own across-model fallback (scoringModelFallbackOrder):
    // a single stuck model could otherwise consume 3x its timeout before the
    // caller's loop even sees the failure. Callers already retry via other
    // models, so the SDK's own retry is disabled here.
    maxRetries: 0,
  });
}
