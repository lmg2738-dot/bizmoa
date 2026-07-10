export type KeximDataType = "AP01" | "AP02" | "AP03";

export interface KeximRawRow {
  result: number;
  cur_unit?: string | null;
  cur_nm?: string | null;
  ttb?: string | null;
  tts?: string | null;
  deal_bas_r?: string | null;
  bkpr?: string | null;
  yy_efee_r?: string | null;
  ten_dd_efee_r?: string | null;
  kftc_bkpr?: string | null;
  kftc_deal_bas_r?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface FxRateItem {
  currency: string;
  label: string;
  rate: number;
  buyRate: number;
  sellRate: number;
  change: number;
}

export interface MacroIndicator {
  label: string;
  value: string;
  updatedAt: string;
}

export interface MarketOverview {
  fxRates: FxRateItem[];
  macroIndicators: MacroIndicator[];
  searchDate: string;
  fetchedAt: string;
}
