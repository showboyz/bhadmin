-- Add schedules data for Andrew's Clinic seniors
-- This is the missing piece causing dashboard to show 0 values

-- First, check existing seniors
SELECT id, name FROM seniors WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Add schedules for all seniors (this is required for dashboard to show data)
INSERT INTO schedules (id, senior_id, start_date, end_date, sessions_per_week, status, created_at) VALUES
-- 김철수
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '1 month'),
-- 이영희
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 2, 'Active', NOW() - INTERVAL '2 months'),
-- 박지민
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '3 weeks')
ON CONFLICT (id) DO NOTHING;

-- Verify schedules were created
SELECT 
    s.name,
    sch.status,
    sch.sessions_per_week,
    sch.start_date,
    sch.end_date
FROM seniors s
JOIN schedules sch ON s.id = sch.senior_id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Test the dashboard query (this should now return data)
SELECT 
    COUNT(DISTINCT s.id) as total_seniors,
    s.name,
    sch.status
FROM seniors s
INNER JOIN schedules sch ON s.id = sch.senior_id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4'
GROUP BY s.name, sch.status;