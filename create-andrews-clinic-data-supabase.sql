-- Create Andrew's Clinic dummy data for the dashboard
-- Run this in Supabase SQL Editor

-- Update Andrew's Clinic organization details
UPDATE organisations 
SET 
    name = 'Andrew''s Clinic',
    licence_seats = 50,
    org_type = 'clinic',
    contact_email = 'admin@andrewsclinic.com',
    contact_phone = '02-1234-5678',
    address = '{"address": "서울특별시 강남구 논현로 123", "city": "서울", "postal_code": "06292"}',
    is_active = true,
    updated_at = NOW()
WHERE id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Insert Andrew's Clinic if it doesn't exist
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

-- Insert Korean seniors for Andrew's Clinic (12 people)
INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, guardian_phone, address, note, created_at) VALUES
-- Active users (will show in Recent Activity)
('550e8400-e29b-41d4-a716-446655440001', 'bf579a76-e9c5-45be-8659-7e62664883c4', '김철수', 'M', '1952-03-15', 'high', '010-1234-5678', '010-9876-5432', '{"address": "서울특별시 강남구 삼성로 456"}', '고혈압, 당뇨병 관리 중', NOW() - INTERVAL '2 months'),
('550e8400-e29b-41d4-a716-446655440002', 'bf579a76-e9c5-45be-8659-7e62664883c4', '이영희', 'F', '1948-07-22', 'middle', '010-2345-6789', '010-8765-4321', '{"address": "서울특별시 강남구 테헤란로 789"}', '치매 초기 단계', NOW() - INTERVAL '3 months'),
('550e8400-e29b-41d4-a716-446655440003', 'bf579a76-e9c5-45be-8659-7e62664883c4', '박지민', 'F', '1955-11-08', 'college', '010-3456-7890', '010-7654-3210', '{"address": "서울특별시 강남구 역삼로 321"}', '운동 부족으로 근력 약화', NOW() - INTERVAL '1 month'),
('550e8400-e29b-41d4-a716-446655440004', 'bf579a76-e9c5-45be-8659-7e62664883c4', '최민수', 'M', '1950-01-30', 'elementary', '010-4567-8901', '010-6543-2109', '{"address": "서울특별시 강남구 논현로 654"}', '관절염으로 인한 움직임 제한', NOW() - INTERVAL '4 months'),
('550e8400-e29b-41d4-a716-446655440005', 'bf579a76-e9c5-45be-8659-7e62664883c4', '정수연', 'F', '1953-09-14', 'high', '010-5678-9012', '010-5432-1098', '{"address": "서울특별시 강남구 강남대로 987"}', '우울감 호소', NOW() - INTERVAL '2 months'),

-- Moderately active
('550e8400-e29b-41d4-a716-446655440006', 'bf579a76-e9c5-45be-8659-7e62664883c4', '강동훈', 'M', '1949-06-03', 'middle', '010-6789-0123', '010-4321-0987', '{"address": "서울특별시 강남구 선릉로 432"}', '혈압 관리 필요', NOW() - INTERVAL '5 months'),
('550e8400-e29b-41d4-a716-446655440007', 'bf579a76-e9c5-45be-8659-7e62664883c4', '윤미라', 'F', '1951-12-25', 'high', '010-7890-1234', '010-3210-9876', '{"address": "서울특별시 강남구 봉은사로 765"}', '균형감각 개선 필요', NOW() - INTERVAL '3 months'),

-- Less active (will show in Inactive Users)
('550e8400-e29b-41d4-a716-446655440008', 'bf579a76-e9c5-45be-8659-7e62664883c4', '송태호', 'M', '1954-04-17', 'college', '010-8901-2345', '010-2109-8765', '{"address": "서울특별시 강남구 압구정로 543"}', '최근 활동량 감소', NOW() - INTERVAL '6 months'),
('550e8400-e29b-41d4-a716-446655440009', 'bf579a76-e9c5-45be-8659-7e62664883c4', '한소영', 'F', '1947-08-11', 'elementary', '010-9012-3456', '010-1098-7654', '{"address": "서울특별시 강남구 신사로 876"}', '가족 지원 부족', NOW() - INTERVAL '4 months'),

-- New users (this month)  
('550e8400-e29b-41d4-a716-446655440010', 'bf579a76-e9c5-45be-8659-7e62664883c4', '임재혁', 'M', '1952-10-05', 'high', '010-0123-4567', '010-9876-5433', '{"address": "서울특별시 강남구 도산대로 234"}', '신규 등록', NOW() - INTERVAL '2 weeks'),
('550e8400-e29b-41d4-a716-446655440011', 'bf579a76-e9c5-45be-8659-7e62664883c4', '조은숙', 'F', '1956-02-28', 'middle', '010-1234-5679', '010-8765-4322', '{"address": "서울특별시 강남구 언주로 567"}', '신규 등록', NOW() - INTERVAL '1 week'),
('550e8400-e29b-41d4-a716-446655440012', 'bf579a76-e9c5-45be-8659-7e62664883c4', '백현우', 'M', '1950-05-13', 'college', '010-2345-6780', '010-7654-3211', '{"address": "서울특별시 강남구 청담로 890"}', '신규 등록', NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;

-- Create schedules for all seniors
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

-- Create training results with varied activity patterns
-- Active users with recent activity (including today and yesterday)
INSERT INTO motor_results (id, senior_id, raw, video_key, bpm, created_at) VALUES
-- 김철수 - Very active (today)
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "balance_training", "duration_minutes": 15, "score": 85, "repetitions": 12}', 'videos/kim_balance_001.mp4', 72, NOW()),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "strength_training", "duration_minutes": 20, "score": 78, "repetitions": 15}', 'videos/kim_strength_001.mp4', 68, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "flexibility", "duration_minutes": 12, "score": 82, "repetitions": 8}', 'videos/kim_flex_001.mp4', 65, NOW() - INTERVAL '2 days'),

-- 이영희 - Active (today)
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "gentle_movement", "duration_minutes": 10, "score": 70, "repetitions": 6}', 'videos/lee_gentle_001.mp4', 62, NOW()),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "balance_training", "duration_minutes": 12, "score": 65, "repetitions": 8}', 'videos/lee_balance_001.mp4', 64, NOW() - INTERVAL '1 day'),

-- 박지민 - Active (yesterday)
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "strength_training", "duration_minutes": 25, "score": 92, "repetitions": 18}', 'videos/park_strength_001.mp4', 78, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "cardio", "duration_minutes": 30, "score": 87, "repetitions": 25}', 'videos/park_cardio_001.mp4', 80, NOW() - INTERVAL '3 days'),

-- 최민수 - Recent (2 days ago)
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "gentle_movement", "duration_minutes": 8, "score": 55, "repetitions": 4}', 'videos/choi_gentle_001.mp4', 58, NOW() - INTERVAL '2 days'),

-- 정수연 - Recent (3 days ago)
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "gentle_movement", "duration_minutes": 15, "score": 75, "repetitions": 10}', 'videos/jung_gentle_001.mp4', 63, NOW() - INTERVAL '3 days'),

-- Weekly active users
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', '{"exercise_type": "balance_training", "duration_minutes": 14, "score": 68, "repetitions": 9}', 'videos/kang_balance_001.mp4', 67, NOW() - INTERVAL '5 days'),
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440007', '{"exercise_type": "balance_training", "duration_minutes": 16, "score": 71, "repetitions": 11}', 'videos/yoon_balance_001.mp4', 69, NOW() - INTERVAL '4 days'),

-- New users with some activity
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440010', '{"exercise_type": "gentle_movement", "duration_minutes": 10, "score": 60, "repetitions": 5}', 'videos/lim_gentle_001.mp4', 61, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "strength_training", "duration_minutes": 20, "score": 80, "repetitions": 15}', 'videos/baek_strength_001.mp4', 74, NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- Add cognitive results too
INSERT INTO cognitive_results (id, senior_id, raw, video_key, created_at) VALUES
-- Match the motor results with cognitive training
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "memory_game", "duration_minutes": 12, "score": 78, "accuracy": 0.85}', 'videos/kim_memory_001.mp4', NOW()),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "memory_game", "duration_minutes": 10, "score": 65, "accuracy": 0.70}', 'videos/lee_memory_001.mp4', NOW()),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "problem_solving", "duration_minutes": 20, "score": 88, "accuracy": 0.92}', 'videos/park_problem_001.mp4', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "memory_game", "duration_minutes": 8, "score": 52, "accuracy": 0.60}', 'videos/choi_memory_001.mp4', NOW() - INTERVAL '2 days'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "memory_game", "duration_minutes": 12, "score": 70, "accuracy": 0.75}', 'videos/jung_memory_001.mp4', NOW() - INTERVAL '3 days'),
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010', '{"exercise_type": "memory_game", "duration_minutes": 10, "score": 58, "accuracy": 0.65}', 'videos/lim_memory_001.mp4', NOW() - INTERVAL '2 days'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "attention_training", "duration_minutes": 15, "score": 79, "accuracy": 0.84}', 'videos/baek_attention_001.mp4', NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 
    'Andrew''s Clinic Data Summary' as summary,
    (SELECT COUNT(*) FROM seniors WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4') as total_seniors,
    (SELECT COUNT(*) FROM schedules s JOIN seniors sen ON s.senior_id = sen.id WHERE sen.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4') as total_schedules,
    (SELECT COUNT(*) FROM motor_results mr JOIN seniors sen ON mr.senior_id = sen.id WHERE sen.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4') as motor_results,
    (SELECT COUNT(*) FROM cognitive_results cr JOIN seniors sen ON cr.senior_id = sen.id WHERE sen.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4') as cognitive_results;