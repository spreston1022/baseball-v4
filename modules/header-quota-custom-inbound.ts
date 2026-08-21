import { ZuploContext, ZuploRequest, ZoneCache } from "@zuplo/runtime";
import {
  IDENTITY_HEADER,
  DAILY_REQUEST_LIMIT,
  DAILY_TOKEN_LIMIT,
  TTL_SECONDS,
  CACHE_NAMESPACE,
  cacheKey,
  Usage,
} from "./quota-shared";

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
  const cache = new ZoneCache<Usage>(CACHE_NAMESPACE, context);
  const key = cacheKey(identity);

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
