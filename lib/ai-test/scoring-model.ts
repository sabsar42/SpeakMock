const DEFAULT_MODELS = ["google/gemma-4-31b-it:free"];

/** Picks one OpenRouter model at random from OPENROUTER_MODELS (comma-separated). */
export function pickScoringModel(): string {
  const raw = process.env.OPENROUTER_MODELS;
  const models = raw
    ? raw.split(",").map((m) => m.trim()).filter(Boolean)
    : DEFAULT_MODELS;
  return models[Math.floor(Math.random() * models.length)];
}
