export const IDENTITY_HEADER = "x-user-sub";
export const DAILY_REQUEST_LIMIT = 50;
export const DAILY_TOKEN_LIMIT = 100000;
export const TTL_SECONDS = 86400;
export const CACHE_NAMESPACE = "baseball-header-quota";

export interface Usage {
  requests: number;
  tokens: number;
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export function cacheKey(identity: string): string {
  return `${identity}:${todayKey()}`;
}
