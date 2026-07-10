# 비즈모아 (BizMoa)

개인사업자 및 소상공인을 위한 AI 기반 자동 자금 집행 및 스마트 세무·재테크 비서

## 기술 스택

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **외부 API**: 금융결제원 오픈뱅킹, 한국투자증권 KIS, 한국수출입은행

## 시작하기

```bash
cd bizmoa
cp .env.example .env
# .env 파일에 API 키 및 DATABASE_URL 설정

npm install
npx prisma generate
npx prisma db push   # Supabase 연결 후

npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 프로젝트 구조

```
bizmoa/
├── prisma/schema.prisma          # DB 스키마 (User, LinkedAccount, Transaction, InvestmentAccount)
├── src/
│   ├── app/
│   │   ├── api/auth/banking/     # 오픈뱅킹 OAuth 2.0 토큰 관리
│   │   ├── api/investment/auto/  # KIS 자동 투자 API
│   │   ├── dashboard/            # 메인 대시보드
│   │   └── page.tsx              # 랜딩 페이지
│   ├── components/
│   │   ├── dashboard/            # 대시보드 위젯
│   │   └── ui/                   # shadcn/ui 컴포넌트
│   └── lib/
│       ├── banking/openbanking.ts # 토큰 발급·갱신
│       ├── investment/kis-api.ts  # KIS 자동 매수
│       ├── encryption.ts          # AES-256-GCM 암호화
│       └── prisma.ts
└── .env.example
```

## 핵심 API

| 엔드포인트 | 메서드 | 설명 |
|---|---|---|
| `/api/auth/banking?action=authorize&userId=` | GET | 오픈뱅킹 인증 URL 생성 |
| `/api/auth/banking` | POST | OAuth code → 토큰 교환 및 DB 저장 |
| `/api/auth/banking/callback` | GET | OAuth 콜백 처리 |
| `/api/investment/auto` | POST | 유휴 자금 배치 (KIS 미연동 시 시뮬레이션) |
| `/api/ai/investment-recommendation` | POST | OpenRouter 무료 모델 AI 투자 조언 |
| `/api/market/overview` | GET | 수출입은행 환율·금리 통합 조회 |

## Vercel 환경변수 (필수)

| 환경변수명 | Vercel 타입 | 설명 |
|---|---|---|
| `OPENROUTER_API_KEY` | Secret | OpenRouter AI API 키 |
| `NEXT_PUBLIC_SUPABASE_URL` | Plain | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain | Supabase anon public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service_role 키 |
| `DATABASE_URL` | Secret | Supabase PostgreSQL 연결 문자열 |
| `KEXIM_EXCHANGE_API_KEY` | Secret | 수출입은행 환율 API (AP01) |
| `KEXIM_LOAN_RATE_API_KEY` | Secret | 수출입은행 대출금리 API (AP02) |
| `KEXIM_INTL_RATE_API_KEY` | Secret | 수출입은행 국제금리 API (AP03) |

## Vercel 환경변수 (선택)

| 환경변수명 | 설명 |
|---|---|
| `OPENROUTER_SITE_URL` | 배포 URL (OpenRouter Referer) |
| `OPENROUTER_APP_NAME` | 앱 이름 (기본: BizMoa) |
| `KEXIM_API_BASE_URL` | 기본값 사용 권장 |
| `ENCRYPTION_KEY` | 금융 토큰 암호화 (64자 hex) |

## 한국수출입은행 API

동일 URL에 `data` 코드만 다릅니다.

- `AP01` + `KEXIM_EXCHANGE_API_KEY` → 환율
- `AP02` + `KEXIM_LOAN_RATE_API_KEY` → 대출금리
- `AP03` + `KEXIM_INTL_RATE_API_KEY` → 국제금리

금융결제원·KIS 키 없이도 **환율/금리 + AI 추천** 기능은 동작합니다 (투자 실행은 시뮬레이션).

## 핵심 API

- 토큰·계좌번호는 AES-256-GCM으로 암호화 저장
- `.env` 파일은 `.gitignore`에 포함 (절대 커밋 금지)
- 로컬 SSL 우회: `REJECT_UNAUTHORIZED=false` (개발 전용)

## 마일스톤

- [x] 1주차: DB 설계 + 대시보드 UI (Mock)
- [ ] 2주차: 오픈뱅킹 실 API 연동
- [ ] 3주차: KIS API 샌드박스 테스트
- [ ] 4주차: 보안 점검 + Closed Beta
