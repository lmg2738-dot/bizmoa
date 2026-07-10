import { openBankingClient } from "@/lib/axios-client";
import { decrypt, encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  user_seq_no?: string;
}

interface BankingTokenResult {
  accessToken: string;
  userSeqNo?: string;
}

function calculateExpiresAt(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

export async function exchangeCodeForToken(
  code: string,
  userId: string,
  bankCode: string,
  bankName: string,
  accountNumber: string
) {
  const clientId = process.env.OPENBANKING_CLIENT_ID;
  const clientSecret = process.env.OPENBANKING_CLIENT_SECRET;
  const redirectUri = process.env.OPENBANKING_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Open Banking credentials are not configured");
  }

  const { data } = await openBankingClient.post<TokenResponse>(
    "/oauth/2.0/token",
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const expiresAt = calculateExpiresAt(data.expires_in);

  const account = await prisma.linkedAccount.upsert({
    where: {
      userId_bankCode_accountNumber: {
        userId,
        bankCode,
        accountNumber,
      },
    },
    create: {
      userId,
      bankCode,
      bankName,
      accountNumber: encrypt(accountNumber),
      accessToken: encrypt(data.access_token),
      refreshToken: encrypt(data.refresh_token),
      expiresAt,
    },
    update: {
      accessToken: encrypt(data.access_token),
      refreshToken: encrypt(data.refresh_token),
      expiresAt,
      isActive: true,
    },
  });

  return { account, userSeqNo: data.user_seq_no };
}

async function refreshBankingToken(
  accountId: string,
  encryptedRefreshToken: string
): Promise<BankingTokenResult> {
  const clientId = process.env.OPENBANKING_CLIENT_ID;
  const clientSecret = process.env.OPENBANKING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Open Banking credentials are not configured");
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  const { data } = await openBankingClient.post<TokenResponse>(
    "/oauth/2.0/token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "client_credentials",
      scope: "oob",
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const expiresAt = calculateExpiresAt(data.expires_in);

  await prisma.linkedAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encrypt(data.access_token),
      refreshToken: encrypt(data.refresh_token),
      expiresAt,
    },
  });

  return { accessToken: data.access_token, userSeqNo: data.user_seq_no };
}

export async function getValidBankingToken(
  accountId: string
): Promise<BankingTokenResult> {
  const account = await prisma.linkedAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.isActive) {
    throw new Error(`Linked account not found: ${accountId}`);
  }

  const bufferMs = 60_000;
  const isExpired =
    account.expiresAt.getTime() - bufferMs <= Date.now();

  if (!isExpired) {
    return { accessToken: decrypt(account.accessToken) };
  }

  console.info(`[OpenBanking] Refreshing token for account ${accountId}`);
  return refreshBankingToken(accountId, account.refreshToken);
}

export function getOpenBankingAuthUrl(state: string): string {
  const clientId = process.env.OPENBANKING_CLIENT_ID;
  const redirectUri = process.env.OPENBANKING_REDIRECT_URI;
  const scope = "login inquiry transfer";
  const authType = "0";

  if (!clientId || !redirectUri) {
    throw new Error("Open Banking credentials are not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    auth_type: authType,
  });

  return `${process.env.OPENBANKING_BASE_URL ?? "https://openapi.openbanking.or.kr"}/oauth/2.0/authorize?${params.toString()}`;
}
