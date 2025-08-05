-- Additional tables for comprehensive dashboard data
-- Run this in Supabase SQL Editor

-- Add missing columns to organisations table
ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'clinic',
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Health status tracking table
CREATE TABLE IF NOT EXISTS health_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    assessment_date DATE DEFAULT CURRENT_DATE,
    overall_health_status TEXT CHECK (overall_health_status IN ('Excellent', 'Good', 'Fair', 'Poor')),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    weight_kg DECIMAL(5,2),
    mobility_score INTEGER CHECK (mobility_score >= 0 AND mobility_score <= 100),
    cognitive_score INTEGER CHECK (cognitive_score >= 0 AND cognitive_score <= 100),
    notes TEXT,
    assessed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily session tracking table (for daily activity chart)
CREATE TABLE IF NOT EXISTS daily_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    session_date DATE DEFAULT CURRENT_DATE,
    session_type TEXT CHECK (session_type IN ('motor', 'cognitive', 'combined')),
    duration_minutes INTEGER,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_assessments_senior_id ON health_assessments(senior_id);
CREATE INDEX IF NOT EXISTS idx_health_assessments_date ON health_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_senior_id ON daily_sessions(senior_id);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions(session_date);

-- Apply updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_health_assessments_updated_at 
    BEFORE UPDATE ON health_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_assessments
CREATE POLICY "Users can view health assessments for their organization" ON health_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM seniors s 
            WHERE s.id = health_assessments.senior_id 
            AND (
                -- Super admin can see all
                auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'super_admin')
                OR
                -- Org users can see their org's data
                s.org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert health assessments for their organization" ON health_assessments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM seniors s 
            WHERE s.id = health_assessments.senior_id 
            AND (
                -- Super admin can insert all
                auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'super_admin')
                OR
                -- Org users can insert for their org
                s.org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('org_admin', 'staff'))
            )
        )
    );

-- RLS Policies for daily_sessions
CREATE POLICY "Users can view daily sessions for their organization" ON daily_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM seniors s 
            WHERE s.id = daily_sessions.senior_id 
            AND (
                -- Super admin can see all
                auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'super_admin')
                OR
                -- Org users can see their org's data
                s.org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert daily sessions for their organization" ON daily_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM seniors s 
            WHERE s.id = daily_sessions.senior_id 
            AND (
                -- Super admin can insert all
                auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'super_admin')
                OR
                -- Org users can insert for their org
                s.org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('org_admin', 'staff'))
            )
        )
    );

-- Sample health assessment data for Andrew's Clinic
INSERT INTO health_assessments (senior_id, assessment_date, overall_health_status, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, weight_kg, mobility_score, cognitive_score, notes, assessed_by) VALUES
-- Excellent health (25%)
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '1 week', 'Excellent', 118, 78, 72, 62.5, 92, 88, '건강 상태 매우 양호, 꾸준한 운동 효과', 'Dr. Kim'),
('550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '3 days', 'Excellent', 115, 75, 68, 70.2, 90, 85, '신규 등록자, 의욕적이고 건강함', 'Dr. Lee'),
('550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '1 week', 'Excellent', 120, 80, 70, 68.8, 88, 82, '적응력이 뛰어남', 'Dr. Kim'),

-- Good health (40%)  
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '2 weeks', 'Good', 135, 85, 75, 72.1, 82, 78, '고혈압 관리 중, 전반적으로 양호', 'Dr. Park'),
('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '1 week', 'Good', 128, 82, 70, 58.7, 75, 80, '우울감 개선됨, 사회적 활동 증가', 'Dr. Lee'),
('550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '10 days', 'Good', 132, 88, 73, 75.3, 78, 76, '혈압 안정화', 'Dr. Kim'),
('550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '5 days', 'Good', 125, 80, 69, 61.2, 80, 82, '균형감각 향상', 'Dr. Park'),
('550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '4 days', 'Good', 122, 78, 71, 64.5, 77, 79, '신규 등록, 순조로운 적응', 'Dr. Lee'),

-- Fair health (25%)
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '1 week', 'Fair', 140, 90, 78, 55.8, 65, 62, '치매 초기, 인지 기능 관리 필요', 'Dr. Park'),
('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '2 weeks', 'Fair', 145, 92, 80, 68.9, 60, 68, '관절염으로 움직임 제한', 'Dr. Kim'),
('550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE - INTERVAL '3 weeks', 'Fair', 138, 88, 76, 71.7, 68, 70, '활동량 감소로 컨디션 저하', 'Dr. Lee'),

-- Poor health (10%)
('550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE - INTERVAL '2 weeks', 'Poor', 155, 95, 85, 52.3, 45, 55, '가족 지원 부족, 건강 상태 우려', 'Dr. Park')

ON CONFLICT (id) DO NOTHING;

-- Sample daily sessions data for activity chart
INSERT INTO daily_sessions (senior_id, session_date, session_type, duration_minutes, completed) VALUES
-- Generate data for the last 7 days to show daily activity pattern
-- Monday (12 sessions)
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '6 days', 'motor', 20, true),
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '6 days', 'cognitive', 15, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '6 days', 'motor', 12, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '6 days', 'cognitive', 10, true),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '6 days', 'combined', 30, true),
('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '6 days', 'motor', 8, true),
('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '6 days', 'cognitive', 12, true),
('550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '6 days', 'motor', 14, true),
('550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '6 days', 'cognitive', 16, true),
('550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '6 days', 'motor', 10, true),
('550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '6 days', 'cognitive', 8, true),
('550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '6 days', 'combined', 25, true),

-- Tuesday (19 sessions) - Peak day
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '5 days', 'motor', 18, true),
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 12, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '5 days', 'motor', 10, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 8, true),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '5 days', 'motor', 25, true),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 20, true),
('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '5 days', 'motor', 10, true),
('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 15, true),
('550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '5 days', 'motor', 12, true),
('550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 14, true),
('550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE - INTERVAL '5 days', 'motor', 6, false),
('550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '5 days', 'motor', 8, true),
('550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 10, true),
('550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 6, true),
('550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '5 days', 'motor', 22, true),
('550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 18, true),
('550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE - INTERVAL '5 days', 'motor', 5, false),
('550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 8, true),
('550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE - INTERVAL '5 days', 'cognitive', 6, false),

-- Continue with other days following the pattern from the hardcoded data...
-- Wednesday (15 sessions)
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '4 days', 'motor', 16, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 12, true),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '4 days', 'motor', 20, true),
('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '4 days', 'motor', 12, true),
('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 18, true),
('550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '4 days', 'motor', 14, true),
('550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 16, true),
('550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '4 days', 'motor', 10, true),
('550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 8, true),
('550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '4 days', 'combined', 28, true),
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 14, true),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '4 days', 'motor', 8, true),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '4 days', 'cognitive', 15, true),
('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '4 days', 'motor', 12, true),
('550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '4 days', 'motor', 12, true)

ON CONFLICT (id) DO NOTHING;