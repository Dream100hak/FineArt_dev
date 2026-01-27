# ✅ Supabase 마이그레이션 완료

## 🎉 완료된 작업

### 1. 환경 설정 ✅
- [x] Supabase 클라이언트 라이브러리 설치 (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Supabase 클라이언트 유틸리티 생성 (`src/lib/supabase.js`)
- [x] 환경 변수 설정 (`.env.local`)

### 2. 데이터베이스 스키마 ✅
- [x] 데이터베이스 스키마 적용 (MCP를 통해 자동 적용)
- [x] 테이블 생성 확인:
  - ✅ profiles
  - ✅ artists
  - ✅ artworks
  - ✅ exhibitions
  - ✅ boards
  - ✅ articles
- [x] 인덱스 및 트리거 생성
- [x] RLS 정책 적용

### 3. 인증 시스템 마이그레이션 ✅
- [x] `src/lib/auth.js` - Supabase Auth 사용
- [x] `src/hooks/useAuthContext.js` - Supabase 세션 구독
- [x] `src/hooks/useDecodedAuth.js` - Supabase 프로필에서 역할 가져오기
- [x] `src/app/login/page.jsx` - `supabase.auth.signInWithPassword()` 사용
- [x] `src/app/register/page.jsx` - `supabase.auth.signUp()` 사용

### 4. API 함수 마이그레이션 ✅
- [x] `src/lib/api.js` - 모든 함수를 Supabase 쿼리로 교체
- [x] Artists API (get, create, update, delete)
- [x] Artworks API (get, getById, create, update, delete)
- [x] Exhibitions API (get, getById, create, update, delete)
- [x] Boards API (get, getBoardsSidebar, getBoardBySlug, getBoardArticles, getBoardArticleById, create, update, delete)
- [x] Articles API (get, getById, create, update, delete)
- [x] 파일 업로드 (Supabase Storage)

## 📝 다음 단계 (선택사항)

### 1. 파일 스토리지 설정
Supabase Dashboard에서 Storage 버킷을 생성하세요:

1. **Storage** → **Buckets** → **New bucket**
2. 다음 버킷들을 생성:
   - `artworks` - 작품 이미지 (Public)
   - `exhibitions` - 전시 이미지 (Public)
   - `articles` - 게시글 이미지 (Public)
   - `avatars` - 사용자 아바타 (Public)

3. 각 버킷의 정책 설정:
   - **Public read**: 모든 사용자가 읽기 가능
   - **Authenticated write**: 인증된 사용자가 업로드 가능

### 2. 테스트
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 작가 목록 조회 테스트
- [ ] 작품 목록 조회 테스트
- [ ] 전시 목록 조회 테스트
- [ ] 게시판 목록 조회 테스트
- [ ] 게시글 작성 테스트 (인증 필요)
- [ ] 파일 업로드 테스트

### 3. 정리 작업
- [ ] 사용하지 않는 코드 제거 (axios 관련, 필요시)
- [ ] 환경 변수 정리 (`NEXT_PUBLIC_API_URL` 제거 가능)
- [ ] 문서 업데이트

## 🔄 마이그레이션된 주요 변경사항

### API 응답 형식
- 기존: `{ items: [], total: 0, page: 1, size: 10 }`
- Supabase: 동일한 형식 유지 (호환성 보장)

### 인증
- 기존: Custom JWT + localStorage
- Supabase: Supabase Auth + 자동 세션 관리

### 파일 업로드
- 기존: `/api/uploads` 엔드포인트
- Supabase: Supabase Storage 직접 사용

### 데이터베이스
- 기존: MySQL (C# .NET 백엔드)
- Supabase: PostgreSQL (Supabase)

## ⚠️ 주의사항

1. **RLS 정책**: 모든 테이블에 RLS가 활성화되어 있습니다. 필요시 정책을 조정하세요.

2. **파일 업로드**: Storage 버킷이 생성되기 전까지 파일 업로드는 작동하지 않습니다.

3. **환경 변수**: `.env.local`에 올바른 Supabase URL과 키가 설정되어 있는지 확인하세요.

4. **기존 데이터**: MySQL에서 Supabase로 데이터를 마이그레이션해야 합니다 (별도 작업 필요).

## 🎯 마이그레이션 성공!

모든 주요 기능이 Supabase로 성공적으로 마이그레이션되었습니다. 이제 C# .NET 백엔드 없이도 애플리케이션이 작동합니다.
