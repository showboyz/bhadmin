# Andrew's Clinic 대시보드 데이터 설정 가이드

## 🗄️ 데이터베이스 설정 순서

### 1단계: 기본 조직 및 사용자 데이터 생성
```sql
-- Supabase SQL Editor에서 실행
-- create-andrews-clinic-dashboard-data.sql 파일 내용 실행
```

### 2단계: 훈련 결과 데이터 생성  
```sql
-- create-training-results-dashboard.sql 파일 내용 실행
```

### 3단계: 추가 테이블 및 차트 데이터 생성
```sql
-- additional-dashboard-tables.sql 파일 내용 실행
```

## 📊 생성될 데이터 개요

### 조직 정보
- **Andrew's Clinic**: 50 라이센스 시트

### 사용자 (12명)
- **매우 활성**: 김철수, 이영희, 박지민 (오늘 활동 포함)
- **적당히 활성**: 최민수, 정수연 (최근 활동)
- **주간 활성**: 강동훈, 윤미라 (주간 1-2회)
- **비활성**: 송태호, 한소영 (3일+ 활동 없음)
- **신규 사용자**: 임재혁, 조은숙, 백현우 (이번 달 등록)

### KPI 예상 결과
- **Total Users**: 12명
- **Active Today**: 3명 (김철수, 이영희, 박지민)
- **Weekly Active**: 7명
- **New Users This Month**: 3명
- **Inactive Users**: 2명
- **License Seats Remaining**: 38석

### 차트 데이터
- **성별 분포**: 실제 데이터 기반 (남 6명, 여 6명)
- **일일 활동**: 지난 7일간 실제 세션 데이터
- **건강 상태**: 실제 건강 평가 데이터 기반

## 🔧 프론트엔드 업데이트

`src/app/org/[org-id]/dashboard/page.tsx` 파일을 업데이트하여 실제 데이터를 사용하도록 수정:

1. 하드코딩된 차트 데이터 제거
2. `fetchChartData()` 함수 추가
3. 실시간 데이터 페칭 로직 구현

## 📱 모바일 앱 연동 API

필요한 API 엔드포인트:
- `POST /api/sessions` - 세션 데이터 업로드
- `POST /api/biometrics` - 실시간 바이오메트릭 데이터
- `POST /api/health-assessments` - 건강 상태 업데이트
- `GET /api/dashboard/{org_id}` - 대시보드 데이터 조회

이 설정을 완료하면 Andrew's Clinic 대시보드에서 완전한 더미 데이터를 볼 수 있습니다!