import { type GetQuotaDetailFunction } from "@zuplo/runtime";

export const getQuotaDetail: GetQuotaDetailFunction = async (request) => {
  const sub = request.user?.sub ?? "anonymous";
  return {
    key: `sub:${sub}`,
    allowances: {},
  };
};
