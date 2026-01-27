# Supabase 이메일 확인 설정 가이드

## 문제 상황
회원가입은 성공했지만 이메일 확인 메일이 오지 않는 경우, Supabase의 이메일 설정을 확인해야 합니다.

## 해결 방법

### 1. Supabase Dashboard에서 이메일 확인 설정 확인

1. **Supabase Dashboard 접속**
   - 프로젝트 대시보드로 이동

2. **Authentication → Settings → Email Auth**
   - `Enable email confirmations` 옵션 확인
   - 개발 환경에서는 이 옵션을 **비활성화**하는 것을 권장합니다.

### 2. 개발 환경에서 이메일 확인 비활성화 (권장)

**방법 1: Dashboard에서 설정**
1. Supabase Dashboard → Authentication → Settings
2. `Enable email confirmations` 토글을 **OFF**로 설정
3. 저장

**방법 2: SQL로 설정**
```sql
-- 이메일 확인 비활성화 (개발 환경용)
UPDATE auth.config
SET enable_signup = true,
    enable_email_confirmations = false;
```

### 3. 프로덕션 환경에서 이메일 서비스 설정

프로덕션 환경에서는 이메일 확인이 필요합니다. 다음 이메일 서비스를 설정하세요:

**옵션 1: Supabase 기본 이메일 서비스 (제한적)**
- 무료 플랜에서는 하루 3개 이메일만 전송 가능
- 프로덕션에는 부적합

**옵션 2: SMTP 서비스 연동 (권장)**
1. Supabase Dashboard → Settings → Auth → SMTP Settings
2. SMTP 서비스 제공자 선택:
   - SendGrid
   - Mailgun
   - AWS SES
   - Gmail (개발용, 제한적)
3. SMTP 자격 증명 입력
4. 테스트 이메일 전송

**옵션 3: Custom SMTP**
- 자체 SMTP 서버 사용
- SMTP 호스트, 포트, 사용자명, 비밀번호 설정

### 4. 이메일 템플릿 커스터마이징

1. Supabase Dashboard → Authentication → Email Templates
2. 다음 템플릿을 커스터마이징할 수 있습니다:
   - Confirm signup (회원가입 확인)
   - Magic Link (매직 링크)
   - Change Email Address (이메일 변경)
   - Reset Password (비밀번호 재설정)

### 5. 개발 환경에서 테스트

**이메일 확인 없이 로그인 테스트:**
1. Dashboard에서 `Enable email confirmations` 비활성화
2. 회원가입 후 즉시 로그인 가능

**이메일 확인 테스트:**
1. Dashboard에서 `Enable email confirmations` 활성화
2. SMTP 서비스 설정
3. 회원가입 시 이메일 확인
4. 이메일의 확인 링크 클릭
5. 로그인 가능

### 6. 현재 프로젝트 코드 동작

현재 회원가입 코드는:
- 이메일 확인이 필요한 경우: 사용자에게 이메일 확인 안내 메시지 표시
- 이메일 확인이 비활성화된 경우: 즉시 로그인 페이지로 이동

### 7. 문제 해결 체크리스트

- [ ] Supabase Dashboard에서 이메일 확인 설정 확인
- [ ] 개발 환경에서는 이메일 확인 비활성화 권장
- [ ] 프로덕션 환경에서는 SMTP 서비스 설정
- [ ] 이메일 템플릿 커스터마이징 (선택사항)
- [ ] 스팸 폴더 확인
- [ ] 이메일 주소 오타 확인

### 8. 추가 참고사항

- **로컬 개발**: 이메일 확인 비활성화 권장
- **스테이징 환경**: 테스트용 SMTP 서비스 사용
- **프로덕션 환경**: 프로덕션급 SMTP 서비스 필수 (SendGrid, Mailgun, AWS SES 등)

## 현재 상태 확인

MCP 도구를 사용하여 현재 설정을 확인할 수 있습니다:
```bash
# SQL로 현재 설정 확인
SELECT * FROM auth.config;
```

또는 Supabase Dashboard에서 직접 확인하세요.
