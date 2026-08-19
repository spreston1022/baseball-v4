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

export default async function (request: ZuploRequest, context: ZuploContext) {
  let requestedModel = "unknown";
  try {
    const body = await request.clone().json();
    requestedModel = body?.model ?? "unknown";
  } catch {
    // no-op: fall through with "unknown", priced at the default rate
  }

  context.addResponseSendingHook(async (response) => {
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const usage = data?.usage;
      if (!usage) return response;

      const pricing = MODEL_PRICING[requestedModel] ?? DEFAULT_PRICING;
      const promptTokens = usage.prompt_tokens ?? 0;
      const completionTokens = usage.completion_tokens ?? 0;
      const costUsd =
        (promptTokens * pricing.inputPerMillion + completionTokens * pricing.outputPerMillion) / 1_000_000;
      const costCents = Math.ceil(costUsd * 100);

      QuotaInboundPolicy.setMeters(context, { costCents });
      context.log.info(
        { model: requestedModel, promptTokens, completionTokens, costCents },
        "Recorded request cost for quota"
      );
    } catch (e) {
      context.log.warn(`Failed to compute cost for quota metering: ${String(e)}`);
    }
    return response;
  });

  return request;
}
