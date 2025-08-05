# Andrew's Clinic Dashboard Integration Plan

## 🚨 현재 상황
- Playwright MCP 분석 결과: **Supabase 데이터베이스 연결 실패**
- 모든 API 호출이 "TypeError: fetch failed"로 실패
- 대시보드 코드는 정상 작동 중 (0 값은 올바른 응답)

## 🔧 필요한 작업

### 1. Supabase 프로젝트 재설정
```bash
# 새로운 Supabase 프로젝트 생성 또는 기존 프로젝트 복구
# URL: https://supabase.com/dashboard
```

### 2. 환경변수 업데이트
```env
NEXT_PUBLIC_SUPABASE_URL="https://[새로운-프로젝트-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[새로운-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[새로운-service-role-key]"
```

### 3. 데이터베이스 스키마 생성
```sql
-- 필수 테이블들:
-- 1. organisations (Andrew's Clinic 데이터)
-- 2. seniors (12명의 한국 시니어)
-- 3. schedules (CRITICAL: INNER JOIN 필수)
-- 4. motor_results & cognitive_results (활동 데이터)
-- 5. user_roles (인증 시스템)
```

### 4. Andrew's Clinic 더미 데이터
```sql
-- 조직: Andrew's Clinic (bf579a76-e9c5-45be-8659-7e62664883c4)
-- 시니어: 김철수, 이영희, 박지민 등 12명
-- 활동 패턴: 3명 오늘 활동, 7명 주간 활동, 2명 비활성
```

## 🎯 예상 결과
데이터베이스 연결이 복구되면:
- Total Users: 12
- Active Today: 3
- Weekly Active: 7
- New Users This Month: 3
- License Seats Remaining: 38

## 📋 실행 순서
1. Supabase 새 프로젝트 생성
2. 환경변수 업데이트
3. 스키마 및 데이터 생성
4. 대시보드 테스트