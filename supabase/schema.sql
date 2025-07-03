-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create enums
CREATE TYPE gender_enum AS ENUM ('M', 'F');
CREATE TYPE education_level AS ENUM ('none', 'elementary', 'middle', 'high', 'college');
CREATE TYPE schedule_status AS ENUM ('Active', 'Completed', 'Cancelled');
CREATE TYPE report_type AS ENUM ('PDF', 'HTML');

-- Organizations table
CREATE TABLE organisations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    licence_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seniors table
CREATE TABLE seniors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender_enum gender_enum NOT NULL,
    birth DATE NOT NULL,
    eduyear education_level,
    phone TEXT,
    guardian_phone TEXT,
    address JSONB,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sessions_per_week INTEGER NOT NULL DEFAULT 2 CHECK (sessions_per_week >= 1 AND sessions_per_week <= 7),
    status schedule_status DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Motor results table
CREATE TABLE motor_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    raw JSONB NOT NULL,
    video_key TEXT NOT NULL,
    bpm INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cognitive results table  
CREATE TABLE cognitive_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    raw JSONB NOT NULL,
    video_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL, -- References either motor_results.id or cognitive_results.id
    type report_type NOT NULL DEFAULT 'PDF',
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_seniors_org_id ON seniors(org_id);
CREATE INDEX idx_schedules_senior_id ON schedules(senior_id);
CREATE INDEX idx_motor_results_senior_id ON motor_results(senior_id);
CREATE INDEX idx_cognitive_results_senior_id ON cognitive_results(senior_id);
CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_seniors_name ON seniors(name);
CREATE INDEX idx_motor_results_created_at ON motor_results(created_at);
CREATE INDEX idx_cognitive_results_created_at ON cognitive_results(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seniors_updated_at BEFORE UPDATE ON seniors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seniors ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Sample data for development
INSERT INTO organisations (id, name, licence_seats) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Seoul Medical Center', 100),
    ('550e8400-e29b-41d4-a716-446655440001', 'Busan Health Clinic', 50);

INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, guardian_phone, note) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '김철수', 'M', '1958-05-15', 'high', '010-1234-5678', '010-1111-2222', '무릎 관절염 병력 있음'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '이영희', 'F', '1960-08-22', 'middle', '010-2345-6789', '010-3333-4444', '당뇨 관리 중'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '박민수', 'M', '1955-12-03', 'college', '010-3456-7890', '010-5555-6666', '');

INSERT INTO schedules (senior_id, start_date, end_date, sessions_per_week, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '2024-01-01', '2024-03-31', 3, 'Active'),
    ('660e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2024-04-15', 2, 'Active'),
    ('660e8400-e29b-41d4-a716-446655440002', '2023-10-01', '2023-12-31', 5, 'Completed');

-- Sample motor results
INSERT INTO motor_results (senior_id, raw, video_key, bpm) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '{"exercise_type": "walking", "duration": 1800, "steps": 2400}', 'videos/senior1_session1.mp4', 85),
    ('660e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "arm_movement", "duration": 900, "repetitions": 15}', 'videos/senior2_session1.mp4', 92);

-- Sample cognitive results  
INSERT INTO cognitive_results (senior_id, raw, video_key) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '{"test_type": "memory", "score": 85, "completion_time": 600}', 'videos/senior1_cognitive1.mp4'),
    ('660e8400-e29b-41d4-a716-446655440002', '{"test_type": "attention", "score": 78, "completion_time": 450}', 'videos/senior3_cognitive1.mp4');