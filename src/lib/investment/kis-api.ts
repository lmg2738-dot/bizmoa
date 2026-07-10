import { kisClient, getKisBaseUrl } from "@/lib/axios-client";
import { decrypt, encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { InvestmentStatus, TransactionSource, TransactionType } from "@prisma/client";

const CMA_PRODUCT_CODE = "122630";

interface KisTokenResponse {
  access_token: string;
  access_token_token_expired: string;
  token_type: string;
  expires_in: number;
}

interface KisOrderResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output?: {
    ODNO?: string;
    ORD_TMD?: string;
  };
}

async function getKisAccessToken(
  appKey: string,
  appSecret: string
): Promise<string> {
  const isMock = process.env.KIS_IS_MOCK !== "false";
  const { data } = await kisClient.post<KisTokenResponse>(
    "/oauth2/tokenP",
    {
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!data.access_token) {
    throw new Error("KIS access token issuance failed");
  }

  console.info(
    `[KIS] Token issued (${isMock ? "mock" : "real"}) expires: ${data.access_token_token_expired}`
  );

  return data.access_token;
}

async function generateHashkey(body: Record<string, unknown>): Promise<string> {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("KIS credentials are not configured");
  }

  const { data } = await kisClient.post<{ HASH: string }>(
    "/uapi/hashkey",
    body,
    {
      headers: {
        appkey: appKey,
        appsecret: appSecret,
        "Content-Type": "application/json",
      },
    }
  );

  return data.HASH;
}

function getOrderTrId(): string {
  const isMock = process.env.KIS_IS_MOCK !== "false";
  return isMock ? "VTTC0802U" : "TTTC0802U";
}

async function placeCmaBuyOrder(
  accessToken: string,
  appKey: string,
  appSecret: string,
  accountNumber: string,
  investAmount: number
): Promise<KisOrderResponse> {
  const cano = accountNumber.slice(0, 8);
  const acntPrdtCd = accountNumber.slice(8) || "01";

  const orderBody = {
    CANO: cano,
    ACNT_PRDT_CD: acntPrdtCd,
    PDNO: CMA_PRODUCT_CODE,
    ORD_DVSN: "01",
    ORD_QTY: "0",
    ORD_UNPR: "0",
    ORD_AMT: String(investAmount),
  };

  const hashkey = await generateHashkey(orderBody);

  const { data } = await kisClient.post<KisOrderResponse>(
    "/uapi/domestic-stock/v1/trading/order-cash",
    orderBody,
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        authorization: `Bearer ${accessToken}`,
        appkey: appKey,
        appsecret: appSecret,
        tr_id: getOrderTrId(),
        custtype: "P",
        hashkey,
      },
    }
  );

  if (data.rt_cd !== "0") {
    throw new Error(`KIS order failed: [${data.msg_cd}] ${data.msg1}`);
  }

  console.info(
    `[KIS] Order placed on ${getKisBaseUrl()} orderNo=${data.output?.ODNO ?? "N/A"}`
  );

  return data;
}

export async function executeAutoInvestment(
  userId: string,
  investAmount: number
): Promise<{ success: boolean; orderNo?: string; newBalance: number }> {
  if (investAmount <= 0) {
    throw new Error("Investment amount must be positive");
  }

  const investmentAccount = await prisma.investmentAccount.findFirst({
    where: { userId },
  });

  if (!investmentAccount) {
    throw new Error("Investment account not linked");
  }

  const appKey = decrypt(investmentAccount.appKey);
  const appSecret = decrypt(investmentAccount.appSecret);
  const accountNumber = decrypt(investmentAccount.canoeAccountNumber);

  await prisma.investmentAccount.update({
    where: { id: investmentAccount.id },
    data: { investmentStatus: InvestmentStatus.PENDING },
  });

  try {
    const accessToken = await getKisAccessToken(appKey, appSecret);
    const orderResult = await placeCmaBuyOrder(
      accessToken,
      appKey,
      appSecret,
      accountNumber,
      investAmount
    );

    const newBalance =
      Number(investmentAccount.currentValue) + investAmount;

    await prisma.$transaction([
      prisma.investmentAccount.update({
        where: { id: investmentAccount.id },
        data: {
          currentValue: newBalance,
          investmentStatus: InvestmentStatus.INVESTED,
          lastInvestedAt: new Date(),
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.EXPENSE,
          source: TransactionSource.INVESTMENT,
          amount: investAmount,
          description: `CMA 자동 투자 (${CMA_PRODUCT_CODE})`,
          transactionDate: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      orderNo: orderResult.output?.ODNO,
      newBalance,
    };
  } catch (error) {
    await prisma.investmentAccount.update({
      where: { id: investmentAccount.id },
      data: { investmentStatus: InvestmentStatus.IDLE },
    });
    throw error;
  }
}

export async function linkInvestmentAccount(
  userId: string,
  appKey: string,
  appSecret: string,
  accountNumber: string
) {
  return prisma.investmentAccount.upsert({
    where: { userId },
    create: {
      userId,
      appKey: encrypt(appKey),
      appSecret: encrypt(appSecret),
      canoeAccountNumber: encrypt(accountNumber),
    },
    update: {
      appKey: encrypt(appKey),
      appSecret: encrypt(appSecret),
      canoeAccountNumber: encrypt(accountNumber),
    },
  });
}
