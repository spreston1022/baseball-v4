import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

const JWKS = {
  keys: [
    {
      kty: "RSA",
      n: "x2-LjWO9qvRPNZA12ZkMYr30WOtVITZaQRwu9rDjR0yec2m7b7PU8zTBmciYU3ifqcEDdgKa4pckLdna7IBpvihvzF2Rv6U0jwELt3LrL_-f5IVfM4GwBx4LauynQuYMl4tav_gNF3-nLlHZm0Q_QxYJ_gDlWa-dgIPH3YVXMHrhcvOzHnXD58JZ2lAM0E-ir_nv5x98tXHEWaFWWwG-zU6XVCVMCQ7ydNIE8aD6rgw4AclKVwHAgs3v2zue7Ae1bKpu0Y225b_Q-cvjioptC_7h7qJlri452e35AN8NFe-P6ZmqLO_YXVsL-xHK1HU33_reRr5YNn0N3hNkmu3IHQ",
      e: "AQAB",
      alg: "RS256",
      use: "sig",
      kid: "baseball-worker-key-2",
    },
  ],
};

export default async function (request: ZuploRequest, context: ZuploContext) {
  return new Response(JSON.stringify(JWKS), {
    headers: { "content-type": "application/json" },
  });
}
