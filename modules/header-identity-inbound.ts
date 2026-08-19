import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

const IDENTITY_HEADER = "x-user-sub";

export default async function (request: ZuploRequest, context: ZuploContext) {
  const sub = request.headers.get(IDENTITY_HEADER) ?? "anonymous";
  request.user = { sub, data: {} };
  return request;
}
