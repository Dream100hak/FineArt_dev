This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### 1. 환경 변수 설정 (Supabase 사용 시 필수)

프로젝트 루트에 `.env.local` 파일을 만들고 아래 변수를 넣으세요.  
(클론한 PC에서는 `.env.local`이 없으므로 직접 생성해야 합니다.)

```bash
# .env.local.example 을 복사한 뒤 값만 채우면 됩니다.
# cp .env.local.example .env.local
```

| 변수명 | 설명 | 확인 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 대시보드 → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 익명(공개) API 키 | 같은 화면 → Project API keys → `anon` `public` |

Supabase 프로젝트가 없다면 [Supabase](https://supabase.com)에서 프로젝트를 만든 뒤, DB 스키마는 `supabase_schema.sql` 등 프로젝트 내 SQL 파일을 참고하세요.

### 2. 개발 서버 실행

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
