import { ZuploContext, ZuploRequest, QuotaInboundPolicy } from "@zuplo/runtime";

// Approximate proxy rates (USD per 1M tokens) - these gateway model names
// aren't real published SKUs, so we stand in with comparable real-world
// flagship pricing (GPT-4o / Claude Opus) as of mid-2026. Adjust if/when
// real invoiced rates are known.
const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "openai/gpt-5.2": { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  "openai/gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "anthropic/claude-opus-4-5": { inputPerMillion: 5.0, outputPerMillion: 25.0 },
};
const DEFAULT_PRICING = MODEL_PRICING["openai/gpt-5.2"];
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 500;

export default async function (request: ZuploRequest, context: ZuploContext) {
  let requestedModel = "unknown";
  let promptChars = 0;
  let maxTokens = DEFAULT_MAX_TOKENS;
  try {
    const body = await request.clone().json();
    requestedModel = body?.model ?? "unknown";
    promptChars = JSON.stringify(body?.messages ?? "").length;
    maxTokens = body?.max_tokens ?? body?.max_completion_tokens ?? DEFAULT_MAX_TOKENS;
  } catch {
    // no-op: fall through with defaults, priced at the default rate
  }

  const pricing = MODEL_PRICING[requestedModel] ?? DEFAULT_PRICING;
  const promptTokensEstimate = Math.ceil(promptChars / CHARS_PER_TOKEN);
  const costUsd = (promptTokensEstimate * pricing.inputPerMillion + maxTokens * pricing.outputPerMillion) / 1_000_000;
  const costCents = Math.max(1, Math.ceil(costUsd * 100));

  QuotaInboundPolicy.setMeters(context, { costCents });
  context.addResponseSendingHook(async (response) => {
    const headers = new Headers(response.headers);
    headers.set(
      "x-quota-debug",
      `prepaid:model=${requestedModel},promptTokensEstimate=${promptTokensEstimate},maxTokens=${maxTokens},costCents=${costCents}`
    );
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  });

  return request;
}
