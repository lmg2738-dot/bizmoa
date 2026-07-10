import type { KeximDataType, KeximRawRow } from "@/lib/kexim/types";

const KEXIM_BASE_URL =
  process.env.KEXIM_API_BASE_URL ??
  "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON";

function formatSearchDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function parseNumber(value?: string | null): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, ""));
}

export async function fetchKeximData(
  authKey: string,
  dataType: KeximDataType,
  searchDate?: string
): Promise<{ rows: KeximRawRow[]; searchDate: string }> {
  if (!authKey) {
    throw new Error(`KEXIM API key for ${dataType} is not configured`);
  }

  const datesToTry: string[] = [];
  if (searchDate) {
    datesToTry.push(searchDate);
  } else {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      datesToTry.push(formatSearchDate(d));
    }
  }

  let lastRows: KeximRawRow[] = [];
  let usedDate = datesToTry[0];

  for (const date of datesToTry) {
    const url = new URL(KEXIM_BASE_URL);
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("searchdate", date);
    url.searchParams.set("data", dataType);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`KEXIM API failed (${dataType}): ${res.status}`);
    }

    const rows = (await res.json()) as KeximRawRow[];
    lastRows = rows;
    usedDate = date;

    const hasValid = rows.some((row) => row.result === 1 && row.cur_unit);
    if (hasValid) {
      return { rows, searchDate: usedDate };
    }
  }

  return { rows: lastRows, searchDate: usedDate };
}

export function pickFxRates(rows: KeximRawRow[]): Array<{
  currency: string;
  label: string;
  rate: number;
  buyRate: number;
  sellRate: number;
}> {
  const targets = ["USD", "EUR", "JPY(100)", "CNH"];
  const picked: Array<{
    currency: string;
    label: string;
    rate: number;
    buyRate: number;
    sellRate: number;
  }> = [];

  for (const code of targets) {
    const row = rows.find((r) => r.result === 1 && r.cur_unit === code);
    if (!row) continue;

    picked.push({
      currency: code,
      label: row.cur_nm ?? code,
      rate: parseNumber(row.deal_bas_r ?? row.kftc_deal_bas_r),
      buyRate: parseNumber(row.ttb),
      sellRate: parseNumber(row.tts),
    });
  }

  if (picked.length === 0) {
    const usd = rows.find((r) => r.result === 1 && r.cur_unit === "USD");
    if (usd) {
      picked.push({
        currency: "USD",
        label: usd.cur_nm ?? "미국 달러",
        rate: parseNumber(usd.deal_bas_r),
        buyRate: parseNumber(usd.ttb),
        sellRate: parseNumber(usd.tts),
      });
    }
  }

  return picked;
}

export function pickRateIndicators(
  rows: KeximRawRow[],
  prefix: string
): Array<{ label: string; value: string }> {
  return rows
    .filter((row) => row.result === 1)
    .slice(0, 5)
    .map((row) => {
      const label =
        (row.cur_nm as string | undefined) ??
        (row.cur_unit as string | undefined) ??
        "금리";
      const value =
        row.deal_bas_r ??
        row.bkpr ??
        row.yy_efee_r ??
        row.ten_dd_efee_r ??
        "-";

      return {
        label: `${prefix} ${label}`.trim(),
        value: String(value).includes("%") ? String(value) : `${value}%`,
      };
    });
}

export { parseNumber };
