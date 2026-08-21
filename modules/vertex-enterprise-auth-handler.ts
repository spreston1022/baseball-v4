import { ZuploContext, ZuploRequest, environment } from "@zuplo/runtime";

// Real enterprise accounts load their credential from environment variables
// using a generic, predictable naming scheme derived from the account's key
// (see envVarPrefix/loadRealAccount below) - never hardcoded, since this
// repo is public. Onboarding a new real customer is "add one line to
// REAL_ENTERPRISE_ACCOUNT_KEYS, add a domain line below, and set three env
// vars" - no new TypeScript required.
//
// "globex-corp" remains a locally-generated mock, deliberately not
// registered with Google, kept as a fixed contrast case: its token exchange
// is expected to be rejected, proving the rejection path is genuine and not
// just an artifact of bad code.

type EnterpriseAccount = {
  displayName: string;
  gcpProjectId: string;
  clientEmail: string;
  privateKeyPem: string;
  isRealAccount: boolean;
};

// key -> human-readable display name. Add an entry here (and a matching
// domain in DOMAIN_TO_ENTERPRISE below) to onboard a new real customer.
const REAL_ENTERPRISE_ACCOUNTS: Record<string, string> = {
  "acme-corp": "Acme Corp",
};

function envVarPrefix(enterpriseKey: string): string {
  return "VERTEX_" + enterpriseKey.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function loadRealAccount(enterpriseKey: string, displayName: string): EnterpriseAccount {
  const prefix = envVarPrefix(enterpriseKey);
  const env = environment as Record<string, string | undefined>;
  return {
    displayName,
    gcpProjectId: (env[`${prefix}_PROJECT_ID`] ?? "").trim(),
    clientEmail: (env[`${prefix}_CLIENT_EMAIL`] ?? "").trim(),
    privateKeyPem: (env[`${prefix}_PRIVATE_KEY_PEM`] ?? "").trim().replace(/\\n/g, "\n"),
    isRealAccount: true,
  };
}

const ENTERPRISE_ACCOUNTS: Record<string, EnterpriseAccount> = {
  ...Object.fromEntries(
    Object.entries(REAL_ENTERPRISE_ACCOUNTS).map(([key, displayName]) => [key, loadRealAccount(key, displayName)])
  ),
  "globex-corp": {
    displayName: "Globex Corp",
    gcpProjectId: "globex-corp-demo-project",
    clientEmail: "vertex-gateway@globex-corp-demo-project.iam.gserviceaccount.com",
    privateKeyPem: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDgA1YRy6Zi2xWa
oo0mBUQb6CTQQogKJoRRiGpWFuyyHcqqzEPhqqiYNWmsG8LKErzPbOfA0XsR61+v
C8aYhe2oGE5jgx7sqRz6Acm2tnx5ey3Cf1Qjfq852knTp35UhP6qJuZNEZy41fTE
/bR+Nkdj1sS95n6Ztx17YmUKpA0z31I/xAnQvOuSqgrI2OZoNVXZbsYYC45R9UN1
J8peYQkcNsnnVUPjfHFS5yI8EUrO1C0Vlem4ShkWYCxCLT4M97xrkuZGkCQFZ26d
ES7KBSnRwzcbCcY6YY4KX63P0lsJN7Brs0wL6h9XhdLvWQ+dTKOJnKe+pLQoWRSG
Gvs6xBTbAgMBAAECggEAUQCj1NeBGOoDy+DPjVoGINk2xp/oNVNsMVdUrECp4lZn
fI9UVHuzbyaRSYzYSN2xrIfC3bRh/j7QYKmvbGOxZkEzx0QYoJceRUD0Qb+HDx59
k4EbWaJrlk3auFAunD1jIP/j8yZVN3kWg00CQUk7U1zL06dPTCIs5PrVcp2TsJd5
Ia29ev/Cc1XJTv5ePWkO8KSzPOJKHC95o8BDYECj1n8R0DUC/2KNdLG11TKkit0P
XqQ5ftS6OJ8mPtgBoj0lhbhHvMb/8p9at4y928x0+MjONsEmzwEc8YJ7vw19QG7s
uILfzuwpXN+xfosNzQNcLRir7CWfYG0p95w1ONezgQKBgQDyBXAyhsBvgTP5YO0A
uLrAxA5R69Rz2FYu6Ud2SVYhTLzl63cYDPopDEDQ203gOaBaxSPvUlVVh/i434Ey
Z8hEjjp1CcEd29QSfZBSDTmI3nHM4+5gNBw/E7tsqUdWsX3QcZwDNvmg2dp2UPHD
3Hr0WjApp1rbgNtg1/itsN6PYQKBgQDs86A5dH3tZbKDK6V+gF2QEwaT1C3eBMNs
DklLwjVFt0pE9K+e4Z5swPGxVqWgJb7ZNaM3AtQ8mHqa7Etg8J9SJ3mct6Xbu985
DE1coml9VOk+1jbto34b7NxT+URMw57bHzEDSW9bU/tGg5ts8CS+U1gWEx+iiF+q
mQCRdDz5uwKBgFuFYPNKb9T6x/vDAnzmXoDs4vlps/KG2bhtsP9zJiX7jedoTqYC
qksBfjU86Uskn5YTvM4QlYJ9o7nNk17LTjlWi5actLGk4qKHZx8QLzSp4eD4RLmO
myvjO1oQ/ZA0GH7Np5CzplyEZY+edn55jul+fX4S8lHVfaA2q6yLGO6hAoGAOqTh
Vtb6A7NTxxsaToC+p1XOHvA4meZb53ZxtYpPXP3MJ9zXSl9Usl3ec6GaRFSTM3cO
+iJ9HLIwRf+NeGSVSePzOVJKfmO1D4136CFaMma9g4vI9G+uWoL41N+wg782pczG
eKXIJbZXTlBsOz4EGgbOmkgJYFSYOMS9W0KFhNkCgYBOmG8zw010IuIAxEMzcHZM
WYcSBhaSiobQBXeIw50P5TacWi7KT+17lQgTR4xq/PCMsVtBnNDCLgfQUVLz4vi6
QcWYmTRGPlA6S8Z07BO/23AZXDgs0aV0GMpSJGmuX6SQPNQ4tY+lIkSl7iUt/Mq4
3KRGEBcqimiEEhJNtiompA==
-----END PRIVATE KEY-----`,
    isRealAccount: false,
  },
};

// Keyed by ORGANIZATION (email domain), not by individual employee - this is
// what makes onboarding scale with the number of enterprise customers rather
// than the number of employees across all of them. Any caller from
// @acme-corp.com resolves to Acme's account automatically, with no change
// needed when Acme hires someone new.
//
// This still models what a real deployment would look like: in production,
// the domain (or a proper org_id claim) would come from a token already
// verified by the enterprise customer's own IdP (Okta, Google Workspace,
// Entra ID), not a raw unverified header - and the domain-to-account map
// itself would live in a real data store / Zuplo Consumer metadata, not
// source code (Zuplo's AI Gateway project type doesn't yet expose Consumer
// management, so this map stands in for that until it does).
const DOMAIN_TO_ENTERPRISE: Record<string, string> = {
  "acme-corp.com": "acme-corp",
  "globex-corp.com": "globex-corp",
  "zuplo.com": "acme-corp",
};

function resolveEnterpriseKey(callerSub: string): string | undefined {
  const domain = callerSub.split("@")[1]?.toLowerCase();
  return domain ? DOMAIN_TO_ENTERPRISE[domain] : undefined;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const VERTEX_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signGoogleServiceAccountJwt(account: EnterpriseAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: account.clientEmail,
    scope: VERTEX_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(account.privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const unsigned =
    base64UrlEncode(encoder.encode(JSON.stringify(header))) +
    "." +
    base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(unsigned));
  return unsigned + "." + base64UrlEncode(new Uint8Array(signature));
}

export default async function (request: ZuploRequest, context: ZuploContext) {
  // callerSub stands in for a claim a real IdP would have already verified
  // (see DOMAIN_TO_ENTERPRISE above for why resolution is domain-based).
  const callerSub = request.headers.get("x-user-sub") ?? "anonymous";
  const enterpriseKey = resolveEnterpriseKey(callerSub);
  const account = enterpriseKey ? ENTERPRISE_ACCOUNTS[enterpriseKey] : undefined;

  if (!account) {
    context.log.warn({ callerSub }, "vertex-enterprise-auth: caller's domain has no enterprise account mapped");
    return new Response(
      JSON.stringify({
        error: `No enterprise Vertex AI account is configured for caller '${callerSub}'`,
        knownDomains: Object.keys(DOMAIN_TO_ENTERPRISE),
      }),
      { status: 404, headers: { "content-type": "application/json" } }
    );
  }

  if (account.isRealAccount && (!account.clientEmail || !account.privateKeyPem || !account.gcpProjectId)) {
    const prefix = envVarPrefix(enterpriseKey as string);
    context.log.error({ enterpriseKey, prefix }, "vertex-enterprise-auth: real account is missing required environment variables");
    return new Response(
      JSON.stringify({
        error: `This enterprise account is configured to use a real GCP service account, but ${prefix}_CLIENT_EMAIL / ${prefix}_PRIVATE_KEY_PEM / ${prefix}_PROJECT_ID are not set in the project's environment variables.`,
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  context.log.info(
    { callerSub, enterpriseAccount: account.displayName, gcpProjectId: account.gcpProjectId },
    "vertex-enterprise-auth: resolved caller to enterprise Vertex AI account"
  );

  const assertion = await signGoogleServiceAccountJwt(account);

  const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const tokenBody = await tokenResp.json();

  context.log.info(
    { callerSub, enterpriseAccount: account.displayName, googleStatus: tokenResp.status, googleResponse: tokenBody },
    "vertex-enterprise-auth: Google token endpoint responded"
  );

  return new Response(
    JSON.stringify({
      callerSub,
      resolvedEnterpriseAccount: {
        displayName: account.displayName,
        gcpProjectId: account.gcpProjectId,
        serviceAccountEmail: account.clientEmail,
      },
      googleTokenExchange: {
        endpoint: GOOGLE_TOKEN_URL,
        httpStatus: tokenResp.status,
        response: tokenBody,
      },
      note: account.isRealAccount
        ? "This is a real, registered GCP service account. The access_token above (if present) is a genuine, usable Google OAuth2 token for this enterprise's Vertex AI project."
        : "This service account is a locally-generated demo credential and is not registered with Google, so the token exchange above is expected to be rejected by Google. The signed JWT and the live call to Google's real OAuth2 token endpoint are genuine - only the credential's validity is mocked.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
