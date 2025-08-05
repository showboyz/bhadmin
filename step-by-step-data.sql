-- Step by step data creation for Andrew's Clinic
-- Execute each section separately in Supabase SQL Editor

-- STEP 1: Check if Andrew's Clinic organization exists
SELECT * FROM organisations WHERE id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- STEP 2: Create Andrew's Clinic organization (if not exists)
INSERT INTO organisations (id, name, licence_seats, created_at)
VALUES (
    'bf579a76-e9c5-45be-8659-7e62664883c4',
    'Andrew''s Clinic',
    50,
    NOW() - INTERVAL '2 months'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    licence_seats = EXCLUDED.licence_seats;

-- STEP 3: Create 3 seniors (start small)
INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'bf579a76-e9c5-45be-8659-7e62664883c4', '김철수', 'M', '1952-03-15', 'high', '010-1234-5678', NOW() - INTERVAL '2 months'),
('550e8400-e29b-41d4-a716-446655440002', 'bf579a76-e9c5-45be-8659-7e62664883c4', '이영희', 'F', '1948-07-22', 'middle', '010-2345-6789', NOW() - INTERVAL '3 months'),
('550e8400-e29b-41d4-a716-446655440003', 'bf579a76-e9c5-45be-8659-7e62664883c4', '박지민', 'F', '1955-11-08', 'college', '010-3456-7890', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Verify seniors were created
SELECT COUNT(*) as total_seniors FROM seniors WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- STEP 5: Create motor results for today (3 users active today)
INSERT INTO motor_results (id, senior_id, raw, video_key, bpm, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "balance_training", "score": 85}', 'videos/kim_balance.mp4', 72, NOW() - INTERVAL '2 hours'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "gentle_movement", "score": 70}', 'videos/lee_gentle.mp4', 62, NOW() - INTERVAL '1 hour'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "strength_training", "score": 92}', 'videos/park_strength.mp4', 78, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- STEP 6: Verify motor results
SELECT COUNT(*) as motor_results_today 
FROM motor_results mr 
JOIN seniors s ON mr.senior_id = s.id 
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4' 
AND mr.created_at >= CURRENT_DATE;

-- STEP 7: Check what the dashboard query should return
SELECT 
    COUNT(DISTINCT s.id) as total_users,
    COUNT(DISTINCT CASE WHEN mr.created_at >= CURRENT_DATE THEN s.id END) as active_today,
    COUNT(DISTINCT CASE WHEN mr.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN s.id END) as active_week
FROM seniors s
LEFT JOIN motor_results mr ON s.id = mr.senior_id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';