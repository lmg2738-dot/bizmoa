import axios, { AxiosInstance } from "axios";
import https from "https";

const rejectUnauthorized = process.env.REJECT_UNAUTHORIZED !== "false";

export function createAxiosClient(baseURL?: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 30000,
    httpsAgent: new https.Agent({
      rejectUnauthorized,
    }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
}

export const openBankingClient = createAxiosClient(
  process.env.OPENBANKING_BASE_URL ?? "https://openapi.openbanking.or.kr"
);

export function getKisBaseUrl(): string {
  const isMock = process.env.KIS_IS_MOCK !== "false";
  return isMock
    ? (process.env.KIS_MOCK_BASE_URL ??
        "https://openapivts.koreainvestment.com:29443")
    : (process.env.KIS_REAL_BASE_URL ??
        "https://openapi.koreainvestment.com:9443");
}

export const kisClient = createAxiosClient(getKisBaseUrl());
