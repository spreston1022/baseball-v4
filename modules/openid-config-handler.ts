import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

const ISSUER = "https://baseball-v4-main-b7f69a7.zuplo.app";

const OPENID_CONFIG = {
  issuer: ISSUER,
  jwks_uri: `${ISSUER}/.well-known/jwks.json`,
  id_token_signing_alg_values_supported: ["RS256"],
  response_types_supported: ["id_token"],
  subject_types_supported: ["public"],
};

export default async function (request: ZuploRequest, context: ZuploContext) {
  return new Response(JSON.stringify(OPENID_CONFIG), {
    headers: { "content-type": "application/json" },
  });
}
