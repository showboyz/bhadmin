# 🚀 새로운 Supabase 프로젝트 설정 가이드

## 📋 현재 상황
기존 Supabase URL `gtfostmllgjxosvvkauh.supabase.co`가 더 이상 존재하지 않습니다.
새로운 프로젝트를 생성하여 애플리케이션을 정상화해야 합니다.

## 🛠️ 단계별 설정

### 1. Supabase 프로젝트 생성
1. https://supabase.com/dashboard 방문
2. "New Project" 클릭
3. 프로젝트명: `brain-health-admin`
4. 데이터베이스 비밀번호 설정
5. 지역: Asia Northeast (Seoul) 선택

### 2. API 키 복사
1. 프로젝트 생성 후 Settings > API 이동
2. 다음 값들 복사:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 3. 환경 변수 업데이트
`.env.local` 파일에서 다음 값들 교체:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-new-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-new-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-new-service-role-key"
```

### 4. 데이터베이스 스키마 설정
다음 마이그레이션 파일들을 순서대로 실행:

```bash
# Supabase 프로젝트와 연결
supabase link --project-ref your-project-id

# 마이그레이션 적용
supabase db push
```

또는 SQL Editor에서 직접 실행:
1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_super_admin_schema.sql`
3. `supabase/migrations/0003_add_org_type_and_admin_table.sql`
4. `supabase/migrations/0004_add_organisations_rls_policies.sql`

### 5. 확인
- 서버 재시작: `npm run dev`
- 브라우저에서 Demo Mode 배너가 사라졌는지 확인
- 로그인 페이지가 정상 작동하는지 테스트

## 🔧 문제 해결

### TypeError: Failed to fetch 발생 시
- 환경 변수가 올바르게 설정되었는지 확인
- 브라우저 캐시 삭제
- 서버 재시작

### 데이터베이스 연결 실패 시
- API 키가 올바른지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성 상태인지 확인

## 📊 데이터베이스 구조
새 프로젝트에는 다음 테이블들이 생성됩니다:
- `organisations` - 조직 정보
- `user_roles` - 사용자 권한
- `seniors` - 시니어 사용자
- `schedules` - 일정 관리
- `motor_results` - 운동 결과
- `cognitive_results` - 인지 결과
- `reports` - 리포트
- `organization_settings` - 조직 설정
- `system_audit_log` - 감사 로그

## 🎯 완료 후 기능
- ✅ 완전한 인증 시스템
- ✅ 조직별 멀티테넌트 구조
- ✅ 사용자 관리
- ✅ 데이터 대시보드
- ✅ 보고서 생성

---
**참고:** 기존 데이터가 있었다면 백업해두시고, 새 프로젝트에서 다시 입력해야 합니다.