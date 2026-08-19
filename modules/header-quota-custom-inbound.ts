import { ZuploContext, ZuploRequest, ZoneCache } from "@zuplo/runtime";

const IDENTITY_HEADER = "x-user-sub";
const DAILY_LIMIT = 4;
const TTL_SECONDS = 86400;

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function quotaExceeded(identity: string): Response {
  return new Response(
    JSON.stringify({
      type: "https://httpproblems.com/http-status/429",
      title: "Too Many Requests",
      status: 429,
      detail: `Daily quota exceeded for '${identity}'`,
    }),
    { status: 429, headers: { "content-type": "application/problem+json" } }
  );
}

export default async function (request: ZuploRequest, context: ZuploContext) {
  const identity = request.headers.get(IDENTITY_HEADER) ?? "anonymous";
  const cache = new ZoneCache<number>("baseball-header-quota", context);
  const key = `${identity}:${todayKey()}`;

  const current = (await cache.get(key)) ?? 0;
  if (current >= DAILY_LIMIT) {
    return quotaExceeded(identity);
  }

  await cache.put(key, current + 1, TTL_SECONDS);
  context.log.info({ identity, count: current + 1, limit: DAILY_LIMIT }, "header quota incremented");
  return request;
}
