# 🔄 Supabase Migration Plan

이 문서는 FineArt 프로젝트를 **C# .NET + MySQL**에서 **Supabase**로 마이그레이션하는 계획입니다.

## 📋 현재 상태

### 현재 아키텍처
- **Frontend**: Next.js 16 (App Router) + React 19
- **Backend**: C# .NET API (`http://localhost:5000`)
- **Database**: MySQL
- **Auth**: Custom JWT-based authentication
- **File Storage**: Custom upload API (`/api/uploads`)

### 마이그레이션 목표
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **File Storage**: Supabase Storage

## 🗺 마이그레이션 로드맵

### Phase 1: 환경 설정 및 준비 (1-2일)

#### 1.1 Supabase 프로젝트 생성
- [ ] Supabase 계정 생성 및 프로젝트 생성
- [ ] 프로젝트 URL과 API 키 확인
- [ ] 환경 변수 설정 (`.env.local`)

#### 1.2 의존성 설치
```bash
npm install @supabase/supabase-js @supabase/ssr
```

#### 1.3 Supabase 클라이언트 설정
- [ ] `src/lib/supabase.js` 생성
- [ ] 브라우저용 클라이언트 설정
- [ ] 서버용 클라이언트 설정 (필요시)

### Phase 2: 데이터베이스 스키마 설계 (2-3일)

#### 2.1 테이블 설계
다음 테이블들을 Supabase에서 생성:

**artists** (작가)
- `id` (UUID, primary key)
- `name` (text)
- `slug` (text, unique)
- `nationality` (text)
- `discipline` (text)
- `bio` (text)
- `image_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**artworks** (작품)
- `id` (UUID, primary key)
- `title` (text)
- `status` (text) - 'ForSale', 'Sold', 'Rentable'
- `price` (numeric)
- `rent_price` (numeric, nullable)
- `is_rentable` (boolean)
- `artist_id` (UUID, foreign key → artists.id)
- `main_theme` (text)
- `material` (text)
- `size_bucket` (text)
- `size` (text)
- `width_cm` (numeric)
- `height_cm` (numeric)
- `image_url` (text)
- `description` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**exhibitions** (전시)
- `id` (UUID, primary key)
- `title` (text)
- `artist` (text)
- `artist_id` (UUID, foreign key → artists.id, nullable)
- `host` (text)
- `participants` (text)
- `location` (text)
- `start_date` (date)
- `end_date` (date)
- `description` (text)
- `image_url` (text)
- `category` (text) - 'solo', 'group', 'digital', 'installation'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**boards** (게시판)
- `id` (UUID, primary key)
- `name` (text)
- `slug` (text, unique)
- `description` (text)
- `layout_type` (text) - 'table', 'card', 'gallery', etc.
- `order_index` (integer)
- `parent_id` (UUID, foreign key → boards.id, nullable)
- `is_visible` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**articles** (게시글)
- `id` (UUID, primary key)
- `board_id` (UUID, foreign key → boards.id)
- `title` (text)
- `content` (text)
- `writer` (text)
- `author` (text)
- `category` (text, nullable)
- `view_count` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**profiles** (사용자 프로필)
- `id` (UUID, primary key, foreign key → auth.users.id)
- `email` (text)
- `role` (text) - 'user', 'admin'
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 2.2 인덱스 생성
- `artists.slug` (unique index)
- `boards.slug` (unique index)
- `artworks.artist_id` (index)
- `articles.board_id` (index)
- `articles.created_at` (index for sorting)

#### 2.3 RLS 정책 설정
- **Public read**: artists, artworks, exhibitions, boards, articles (SELECT)
- **Authenticated write**: articles (INSERT, UPDATE for own articles)
- **Admin only**: artists, artworks, exhibitions, boards (ALL operations)

### Phase 3: 인증 시스템 마이그레이션 (2-3일)

#### 3.1 Supabase Auth 설정
- [ ] Supabase Dashboard에서 Auth 설정 확인
- [ ] Email/Password 인증 활성화
- [ ] 사용자 메타데이터에 `role` 필드 추가

#### 3.2 인증 코드 업데이트
- [ ] `src/lib/auth.js` → Supabase Auth로 교체
- [ ] `src/hooks/useAuthContext.js` → Supabase session 구독으로 변경
- [ ] `src/hooks/useDecodedAuth.js` → Supabase user metadata 사용
- [ ] `src/app/login/page.jsx` → `supabase.auth.signInWithPassword()` 사용
- [ ] `src/app/register/page.jsx` → `supabase.auth.signUp()` 사용

#### 3.3 역할 관리
- [ ] `profiles` 테이블 생성 및 `role` 컬럼 추가
- [ ] 사용자 생성 시 `profiles` 레코드 자동 생성 (Trigger)
- [ ] Admin 역할 확인 로직 업데이트

### Phase 4: API 레이어 리팩토링 (3-5일)

#### 4.1 API 함수 교체 순서
1. **Artists** (가장 단순)
   - [ ] `getArtists()` → Supabase `.from('artists').select()`
   - [ ] `createArtist()` → Supabase `.insert()`
   - [ ] `updateArtist()` → Supabase `.update()`
   - [ ] `deleteArtist()` → Supabase `.delete()`

2. **Artworks**
   - [ ] `getArtworks()` → Supabase with filters
   - [ ] `getArtworkById()` → Supabase `.eq('id', id).single()`
   - [ ] `createArtwork()` → Supabase `.insert()`
   - [ ] `updateArtwork()` → Supabase `.update()`
   - [ ] `deleteArtwork()` → Supabase `.delete()`

3. **Exhibitions**
   - [ ] `getExhibitions()` → Supabase with pagination
   - [ ] `getExhibitionById()` → Supabase `.single()`
   - [ ] `createExhibition()` → Supabase `.insert()`
   - [ ] `updateExhibition()` → Supabase `.update()`
   - [ ] `deleteExhibition()` → Supabase `.delete()`

4. **Boards**
   - [ ] `getBoards()` → Supabase with sorting
   - [ ] `getBoardsSidebar()` → Supabase with parent/child relations
   - [ ] `getBoardBySlug()` → Supabase `.eq('slug', slug).single()`
   - [ ] `getBoardArticles()` → Supabase with board_id filter
   - [ ] `getBoardArticleById()` → Supabase `.single()`
   - [ ] `createBoard()` → Supabase `.insert()`
   - [ ] `updateBoard()` → Supabase `.update()`
   - [ ] `deleteBoard()` → Supabase `.delete()`

5. **Articles**
   - [ ] `getArticles()` → Supabase with pagination
   - [ ] `getArticleById()` → Supabase `.single()`
   - [ ] `createArticle()` → Supabase `.insert()`
   - [ ] `updateArticle()` → Supabase `.update()`
   - [ ] `deleteArticle()` → Supabase `.delete()`

#### 4.2 데이터 정규화 함수 업데이트
- [ ] `normalizeXxx` 함수들이 Supabase 응답 형식에 맞게 동작하는지 확인
- [ ] `snake_case` → `camelCase` 변환 필요시 추가

### Phase 5: 파일 스토리지 마이그레이션 (2-3일)

#### 5.1 Supabase Storage 설정
- [ ] Storage 버킷 생성:
  - `artworks` (작품 이미지)
  - `exhibitions` (전시 이미지)
  - `articles` (게시글 이미지)
  - `avatars` (사용자 아바타)

#### 5.2 Storage 정책 설정
- **Public read**: 모든 버킷 (이미지 공개 접근)
- **Authenticated write**: artworks, exhibitions, articles (인증된 사용자 업로드)
- **Admin delete**: 모든 버킷 (관리자만 삭제)

#### 5.3 업로드 함수 교체
- [ ] `uploadFile()` → Supabase Storage `.upload()`
- [ ] `uploadArticleImage()` → Supabase Storage `.upload()`
- [ ] Public URL 생성 로직 업데이트
- [ ] 기존 이미지 파일 마이그레이션 (선택사항)

### Phase 6: 데이터 마이그레이션 (1-2일)

#### 6.1 데이터 내보내기
- [ ] MySQL에서 데이터 CSV/SQL 덤프
- [ ] 데이터 형식 변환 (camelCase → snake_case)

#### 6.2 데이터 가져오기
- [ ] Supabase Dashboard SQL Editor 사용
- [ ] 또는 Supabase CLI migrations 사용
- [ ] 또는 커스텀 마이그레이션 스크립트 작성

#### 6.3 데이터 검증
- [ ] 레코드 수 확인
- [ ] Foreign key 관계 확인
- [ ] 이미지 URL 업데이트 (필요시)

### Phase 7: 테스트 및 정리 (2-3일)

#### 7.1 기능 테스트
- [ ] 인증 플로우 (로그인, 회원가입, 로그아웃)
- [ ] CRUD 작업 (각 엔티티별)
- [ ] 파일 업로드 및 표시
- [ ] 관리자 접근 제어
- [ ] 페이지네이션 및 필터링
- [ ] 에러 처리

#### 7.2 성능 테스트
- [ ] 페이지 로딩 속도
- [ ] 쿼리 성능
- [ ] 이미지 로딩 속도

#### 7.3 정리 작업
- [ ] 사용하지 않는 코드 제거 (axios, old API functions)
- [ ] 환경 변수 정리 (`NEXT_PUBLIC_API_URL` 제거)
- [ ] 문서 업데이트
- [ ] `.gitignore` 확인

## 📝 마이그레이션 체크리스트

### 필수 작업
- [ ] Supabase 프로젝트 생성 및 설정
- [ ] 데이터베이스 스키마 생성
- [ ] RLS 정책 설정
- [ ] 인증 시스템 교체
- [ ] 모든 API 함수 Supabase로 교체
- [ ] 파일 스토리지 교체
- [ ] 데이터 마이그레이션
- [ ] 전체 기능 테스트

### 선택 작업
- [ ] 기존 이미지 파일 Supabase Storage로 마이그레이션
- [ ] 성능 최적화 (인덱스, 쿼리 최적화)
- [ ] 모니터링 설정 (Supabase Dashboard)
- [ ] 백업 설정

## ⚠️ 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 말고 단계별로 진행
2. **롤백 계획**: 문제 발생 시 이전 버전으로 돌아갈 수 있도록 준비
3. **데이터 백업**: 마이그레이션 전 반드시 데이터 백업
4. **테스트 환경**: 프로덕션 전에 스테이징 환경에서 충분히 테스트
5. **RLS 정책**: 보안을 위해 반드시 RLS 정책 설정 및 테스트

## 🔗 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Supabase Storage 가이드](https://supabase.com/docs/guides/storage)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 📞 지원

마이그레이션 중 문제가 발생하면:
1. `.cursor/rules/supabase-migration.mdc` 참조
2. `.cursor/rules/supabase.mdc` 참조
3. Supabase 공식 문서 확인
