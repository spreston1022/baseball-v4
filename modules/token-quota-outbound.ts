import { ZuploContext, ZuploRequest, QuotaInboundPolicy } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  context.addResponseSendingHook(async (response) => {
    if (!response.ok) return response;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      context.log.info("token-quota-outbound: skipping streamed response, no buffered usage to read");
      return response;
    }

    try {
      const body = await response.clone().json();
      const totalTokens = body?.usage?.total_tokens;
      if (typeof totalTokens === "number") {
        QuotaInboundPolicy.setMeters(context, { tokens: totalTokens });
        context.log.info({ totalTokens }, "token-quota-outbound: recorded actual token usage");
      }
    } catch (e) {
      context.log.warn(`token-quota-outbound: failed to read response body: ${String(e)}`);
    }

    return response;
  });

  return request;
}
