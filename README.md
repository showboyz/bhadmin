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