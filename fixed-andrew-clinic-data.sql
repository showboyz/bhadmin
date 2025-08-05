-- Fixed SQL for Andrew's Clinic Dashboard Data
-- Run this in Supabase SQL Editor

-- First, find the user ID for todays777@gmail.com
SELECT id, email FROM auth.users WHERE email = 'todays777@gmail.com';

-- Add user roles (corrected ON CONFLICT syntax)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'todays777@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Add super admin role (org_id = NULL for super admin)
        INSERT INTO user_roles (user_id, org_id, role, created_by) 
        VALUES (target_user_id, NULL, 'super_admin', target_user_id)
        ON CONFLICT (user_id, org_id) DO NOTHING;
        
        -- Add org admin role for Andrew's Clinic
        INSERT INTO user_roles (user_id, org_id, role, created_by) 
        VALUES (target_user_id, 'bf579a76-e9c5-45be-8659-7e62664883c4', 'org_admin', target_user_id)
        ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role;
        
        RAISE NOTICE 'User roles added for user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User todays777@gmail.com not found';
    END IF;
END $$;

-- Ensure Andrew's Clinic organization exists
INSERT INTO organisations (id, name, licence_seats, org_type, contact_email, contact_phone, address, is_active, created_at)
VALUES (
    'bf579a76-e9c5-45be-8659-7e62664883c4',
    'Andrew''s Clinic',
    50,
    'clinic',
    'admin@andrewsclinic.com',
    '02-1234-5678',
    '{"address": "서울특별시 강남구 논현로 123", "city": "서울", "postal_code": "06292"}',
    true,
    NOW() - INTERVAL '2 months'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    licence_seats = EXCLUDED.licence_seats,
    org_type = EXCLUDED.org_type,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active;

-- Create seniors with realistic Korean names and data
INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, guardian_phone, address, note, created_at) VALUES
-- Active users (will appear in Recent Activity Top 5)
('550e8400-e29b-41d4-a716-446655440001', 'bf579a76-e9c5-45be-8659-7e62664883c4', '김철수', 'M', '1952-03-15', 'high', '010-1234-5678', '010-9876-5432', '{"address": "서울특별시 강남구 삼성로 456", "city": "서울"}', '고혈압, 당뇨병 관리 중', NOW() - INTERVAL '2 months'),
('550e8400-e29b-41d4-a716-446655440002', 'bf579a76-e9c5-45be-8659-7e62664883c4', '이영희', 'F', '1948-07-22', 'middle', '010-2345-6789', '010-8765-4321', '{"address": "서울특별시 강남구 테헤란로 789", "city": "서울"}', '치매 초기 단계, 주 3회 인지훈련 권장', NOW() - INTERVAL '3 months'),
('550e8400-e29b-41d4-a716-446655440003', 'bf579a76-e9c5-45be-8659-7e62664883c4', '박지민', 'F', '1955-11-08', 'college', '010-3456-7890', '010-7654-3210', '{"address": "서울특별시 강남구 역삼로 321", "city": "서울"}', '운동 부족으로 근력 약화', NOW() - INTERVAL '1 month'),
('550e8400-e29b-41d4-a716-446655440004', 'bf579a76-e9c5-45be-8659-7e62664883c4', '최민수', 'M', '1950-01-30', 'elementary', '010-4567-8901', '010-6543-2109', '{"address": "서울특별시 강남구 논현로 654", "city": "서울"}', '관절염으로 인한 움직임 제한', NOW() - INTERVAL '4 months'),
('550e8400-e29b-41d4-a716-446655440005', 'bf579a76-e9c5-45be-8659-7e62664883c4', '정수연', 'F', '1953-09-14', 'high', '010-5678-9012', '010-5432-1098', '{"address": "서울특별시 강남구 강남대로 987", "city": "서울"}', '우울감 호소, 사회적 활동 부족', NOW() - INTERVAL '2 months'),

-- Weekly active users
('550e8400-e29b-41d4-a716-446655440006', 'bf579a76-e9c5-45be-8659-7e62664883c4', '강동훈', 'M', '1949-06-03', 'middle', '010-6789-0123', '010-4321-0987', '{"address": "서울특별시 강남구 선릉로 432", "city": "서울"}', '혈압 관리 필요', NOW() - INTERVAL '5 months'),
('550e8400-e29b-41d4-a716-446655440007', 'bf579a76-e9c5-45be-8659-7e62664883c4', '윤미라', 'F', '1951-12-25', 'high', '010-7890-1234', '010-3210-9876', '{"address": "서울특별시 강남구 봉은사로 765", "city": "서울"}', '균형감각 개선 필요', NOW() - INTERVAL '3 months'),

-- Inactive users (will appear in Inactive Users table)
('550e8400-e29b-41d4-a716-446655440008', 'bf579a76-e9c5-45be-8659-7e62664883c4', '송태호', 'M', '1954-04-17', 'college', '010-8901-2345', '010-2109-8765', '{"address": "서울특별시 강남구 압구정로 543", "city": "서울"}', '최근 활동량 감소', NOW() - INTERVAL '6 months'),
('550e8400-e29b-41d4-a716-446655440009', 'bf579a76-e9c5-45be-8659-7e62664883c4', '한소영', 'F', '1947-08-11', 'elementary', '010-9012-3456', '010-1098-7654', '{"address": "서울특별시 강남구 신사로 876", "city": "서울"}', '가족 지원 부족으로 참여도 낮음', NOW() - INTERVAL '4 months'),

-- New users this month (will contribute to "New Users This Month" KPI)
('550e8400-e29b-41d4-a716-446655440010', 'bf579a76-e9c5-45be-8659-7e62664883c4', '임재혁', 'M', '1952-10-05', 'high', '010-0123-4567', '010-9876-5433', '{"address": "서울특별시 강남구 도산대로 234", "city": "서울"}', '신규 등록, 적응 기간 중', NOW() - INTERVAL '2 weeks'),
('550e8400-e29b-41d4-a716-446655440011', 'bf579a76-e9c5-45be-8659-7e62664883c4', '조은숙', 'F', '1956-02-28', 'middle', '010-1234-5679', '010-8765-4322', '{"address": "서울특별시 강남구 언주로 567", "city": "서울"}', '신규 등록, 동기 부여 필요', NOW() - INTERVAL '1 week'),
('550e8400-e29b-41d4-a716-446655440012', 'bf579a76-e9c5-45be-8659-7e62664883c4', '백현우', 'M', '1950-05-13', 'college', '010-2345-6780', '010-7654-3211', '{"address": "서울특별시 강남구 청담로 890", "city": "서울"}', '신규 등록, 의욕적', NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;

-- Create active schedules for all seniors
INSERT INTO schedules (id, senior_id, start_date, end_date, sessions_per_week, status, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '1 month'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 4, 'Active', NOW() - INTERVAL '2 months'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '2 months', 2, 'Active', NOW() - INTERVAL '3 weeks'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '6 weeks', 3, 'Active', NOW() - INTERVAL '1 month'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '6 weeks', CURRENT_DATE + INTERVAL '1 month', 2, 'Active', NOW() - INTERVAL '6 weeks'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 2, 'Active', NOW() - INTERVAL '2 months'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '1 month'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '1 week', 2, 'Active', NOW() - INTERVAL '3 months'),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '2 weeks', 2, 'Active', NOW() - INTERVAL '2 months'),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '3 months', 3, 'Active', NOW() - INTERVAL '2 weeks'),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '3 months', 2, 'Active', NOW() - INTERVAL '1 week'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 months', 4, 'Active', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Create training results with activity patterns that match expected KPI values
-- Pattern: 3 active today, 7 active this week, 2 inactive (3+ days no activity)

-- ACTIVE TODAY (3 users: 김철수, 이영희, 박지민)
INSERT INTO motor_results (id, senior_id, raw, video_key, bpm, created_at) VALUES
-- 김철수 - Active today
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "balance_training", "duration_minutes": 15, "score": 85, "repetitions": 12, "difficulty": "medium"}', 'videos/kim_balance_today.mp4', 72, NOW() - INTERVAL '2 hours'),
-- 이영희 - Active today  
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "gentle_movement", "duration_minutes": 10, "score": 70, "repetitions": 6, "difficulty": "easy"}', 'videos/lee_gentle_today.mp4', 62, NOW() - INTERVAL '1 hour'),
-- 박지민 - Active today
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "strength_training", "duration_minutes": 25, "score": 92, "repetitions": 18, "difficulty": "hard"}', 'videos/park_strength_today.mp4', 78, NOW() - INTERVAL '30 minutes'),

-- ACTIVE THIS WEEK (additional 4 users: 최민수, 정수연, 강동훈, 윤미라)
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "gentle_movement", "duration_minutes": 8, "score": 55, "repetitions": 4, "difficulty": "easy"}', 'videos/choi_gentle_week.mp4', 58, NOW() - INTERVAL '2 days'),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "flexibility", "duration_minutes": 15, "score": 75, "repetitions": 10, "difficulty": "easy"}', 'videos/jung_flex_week.mp4', 63, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '{"exercise_type": "balance_training", "duration_minutes": 14, "score": 68, "repetitions": 9, "difficulty": "medium"}', 'videos/kang_balance_week.mp4', 67, NOW() - INTERVAL '5 days'),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '{"exercise_type": "balance_training", "duration_minutes": 16, "score": 71, "repetitions": 11, "difficulty": "medium"}', 'videos/yoon_balance_week.mp4', 69, NOW() - INTERVAL '4 days'),

-- SOME ACTIVITY FROM NEW USERS (백현우 has activity, others less so)
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "strength_training", "duration_minutes": 20, "score": 80, "repetitions": 15, "difficulty": "medium"}', 'videos/baek_strength_new.mp4', 74, NOW() - INTERVAL '1 day'),

-- INACTIVE USERS: 송태호, 한소영 (no recent activity - will appear in Inactive Users table)
-- No recent training results for them - last activity was more than 3 days ago
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', '{"exercise_type": "gentle_movement", "duration_minutes": 6, "score": 45, "repetitions": 3, "difficulty": "easy"}', 'videos/song_gentle_old.mp4', 55, NOW() - INTERVAL '8 days'),
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440009', '{"exercise_type": "flexibility", "duration_minutes": 8, "score": 48, "repetitions": 4, "difficulty": "easy"}', 'videos/han_flex_old.mp4', 60, NOW() - INTERVAL '5 days')

ON CONFLICT (id) DO NOTHING;

-- Add cognitive results matching the motor results pattern
INSERT INTO cognitive_results (id, senior_id, raw, video_key, created_at) VALUES
-- Active today users
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "memory_game", "duration_minutes": 12, "score": 78, "accuracy": 0.85, "reaction_time_ms": 1200}', 'videos/kim_memory_today.mp4', NOW() - INTERVAL '2 hours'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "memory_game", "duration_minutes": 10, "score": 65, "accuracy": 0.70, "reaction_time_ms": 1800}', 'videos/lee_memory_today.mp4', NOW() - INTERVAL '1 hour'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "problem_solving", "duration_minutes": 20, "score": 88, "accuracy": 0.92, "reaction_time_ms": 900}', 'videos/park_problem_today.mp4', NOW() - INTERVAL '30 minutes'),

-- Weekly active users
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "memory_game", "duration_minutes": 8, "score": 52, "accuracy": 0.60, "reaction_time_ms": 2200}', 'videos/choi_memory_week.mp4', NOW() - INTERVAL '2 days'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "attention_training", "duration_minutes": 12, "score": 70, "accuracy": 0.75, "reaction_time_ms": 1600}', 'videos/jung_attention_week.mp4', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '{"exercise_type": "attention_training", "duration_minutes": 14, "score": 72, "accuracy": 0.78, "reaction_time_ms": 1300}', 'videos/kang_attention_week.mp4', NOW() - INTERVAL '5 days'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '{"exercise_type": "problem_solving", "duration_minutes": 16, "score": 76, "accuracy": 0.80, "reaction_time_ms": 1250}', 'videos/yoon_problem_week.mp4', NOW() - INTERVAL '4 days'),

-- New user with some activity
('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "attention_training", "duration_minutes": 15, "score": 79, "accuracy": 0.84, "reaction_time_ms": 1150}', 'videos/baek_attention_new.mp4', NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- Verify the data creation
SELECT 
    'Andrew''s Clinic Dashboard Data Summary' as summary,
    COUNT(*) as total_seniors,
    COUNT(CASE WHEN gender_enum = 'M' THEN 1 END) as male_count,
    COUNT(CASE WHEN gender_enum = 'F' THEN 1 END) as female_count,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END) as new_users_this_month
FROM seniors 
WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Check activity patterns
SELECT 
    'Activity Analysis' as analysis,
    COUNT(DISTINCT mr.senior_id) as motor_active_today,
    COUNT(DISTINCT cr.senior_id) as cognitive_active_today,
    (SELECT COUNT(DISTINCT senior_id) FROM motor_results mr2 
     JOIN seniors s2 ON mr2.senior_id = s2.id 
     WHERE s2.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4' 
     AND mr2.created_at >= CURRENT_DATE - INTERVAL '7 days') as motor_active_week,
    (SELECT COUNT(DISTINCT senior_id) FROM cognitive_results cr2 
     JOIN seniors s3 ON cr2.senior_id = s3.id 
     WHERE s3.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4' 
     AND cr2.created_at >= CURRENT_DATE - INTERVAL '7 days') as cognitive_active_week
FROM motor_results mr
JOIN seniors s ON mr.senior_id = s.id
LEFT JOIN cognitive_results cr ON cr.senior_id = s.id AND cr.created_at >= CURRENT_DATE
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4' 
AND mr.created_at >= CURRENT_DATE;