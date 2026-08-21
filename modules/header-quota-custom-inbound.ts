import { ZuploContext, ZuploRequest, ZoneCache } from "@zuplo/runtime";

const IDENTITY_HEADER = "x-user-sub";
const DAILY_REQUEST_LIMIT = 4;
const DAILY_TOKEN_LIMIT = 1000;
const TTL_SECONDS = 86400;

interface Usage {
  requests: number;
  tokens: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function quotaExceeded(identity: string, meter: string): Response {
  return new Response(
    JSON.stringify({
      type: "https://httpproblems.com/http-status/429",
      title: "Too Many Requests",
      status: 429,
      detail: `Daily ${meter} quota exceeded for '${identity}'`,
    }),
    { status: 429, headers: { "content-type": "application/problem+json" } }
  );
}

export default async function (request: ZuploRequest, context: ZuploContext) {
  const identity = request.headers.get(IDENTITY_HEADER) ?? "anonymous";
  const cache = new ZoneCache<Usage>("baseball-header-quota", context);
  const key = `${identity}:${todayKey()}`;

  const raw = await cache.get(key);
  const current: Usage = raw && typeof raw === "object" ? raw : { requests: 0, tokens: 0 };

  if (current.requests >= DAILY_REQUEST_LIMIT) {
    return quotaExceeded(identity, "requests");
  }
  if (current.tokens >= DAILY_TOKEN_LIMIT) {
    return quotaExceeded(identity, "tokens");
  }

  const afterRequest: Usage = { requests: current.requests + 1, tokens: current.tokens };
  await cache.put(key, afterRequest, TTL_SECONDS);
  context.log.info(
    { identity, ...afterRequest, requestLimit: DAILY_REQUEST_LIMIT, tokenLimit: DAILY_TOKEN_LIMIT },
    "header quota incremented"
  );

  context.addResponseSendingHook(async (response) => {
    if (!response.ok) return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      context.log.info("header-quota: skipping streamed response, no buffered usage to read");
      return response;
    }
    try {
      const body = await response.clone().json();
      const totalTokens = body?.usage?.total_tokens;
      if (typeof totalTokens === "number") {
        const latest = (await cache.get(key)) ?? afterRequest;
        const updated: Usage = { requests: latest.requests, tokens: latest.tokens + totalTokens };
        await cache.put(key, updated, TTL_SECONDS);
        context.log.info({ identity, totalTokens, ...updated }, "header quota: recorded actual token usage");
      }
    } catch (e) {
      context.log.warn(`header-quota: failed to read response body for tokens: ${String(e)}`);
    }
    return response;
  });

  return request;
}
