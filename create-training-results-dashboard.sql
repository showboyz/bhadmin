-- Create realistic training results for Andrew's Clinic Dashboard
-- This creates a pattern of activity that will show meaningful dashboard data

-- Motor training results
-- Very active users (김철수, 이영희, 박지민) - recent activity including today
INSERT INTO motor_results (id, senior_id, raw, video_key, bpm, created_at) VALUES
-- 김철수 (550e8400-e29b-41d4-a716-446655440001) - Very active, including today
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "balance_training", "duration_minutes": 15, "difficulty": "medium", "score": 85, "repetitions": 12}', 'videos/kim_balance_001.mp4', 72, NOW()),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "strength_training", "duration_minutes": 20, "difficulty": "easy", "score": 78, "repetitions": 15}', 'videos/kim_strength_001.mp4', 68, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "flexibility", "duration_minutes": 12, "difficulty": "easy", "score": 82, "repetitions": 8}', 'videos/kim_flex_001.mp4', 65, NOW() - INTERVAL '2 days'),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "cardio", "duration_minutes": 18, "difficulty": "medium", "score": 75, "repetitions": 20}', 'videos/kim_cardio_001.mp4', 75, NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "balance_training", "duration_minutes": 16, "difficulty": "medium", "score": 88, "repetitions": 14}', 'videos/kim_balance_002.mp4', 70, NOW() - INTERVAL '6 days'),

-- 이영희 (550e8400-e29b-41d4-a716-446655440002) - Active, including today
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "gentle_movement", "duration_minutes": 10, "difficulty": "easy", "score": 70, "repetitions": 6}', 'videos/lee_gentle_001.mp4', 62, NOW()),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "balance_training", "duration_minutes": 12, "difficulty": "easy", "score": 65, "repetitions": 8}', 'videos/lee_balance_001.mp4', 64, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "strength_training", "duration_minutes": 8, "difficulty": "easy", "score": 72, "repetitions": 5}', 'videos/lee_strength_001.mp4', 66, NOW() - INTERVAL '3 days'),
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "flexibility", "duration_minutes": 15, "difficulty": "easy", "score": 68, "repetitions": 10}', 'videos/lee_flex_001.mp4', 60, NOW() - INTERVAL '5 days'),

-- 박지민 (550e8400-e29b-41d4-a716-446655440003) - Active yesterday
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "strength_training", "duration_minutes": 25, "difficulty": "hard", "score": 92, "repetitions": 18}', 'videos/park_strength_001.mp4', 78, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "cardio", "duration_minutes": 30, "difficulty": "medium", "score": 87, "repetitions": 25}', 'videos/park_cardio_001.mp4', 80, NOW() - INTERVAL '3 days'),
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "balance_training", "duration_minutes": 20, "difficulty": "medium", "score": 90, "repetitions": 15}', 'videos/park_balance_001.mp4', 76, NOW() - INTERVAL '5 days'),

-- 최민수 (550e8400-e29b-41d4-a716-446655440004) - Recent activity
('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "gentle_movement", "duration_minutes": 8, "difficulty": "easy", "score": 55, "repetitions": 4}', 'videos/choi_gentle_001.mp4', 58, NOW() - INTERVAL '2 days'),
('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "flexibility", "duration_minutes": 12, "difficulty": "easy", "score": 62, "repetitions": 6}', 'videos/choi_flex_001.mp4', 60, NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "balance_training", "duration_minutes": 10, "difficulty": "easy", "score": 58, "repetitions": 7}', 'videos/choi_balance_001.mp4', 56, NOW() - INTERVAL '6 days'),

-- 정수연 (550e8400-e29b-41d4-a716-446655440005) - Moderate activity
('750e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "gentle_movement", "duration_minutes": 15, "difficulty": "easy", "score": 75, "repetitions": 10}', 'videos/jung_gentle_001.mp4', 63, NOW() - INTERVAL '3 days'),
('750e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "flexibility", "duration_minutes": 18, "difficulty": "medium", "score": 72, "repetitions": 12}', 'videos/jung_flex_001.mp4', 65, NOW() - INTERVAL '6 days'),

-- 강동훈 (550e8400-e29b-41d4-a716-446655440006) - Weekly activity
('750e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440006', '{"exercise_type": "balance_training", "duration_minutes": 14, "difficulty": "medium", "score": 68, "repetitions": 9}', 'videos/kang_balance_001.mp4', 67, NOW() - INTERVAL '5 days'),

-- 윤미라 (550e8400-e29b-41d4-a716-446655440007) - Weekly activity  
('750e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440007', '{"exercise_type": "balance_training", "duration_minutes": 16, "difficulty": "medium", "score": 71, "repetitions": 11}', 'videos/yoon_balance_001.mp4', 69, NOW() - INTERVAL '4 days'),

-- New users with some initial activity
-- 임재혁 (550e8400-e29b-41d4-a716-446655440010) 
('750e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '{"exercise_type": "gentle_movement", "duration_minutes": 10, "difficulty": "easy", "score": 60, "repetitions": 5}', 'videos/lim_gentle_001.mp4', 61, NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', '{"exercise_type": "flexibility", "duration_minutes": 8, "difficulty": "easy", "score": 58, "repetitions": 4}', 'videos/lim_flex_001.mp4', 59, NOW() - INTERVAL '3 days'),

-- 백현우 (550e8400-e29b-41d4-a716-446655440012) - New and eager
('750e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "strength_training", "duration_minutes": 20, "difficulty": "medium", "score": 80, "repetitions": 15}', 'videos/baek_strength_001.mp4', 74, NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- Cognitive training results  
INSERT INTO cognitive_results (id, senior_id, raw, video_key, created_at) VALUES
-- Very active users with cognitive training
-- 김철수 cognitive results
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "memory_game", "duration_minutes": 12, "difficulty": "medium", "score": 78, "accuracy": 0.85, "reaction_time_ms": 1200}', 'videos/kim_memory_001.mp4', NOW()),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "attention_training", "duration_minutes": 15, "difficulty": "medium", "score": 82, "accuracy": 0.88, "reaction_time_ms": 1100}', 'videos/kim_attention_001.mp4', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "problem_solving", "duration_minutes": 18, "difficulty": "hard", "score": 75, "accuracy": 0.82, "reaction_time_ms": 1400}', 'videos/kim_problem_001.mp4', NOW() - INTERVAL '3 days'),

-- 이영희 cognitive results (dementia early stage)
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "memory_game", "duration_minutes": 10, "difficulty": "easy", "score": 65, "accuracy": 0.70, "reaction_time_ms": 1800}', 'videos/lee_memory_001.mp4', NOW()),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "attention_training", "duration_minutes": 8, "difficulty": "easy", "score": 62, "accuracy": 0.68, "reaction_time_ms": 2000}', 'videos/lee_attention_001.mp4', NOW() - INTERVAL '2 days'),
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "memory_game", "duration_minutes": 12, "difficulty": "easy", "score": 68, "accuracy": 0.72, "reaction_time_ms": 1900}', 'videos/lee_memory_002.mp4', NOW() - INTERVAL '4 days'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "attention_training", "duration_minutes": 10, "difficulty": "easy", "score": 60, "accuracy": 0.65, "reaction_time_ms": 2100}', 'videos/lee_attention_002.mp4', NOW() - INTERVAL '6 days'),

-- 박지민 cognitive results  
('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "problem_solving", "duration_minutes": 20, "difficulty": "hard", "score": 88, "accuracy": 0.92, "reaction_time_ms": 900}', 'videos/park_problem_001.mp4', NOW() - INTERVAL '1 day'),
('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', '{"exercise_type": "memory_game", "duration_minutes": 15, "difficulty": "medium", "score": 85, "accuracy": 0.90, "reaction_time_ms": 1000}', 'videos/park_memory_001.mp4', NOW() - INTERVAL '3 days'),

-- 최민수 cognitive results
('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "memory_game", "duration_minutes": 8, "difficulty": "easy", "score": 52, "accuracy": 0.60, "reaction_time_ms": 2200}', 'videos/choi_memory_001.mp4', NOW() - INTERVAL '2 days'),
('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', '{"exercise_type": "attention_training", "duration_minutes": 10, "difficulty": "easy", "score": 55, "accuracy": 0.62, "reaction_time_ms": 2000}', 'videos/choi_attention_001.mp4', NOW() - INTERVAL '5 days'),

-- 정수연 cognitive results
('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', '{"exercise_type": "memory_game", "duration_minutes": 12, "difficulty": "easy", "score": 70, "accuracy": 0.75, "reaction_time_ms": 1600}', 'videos/jung_memory_001.mp4', NOW() - INTERVAL '3 days'),

-- 강동훈 cognitive results  
('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440006', '{"exercise_type": "attention_training", "duration_minutes": 14, "difficulty": "medium", "score": 72, "accuracy": 0.78, "reaction_time_ms": 1300}', 'videos/kang_attention_001.mp4', NOW() - INTERVAL '5 days'),

-- 윤미라 cognitive results
('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', '{"exercise_type": "problem_solving", "duration_minutes": 16, "difficulty": "medium", "score": 76, "accuracy": 0.80, "reaction_time_ms": 1250}', 'videos/yoon_problem_001.mp4', NOW() - INTERVAL '4 days'),

-- New users
-- 임재혁 
('850e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440010', '{"exercise_type": "memory_game", "duration_minutes": 10, "difficulty": "easy", "score": 58, "accuracy": 0.65, "reaction_time_ms": 1700}', 'videos/lim_memory_001.mp4', NOW() - INTERVAL '2 days'),

-- 백현우 
('850e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440012', '{"exercise_type": "attention_training", "duration_minutes": 15, "difficulty": "medium", "score": 79, "accuracy": 0.84, "reaction_time_ms": 1150}', 'videos/baek_attention_001.mp4', NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- Check the created data
SELECT 
    s.name,
    s.gender_enum,
    s.birth,
    EXTRACT(YEAR FROM AGE(s.birth)) as age,
    sch.status as schedule_status,
    sch.sessions_per_week,
    COUNT(DISTINCT mr.id) as motor_results_count,
    COUNT(DISTINCT cr.id) as cognitive_results_count,
    MAX(GREATEST(mr.created_at, cr.created_at)) as last_activity
FROM seniors s
LEFT JOIN schedules sch ON s.id = sch.senior_id
LEFT JOIN motor_results mr ON s.id = mr.senior_id AND mr.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN cognitive_results cr ON s.id = cr.senior_id AND cr.created_at >= NOW() - INTERVAL '7 days'
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4'
GROUP BY s.id, s.name, s.gender_enum, s.birth, sch.status, sch.sessions_per_week
ORDER BY last_activity DESC NULLS LAST;