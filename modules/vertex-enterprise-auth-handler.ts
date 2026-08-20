import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

// DEMO ONLY: these are locally-generated mock service-account keys, not real
// GCP credentials. They are not registered with Google, so the real token
// exchange below will be rejected by Google - that rejection is itself proof
// the mechanics (JWT construction, signing, and the live call to Google's
// token endpoint) are genuine, not simulated.

type EnterpriseAccount = {
  displayName: string;
  gcpProjectId: string;
  clientEmail: string;
  privateKeyPem: string;
};

const ENTERPRISE_ACCOUNTS: Record<string, EnterpriseAccount> = {
  "acme-corp": {
    displayName: "Acme Corp",
    gcpProjectId: "acme-corp-demo-project",
    clientEmail: "vertex-gateway@acme-corp-demo-project.iam.gserviceaccount.com",
    privateKeyPem: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDwvqlKEB0ps6nV
mcvD3eMR8xmEGAKG4xTLBQ/6pY+XUIRE5dre/3A+Pa+JVbklwJ1ONaPhYS4rJI7k
zGcDgJ0/+na14QNjh0hQlJG0tNrI1zBTCkxsy5AtPlcl7dlszVXrQqg+BGRUTM9g
1mQEt1jfyvBCVGI12aF3BtM0+lt6bZwfnDs9HIqJ1q51Tlv8BIOs9nMykwACCvQ0
cdcYQgc52LX9NNuMYmVr/bEs/qYj8pJYuAu4NoujgOD6PwnBNKVmU9TJ8Yr3kAOs
Iu/Oumfa4G+iCRfERpQ92A9JBGtI2Gm138sQ8DbffrXV3P+uG8oLN4uFdN0yx/W3
ICBAKcArAgMBAAECggEBAJJtFOB0Ppifqzu86F/AdJz1RF7Aj8DlGz+EW7yyuExr
b5fMSjx6FxX0RPD+D7ezmLn6DCxIBGG/QZ5N6JYLwxknyM5FBt+hZ82DH8BOhAfG
QqEvUV6WzaGHGlB6g1UW6xxFlbjqyO8xLK0UmQ75SXgMoedmFbn1Ha0cnJfLcppa
JKTR6JCtvYQP+4HkjvJLAfwqBkSjVz4dz4iAdznM/SI5aAQiZPMj6k2L0esNJp30
cn2I8mhbOy1LW8koaIiirSojWSJjZBZkQ0BMtFpo4EYbLPwv9/geuAHfzxd/19Dy
laA+6pzeU3wsPyt3KJG7Z0VO7Aui38H5YJf1GbcyCzECgYEA/CeSdrFFmFzOz2hd
PM5RNHfLnMsjSV6bm8sQm+6rLp4w/6sMgPXBrHzP5Z4F8IdXRDTK0btjyESxC4F2
wDQ0t+WjD1EaQvZTI2tgq2MkYGPmSMqFdIua0rUVXuluQdL4u8dbdkTwR0ZtS2Zm
sFx58iv4PKb5+HvOvzI7q47Et4MCgYEA9GqLZlcFQY6Ya9DSeBcMmNuTcQK7BBAc
8V62XFT/Dhkf3aQsplykPtLk6wqgWnI+oNp9t1fFpTbV/gtw8HkTivQTtjvLHuqO
76z+lNvq1oBJYHkwnyfNLu9BZSPvvq2L1rvZB5h3q91tzHEaqcPcFlS5HIpKWDb0
4XQPvOj2TDkCgYBETBegrH1UOncNuI/gg2V9V6E/08m3+rcdKJBUG/4jv1c4OMVH
PMl7hcbtw7KKJq5dXAs/aYkqWmi13BglET7iPIHBCU+aqYt1QYVKhqz4qrZaKvig
y5tgzQl/zqw9if4zJllAnIWUWKAL1y2jQTkKfhxbmUKFqksigGGnIyFnLwKBgQC5
VpGeaR5zN84c85yls9S5lMeZSpjF2/IWldty6IEAD806JOQ2wslJWmJ8WPJ/o2Ia
V5Q9EzGstohOvB5IO4e2Np878Nt19ietV2E1QA4z2dPKdBuKlIPis0rDhxylWrRP
gOJyAAu/J4m7HYk6cmrSBCzal4MIoaPP0lKczYr3AQKBgDQBVFYTzmCtR95In5ea
lXT1Gg+10FeyBp4GKdSyJnbci/st4WMw1Ff4jja4nYNvCkdMD42NNtQinh910nBJ
WJ2b7WhgBj34/sDM3op/jZ48AFbDYqxu+zhiGWGvc/Ko/cnd8A08L7Rhe9mSOirh
9bNaKdcEbX9kW+74QshArdl/
-----END PRIVATE KEY-----`,
  },
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
  },
};

// Maps a caller's identity (the same x-user-sub header used elsewhere in
// this gateway) to which enterprise's Vertex AI account should be used to
// service their request.
const CALLER_TO_ENTERPRISE: Record<string, string> = {
  "alice@acme-corp.com": "acme-corp",
  "bob@globex-corp.com": "globex-corp",
};

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
  const callerSub = request.headers.get("x-user-sub") ?? "anonymous";
  const enterpriseKey = CALLER_TO_ENTERPRISE[callerSub];
  const account = enterpriseKey ? ENTERPRISE_ACCOUNTS[enterpriseKey] : undefined;

  if (!account) {
    context.log.warn({ callerSub }, "vertex-enterprise-auth: no enterprise account mapped for this caller");
    return new Response(
      JSON.stringify({
        error: `No enterprise Vertex AI account is configured for caller '${callerSub}'`,
        knownCallers: Object.keys(CALLER_TO_ENTERPRISE),
      }),
      { status: 404, headers: { "content-type": "application/json" } }
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
      note:
        "This service account is a locally-generated demo credential and is not registered with Google, so the token exchange above is expected to be rejected by Google. The signed JWT and the live call to Google's real OAuth2 token endpoint are genuine - only the credential's validity is mocked.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
