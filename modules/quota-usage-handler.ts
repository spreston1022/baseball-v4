import { ZuploContext, ZuploRequest, ZoneCache } from "@zuplo/runtime";
import { IDENTITY_HEADER, DAILY_REQUEST_LIMIT, DAILY_TOKEN_LIMIT, CACHE_NAMESPACE, cacheKey, Usage } from "./quota-shared";

export default async function (request: ZuploRequest, context: ZuploContext) {
  const identity = request.headers.get(IDENTITY_HEADER) ?? "anonymous";
  const cache = new ZoneCache<Usage>(CACHE_NAMESPACE, context);
  const raw = await cache.get(cacheKey(identity));
  const usage: Usage = raw && typeof raw === "object" ? raw : { requests: 0, tokens: 0 };

  return new Response(
    JSON.stringify({
      identity,
      requests: usage.requests,
      requestLimit: DAILY_REQUEST_LIMIT,
      requestsRemaining: Math.max(0, DAILY_REQUEST_LIMIT - usage.requests),
      tokens: usage.tokens,
      tokenLimit: DAILY_TOKEN_LIMIT,
      tokensRemaining: Math.max(0, DAILY_TOKEN_LIMIT - usage.tokens),
    }),
    { headers: { "content-type": "application/json" } }
  );
}
