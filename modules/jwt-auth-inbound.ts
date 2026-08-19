import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

const ISSUER = "https://baseball-v4-main-b7f69a7.zuplo.app";
const AUDIENCE = "baseball-ai-gateway";

const JWK = {
  kty: "RSA",
  n: "x2-LjWO9qvRPNZA12ZkMYr30WOtVITZaQRwu9rDjR0yec2m7b7PU8zTBmciYU3ifqcEDdgKa4pckLdna7IBpvihvzF2Rv6U0jwELt3LrL_-f5IVfM4GwBx4LauynQuYMl4tav_gNF3-nLlHZm0Q_QxYJ_gDlWa-dgIPH3YVXMHrhcvOzHnXD58JZ2lAM0E-ir_nv5x98tXHEWaFWWwG-zU6XVCVMCQ7ydNIE8aD6rgw4AclKVwHAgs3v2zue7Ae1bKpu0Y225b_Q-cvjioptC_7h7qJlri452e35AN8NFe-P6ZmqLO_YXVsL-xHK1HU33_reRr5YNn0N3hNkmu3IHQ",
  e: "AQAB",
  alg: "RS256",
  kid: "baseball-worker-key-2",
};

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let cachedKey: CryptoKey | undefined;

async function getVerifyKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    "jwk",
    JWK,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return cachedKey;
}

function unauthorized(detail: string): Response {
  return new Response(
    JSON.stringify({
      type: "https://httpproblems.com/http-status/401",
      title: "Unauthorized",
      status: 401,
      detail,
    }),
    { status: 401, headers: { "content-type": "application/problem+json" } }
  );
}

export default async function (request: ZuploRequest, context: ZuploContext) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized("Missing or malformed Authorization header");
  }
  const token = authHeader.slice("Bearer ".length);
  const parts = token.split(".");
  if (parts.length !== 3) {
    return unauthorized("Malformed JWT");
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  let header: { alg?: string; kid?: string };
  let payload: { iss?: string; aud?: string; exp?: number; sub?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedHeader)));
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)));
  } catch {
    return unauthorized("Malformed JWT");
  }

  if (header.alg !== "RS256" || header.kid !== JWK.kid) {
    return unauthorized("Unrecognized JWT header");
  }
  if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) {
    return unauthorized("Invalid issuer or audience");
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return unauthorized("Expired JWT");
  }

  const key = await getVerifyKey();
  const signedContent = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlToBytes(encodedSignature);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    signedContent
  );
  if (!valid) {
    return unauthorized("Invalid JWT signature");
  }

  context.log.info(`Authenticated request from ${payload.sub}`);
  return request;
}
