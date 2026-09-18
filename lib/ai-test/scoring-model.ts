const DEFAULT_MODELS = ["google/gemma-4-31b-it:free"];

function allScoringModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS;
  return raw ? raw.split(",").map((m) => m.trim()).filter(Boolean) : DEFAULT_MODELS;
}

/** Picks one OpenRouter model at random from OPENROUTER_MODELS (comma-separated). */
export function pickScoringModel(): string {
  const models = allScoringModels();
  return models[Math.floor(Math.random() * models.length)];
}

/**
 * Returns every configured model in a random order, for trying multiple in
 * sequence within one request. Free-tier models are frequently and
 * individually rate-limited upstream (a single model failing is normal, not
 * a sign the whole rotation is broken), so a request should only fail once
 * every model in the list has been tried.
 */
export function scoringModelFallbackOrder(): string[] {
  const models = [...allScoringModels()];
  for (let i = models.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [models[i], models[j]] = [models[j], models[i]];
  }
  return models;
}
