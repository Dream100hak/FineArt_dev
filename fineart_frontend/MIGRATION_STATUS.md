# 🔄 Supabase Migration Status

## ✅ 완료된 작업

1. **의존성 설치**
   - ✅ `@supabase/supabase-js` 설치 완료
   - ✅ `@supabase/ssr` 설치 완료

2. **Supabase 클라이언트 설정**
   - ✅ `src/lib/supabase.js` 생성 완료

3. **데이터베이스 스키마 설계**
   - ✅ `supabase_schema.sql` 생성 완료
   - ✅ 테이블: profiles, artists, artworks, exhibitions, boards, articles
   - ✅ 인덱스 및 트리거 포함

4. **RLS 정책 설계**
   - ✅ `supabase_rls_policies.sql` 생성 완료

## 📋 다음 단계

### 1. 환경 변수 설정
`.env.local` 파일에 Supabase 프로젝트 정보를 추가하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Supabase Dashboard → Settings → API에서 확인할 수 있습니다.

### 2. 데이터베이스 스키마 적용
Supabase Dashboard → SQL Editor에서 `supabase_schema.sql` 파일의 내용을 실행하세요.

또는 Supabase MCP를 사용하여:
```bash
# MCP 인증 토큰이 설정되어 있다면
# apply_migration 도구를 사용하여 스키마 적용
```

### 3. RLS 정책 적용
Supabase Dashboard → SQL Editor에서 `supabase_rls_policies.sql` 파일의 내용을 실행하세요.

### 4. 인증 시스템 마이그레이션
- [x] `src/lib/auth.js` 업데이트 (Supabase Auth 사용) ✅
- [x] `src/hooks/useAuthContext.js` 업데이트 ✅
- [x] `src/hooks/useDecodedAuth.js` 업데이트 ✅
- [x] `src/app/login/page.jsx` 업데이트 ✅
- [x] `src/app/register/page.jsx` 업데이트 ✅

### 5. API 함수 마이그레이션
- [x] `src/lib/api.js`의 함수들을 Supabase 쿼리로 교체 ✅
- [x] Artists API 함수들 ✅
- [x] Artworks API 함수들 ✅
- [x] Exhibitions API 함수들 ✅
- [x] Boards API 함수들 ✅
- [x] Articles API 함수들 ✅
- [x] 파일 업로드 함수 (Supabase Storage) ✅

### 6. 파일 스토리지 설정
- [ ] Supabase Storage 버킷 생성 (artworks, exhibitions, articles, avatars)
- [ ] Storage 정책 설정
- [ ] 파일 업로드 함수 업데이트

## 📝 생성된 파일들

- `src/lib/supabase.js` - Supabase 클라이언트 유틸리티
- `supabase_schema.sql` - 데이터베이스 스키마
- `supabase_rls_policies.sql` - RLS 정책
- `.env.local.example` - 환경 변수 예시

## 🔗 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- `.cursor/rules/supabase.mdc` - Supabase 통합 규칙
- `.cursor/rules/supabase-migration.mdc` - 마이그레이션 가이드
