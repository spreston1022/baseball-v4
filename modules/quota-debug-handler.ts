import { ZuploContext, ZuploRequest, QuotaInboundPolicy } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  const usage = QuotaInboundPolicy.getUsage(context, "baseball-quota-inbound");
  return new Response(JSON.stringify({ usage }), {
    headers: { "content-type": "application/json" },
  });
}
