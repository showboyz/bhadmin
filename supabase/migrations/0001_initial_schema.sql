-- Enable Row Level Security
-- Note: JWT secret will be set via environment variables

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