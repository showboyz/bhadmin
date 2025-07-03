# Brain Health Admin Console

A comprehensive admin console for managing senior cognitive and motor training programs. Built with Next.js 14, Supabase, and integrated with AI-powered analysis.

## 🎯 Features

### ✅ Completed (MVP P0)
- **Authentication**: Email + OTP login with protected routes
- **Senior Management**: Complete CRUD operations with search and filtering
- **Program Scheduler**: 3-6 month training schedules with customizable frequency
- **Real-time Dashboard**: KPI monitoring, progress tracking, and analytics
- **Session Monitoring**: Track missed sessions and inactive seniors
- **Edge Functions**: Backend APIs for training data processing
- **Report Generation**: AI-powered analysis with PDF reports

### 🔧 Tech Stack
- **Frontend**: Next.js 14 + React 18 + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **AI Analysis**: Google Gemini Vision API
- **File Storage**: AWS S3 (videos) + Supabase Storage (reports)
- **Development Tools**: TypeScript, ESLint, Prettier

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini API)
- AWS account (for S3 storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brain-health-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual credentials
   ```

4. **Set up Supabase**
   ```bash
   npx supabase init
   npx supabase start
   npx supabase db push
   npx supabase db seed
   ```

5. **Deploy Edge Functions** (optional)
   ```bash
   npx supabase functions deploy upload_results
   npx supabase functions deploy create_senior
   npx supabase functions deploy generate_report
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Core Tables
- `organisations` - Organization/clinic information
- `seniors` - Senior citizen profiles
- `schedules` - Training program schedules
- `motor_results` - Physical exercise results
- `cognitive_results` - Cognitive training results
- `reports` - Generated analysis reports

### Key Relationships
```
organisations 1:many seniors
seniors 1:many schedules
seniors 1:many motor_results
seniors 1:many cognitive_results
motor_results/cognitive_results 1:1 reports
```

## 🔌 API Endpoints (Edge Functions)

### POST /functions/v1/upload_results
Upload training session results and trigger analysis.

**Request Body:**
```json
{
  "senior_id": "uuid",
  "result_type": "motor" | "cognitive",
  "raw_data": { /* training data */ },
  "video_key": "s3-path-to-video",
  "bpm": 120 // optional, for motor results
}
```

### POST /functions/v1/create_senior
Create a new senior with validation and license checking.

**Request Body:**
```json
{
  "org_id": "uuid",
  "name": "Senior Name",
  "gender_enum": "M" | "F",
  "birth": "1950-01-01",
  "phone": "010-1234-5678",
  "guardian_phone": "010-5678-1234",
  "note": "Additional notes"
}
```

### POST /functions/v1/generate_report
Generate AI-powered analysis report for a training session.

**Request Body:**
```json
{
  "session_id": "uuid",
  "result_type": "motor" | "cognitive"
}
```

## 🎨 UI Components

### Pages Structure
```
/login          - Authentication
/dashboard      - KPI overview and charts
/users          - Senior management (CRUD)
/schedules      - Training program scheduling  
/monitoring     - Missed session tracking
/reports        - Generated analysis reports
```

### Design System
- **Colors**: Monochrome (#111, #FFF, #F7F7F7)
- **Typography**: Clean, accessible fonts
- **Components**: shadcn/ui with custom styling
- **Responsive**: Mobile-first design

## 📈 Monitoring & Analytics

### KPI Metrics
- Total active seniors
- Daily/weekly activity rates
- Session completion rates
- License utilization
- Performance trends

### Alert System
- Missed session notifications
- Inactive senior detection
- Performance decline alerts
- System health monitoring

## 🤖 AI Integration

### Google Gemini Vision API
- Video analysis for movement patterns
- Cognitive assessment evaluation
- Performance scoring
- Personalized recommendations

### Report Generation
- Automated PDF creation
- Progress tracking charts
- Health insights
- Exercise recommendations

## 🔒 Security

### Authentication
- Supabase Auth with OTP verification
- Row Level Security (RLS) policies
- Protected API endpoints
- Session management

### Data Protection
- HIPAA-compliant data handling
- Encrypted data transmission
- Audit logging
- Access control

## 🚀 Deployment

### Production Setup
1. **Supabase Production Project**
   - Create production project
   - Configure custom domain
   - Set up environment variables

2. **Vercel Deployment**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Edge Functions**
   ```bash
   supabase functions deploy --project-ref <prod-ref>
   ```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_GEMINI_API_KEY=AIz...
```

## 📝 Usage Examples

### Simulating Training Data
```typescript
import { simulateTrainingResult } from '@/lib/edge-functions'

// Generate mock motor training result
await simulateTrainingResult('senior-id', 'motor')

// Generate mock cognitive training result  
await simulateTrainingResult('senior-id', 'cognitive')
```

### Manual Report Generation
```typescript
import { generateSessionReport } from '@/lib/edge-functions'

const { data, error } = await generateSessionReport({
  session_id: 'session-uuid',
  result_type: 'motor'
})
```

## 🎯 Project Status Update

### ✅ 완료된 핵심 기능들 (Completed Core Features)

#### 프로젝트 초기 설정 (Project Setup)
- **Framework**: Next.js 14 + TypeScript + TailwindCSS + shadcn/ui
- **Database**: Supabase PostgreSQL 완전 설정
- **Schema**: organisations, seniors, schedules, motor_results, cognitive_results, reports 테이블 완성
- **Development Environment**: Local development server running at http://localhost:3001

#### 인증 시스템 (Authentication System)
- **Multi-method Auth**: 이메일 + OTP 및 비밀번호 로그인 지원
- **Route Protection**: 보호된 라우트 및 세션 관리
- **Security**: Row Level Security (RLS) 정책 적용

#### 시니어 관리 시스템 (Senior Management)
- **CRUD Operations**: 완전한 생성/읽기/업데이트/삭제 기능
- **Advanced Search**: 검색, 필터링, 페이지네이션 완성
- **Data Validation**: 입력 검증 및 오류 처리
- **Sample Data**: 5명의 시니어 샘플 데이터 구성

#### 대시보드 및 모니터링 (Dashboard & Monitoring)
- **KPI Tiles**: 실시간 핵심 지표 표시
- **Interactive Charts**: 진행률 및 성과 추적 차트
- **Session Monitoring**: 미수행 세션 추적 및 비활성 시니어 감지
- **Real-time Updates**: 실시간 데이터 업데이트

#### 프로그램 스케줄러 (Program Scheduler)
- **Flexible Scheduling**: 3-6개월 훈련 일정 관리
- **Customizable Frequency**: 주간/월간 빈도 설정
- **Schedule Tracking**: 일정 준수 모니터링

#### 리포트 시스템 (Report System)
- **AI-Powered Analysis**: Google Gemini Vision API 연동
- **PDF Generation**: 자동 PDF 보고서 생성
- **Performance Insights**: 성과 분석 및 개선 제안
- **Historical Tracking**: 진행 상황 추적

#### Edge Functions API
- **upload_results**: 훈련 결과 업로드 및 분석 트리거
- **create_senior**: 시니어 생성 및 라이선스 검증
- **generate_report**: AI 기반 분석 보고서 생성

#### 기술 통합 (Technical Integration)
- **AI Integration**: Google Gemini Vision API 완전 연동
- **Database Connection**: Supabase 연결 및 쿼리 최적화
- **File Storage**: 비디오 및 보고서 파일 저장 시스템
- **Build System**: 프로덕션 빌드 성공 및 최적화

### 🔧 설치된 MCP 서버들 (Installed MCP Servers)
- **Context7 MCP**: 프로젝트 컨텍스트 관리
- **Playwright MCP**: 브라우저 자동화 테스팅
- **Taskmaster MCP**: GitHub 이슈 및 프로젝트 관리
- **shadcn-ui MCP**: UI 컴포넌트 관리 및 업데이트
- **Supabase MCP**: 데이터베이스 관리 및 스키마 동기화

### 📊 현재 상태 (Current Status)
- **Application Status**: ✅ 완전히 작동하는 애플리케이션
- **Database Connection**: ✅ Supabase 연결 및 데이터 동기화 완료
- **Sample Data**: ✅ 테스트용 샘플 데이터 구성 완료
- **Build Status**: ✅ 프로덕션 빌드 성공
- **Feature Completeness**: ✅ 모든 MVP (P0) 기능 구현 완료

### ⏳ 다음 단계 (Next Steps)
1. **테스트 계정 생성**: 실제 사용자 테스트를 위한 계정 설정
2. **Edge Functions 배포**: 프로덕션 환경에 API 함수 배포
3. **프로덕션 환경 설정**: Vercel 배포 및 환경 변수 구성
4. **사용자 교육**: 관리자 및 사용자 가이드 작성

**🎉 All core MVP (P0) features have been successfully implemented and tested. The application is ready for user testing and demonstration.**

## 🎯 Roadmap

### P1 Features (Next Phase)
- [ ] Slack/Email notifications for missed sessions
- [ ] Manual difficulty adjustment per senior
- [ ] Detailed report viewer in admin console
- [ ] Advanced analytics dashboard

### P2 Features (Future)
- [ ] Multi-language support (Korean/English)
- [ ] Advanced reporting with charts
- [ ] Mobile app for caregivers
- [ ] Integration with wearable devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software for Brain Health Playground.

---

**Generated with Claude Code** 🤖