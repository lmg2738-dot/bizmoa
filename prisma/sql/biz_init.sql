-- =============================================
-- BizMoa 테이블 생성 (biz_ 접두사)
-- Supabase SQL Editor에서 실행
-- =============================================

-- 기존 비즈모아 테이블이 있다면 제거 (최초 1회)
-- DROP TABLE IF EXISTS biz_pg_settlements CASCADE;
-- DROP TABLE IF EXISTS biz_transactions CASCADE;
-- DROP TABLE IF EXISTS biz_investment_accounts CASCADE;
-- DROP TABLE IF EXISTS biz_linked_accounts CASCADE;
-- DROP TABLE IF EXISTS biz_users CASCADE;
-- DROP TYPE IF EXISTS biz_investment_status CASCADE;
-- DROP TYPE IF EXISTS biz_transaction_source CASCADE;
-- DROP TYPE IF EXISTS biz_transaction_type CASCADE;

-- 1) ENUM 타입
CREATE TYPE biz_transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE biz_transaction_source AS ENUM ('BANK', 'PG', 'INVESTMENT', 'TRANSFER');
CREATE TYPE biz_investment_status AS ENUM ('IDLE', 'INVESTED', 'PENDING');

-- 2) biz_users
CREATE TABLE biz_users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  business_name   TEXT NOT NULL,
  business_number TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) biz_linked_accounts
CREATE TABLE biz_linked_accounts (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  bank_code      TEXT NOT NULL,
  bank_name      TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_alias  TEXT,
  balance        NUMERIC(18, 2) NOT NULL DEFAULT 0,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, bank_code, account_number)
);

-- 4) biz_investment_accounts
CREATE TABLE biz_investment_accounts (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL UNIQUE REFERENCES biz_users(id) ON DELETE CASCADE,
  app_key              TEXT NOT NULL,
  app_secret           TEXT NOT NULL,
  canoe_account_number TEXT NOT NULL,
  current_value        NUMERIC(18, 2) NOT NULL DEFAULT 0,
  investment_status    biz_investment_status NOT NULL DEFAULT 'IDLE',
  last_invested_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) biz_transactions
CREATE TABLE biz_transactions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  account_id       TEXT REFERENCES biz_linked_accounts(id) ON DELETE SET NULL,
  type             biz_transaction_type NOT NULL,
  source           biz_transaction_source NOT NULL DEFAULT 'BANK',
  amount           NUMERIC(18, 2) NOT NULL,
  description      TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX biz_transactions_user_id_transaction_date_idx
  ON biz_transactions (user_id, transaction_date);

-- 6) biz_pg_settlements
CREATE TABLE biz_pg_settlements (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  pg_provider     TEXT NOT NULL,
  settlement_date TIMESTAMPTZ NOT NULL,
  amount          NUMERIC(18, 2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX biz_pg_settlements_user_id_settlement_date_idx
  ON biz_pg_settlements (user_id, settlement_date);

-- 7) updated_at 자동 갱신
CREATE OR REPLACE FUNCTION biz_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biz_users_updated_at
  BEFORE UPDATE ON biz_users
  FOR EACH ROW EXECUTE FUNCTION biz_set_updated_at();

CREATE TRIGGER biz_linked_accounts_updated_at
  BEFORE UPDATE ON biz_linked_accounts
  FOR EACH ROW EXECUTE FUNCTION biz_set_updated_at();

CREATE TRIGGER biz_investment_accounts_updated_at
  BEFORE UPDATE ON biz_investment_accounts
  FOR EACH ROW EXECUTE FUNCTION biz_set_updated_at();
