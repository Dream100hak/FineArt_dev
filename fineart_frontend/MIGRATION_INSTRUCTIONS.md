# 🚀 Supabase 마이그레이션 실행 가이드

## 현재 상태
- ✅ Supabase 클라이언트 라이브러리 설치 완료
- ✅ Supabase 클라이언트 유틸리티 생성 완료 (`src/lib/supabase.js`)
- ✅ 데이터베이스 스키마 SQL 파일 준비 완료 (`supabase_schema.sql`)
- ✅ RLS 정책 SQL 파일 준비 완료 (`supabase_rls_policies.sql`)

## 📝 Supabase Dashboard에서 실행하기

### 1단계: 데이터베이스 스키마 적용

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. `supabase_schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
7. 성공 메시지 확인

### 2단계: RLS 정책 적용

1. SQL Editor에서 **New query** 클릭
2. `supabase_rls_policies.sql` 파일의 전체 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭
4. 성공 메시지 확인

### 3단계: 테이블 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ profiles
   - ✅ artists
   - ✅ artworks
   - ✅ exhibitions
   - ✅ boards
   - ✅ articles

## 🔑 MCP 인증 토큰 설정 (선택사항)

MCP를 통해 자동으로 마이그레이션하려면:

1. Supabase Dashboard → Settings → Access Tokens
2. 새 Access Token 생성
3. 환경 변수 설정:
   ```bash
   export SUPABASE_ACCESS_TOKEN=your-access-token-here
   ```

또는 Cursor 설정에서 MCP 서버 설정에 추가:
```json
{
  "mcpServers": {
    "user-supabase": {
      "command": "...",
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-access-token-here"
      }
    }
  }
}
```

## ✅ 다음 단계

스키마 적용이 완료되면:

1. **인증 시스템 마이그레이션**
   - `src/lib/auth.js` 업데이트
   - `src/hooks/useAuthContext.js` 업데이트
   - 로그인/회원가입 페이지 업데이트

2. **API 함수 마이그레이션**
   - `src/lib/api.js`의 함수들을 Supabase 쿼리로 교체

3. **파일 스토리지 설정**
   - Supabase Storage 버킷 생성
   - 파일 업로드 함수 업데이트

## 🆘 문제 해결

### 오류: "relation already exists"
- 테이블이 이미 존재하는 경우입니다. `CREATE TABLE IF NOT EXISTS`를 사용했으므로 안전하게 재실행 가능합니다.

### 오류: "permission denied"
- RLS 정책 적용 전에 스키마를 실행했을 수 있습니다. 순서대로 실행하세요:
  1. 먼저 `supabase_schema.sql`
  2. 그 다음 `supabase_rls_policies.sql`

### 오류: "function already exists"
- 함수가 이미 존재하는 경우입니다. `CREATE OR REPLACE FUNCTION`을 사용했으므로 안전하게 재실행 가능합니다.
