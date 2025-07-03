-- Sample data for development
INSERT INTO organisations (id, name, licence_seats) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Seoul Medical Center', 100),
    ('550e8400-e29b-41d4-a716-446655440001', 'Busan Health Clinic', 50);

INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, guardian_phone, note) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '김철수', 'M', '1958-05-15', 'high', '010-1234-5678', '010-1111-2222', '무릎 관절염 병력 있음'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '이영희', 'F', '1960-08-22', 'middle', '010-2345-6789', '010-3333-4444', '당뇨 관리 중'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '박민수', 'M', '1955-12-03', 'college', '010-3456-7890', '010-5555-6666', ''),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '최영숙', 'F', '1962-03-18', 'elementary', '010-4567-8901', '010-7777-8888', ''),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '김영호', 'M', '1959-11-25', 'high', '010-5678-9012', '010-9999-0000', '고혈압 관리 중');

INSERT INTO schedules (senior_id, start_date, end_date, sessions_per_week, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '2024-01-01', '2024-03-31', 3, 'Active'),
    ('660e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2024-04-15', 2, 'Active'),
    ('660e8400-e29b-41d4-a716-446655440002', '2023-10-01', '2023-12-31', 5, 'Completed'),
    ('660e8400-e29b-41d4-a716-446655440003', '2024-02-01', '2024-05-01', 2, 'Active'),
    ('660e8400-e29b-41d4-a716-446655440004', '2024-01-01', '2024-04-01', 3, 'Active');

-- Sample motor results
INSERT INTO motor_results (senior_id, raw, video_key, bpm) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '{"exercise_type": "walking", "duration": 1800, "steps": 2400, "distance": 1.8}', 'videos/senior1_session1.mp4', 85),
    ('660e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "arm_movement", "duration": 900, "repetitions": 15, "intensity": "moderate"}', 'videos/senior2_session1.mp4', 92),
    ('660e8400-e29b-41d4-a716-446655440002', '{"exercise_type": "balance", "duration": 1200, "stability_score": 78}', 'videos/senior3_session1.mp4', 88),
    ('660e8400-e29b-41d4-a716-446655440000', '{"exercise_type": "walking", "duration": 1900, "steps": 2600, "distance": 2.1}', 'videos/senior1_session2.mp4', 82),
    ('660e8400-e29b-41d4-a716-446655440001', '{"exercise_type": "stretching", "duration": 600, "flexibility_score": 85}', 'videos/senior2_session2.mp4', 78);

-- Sample cognitive results  
INSERT INTO cognitive_results (senior_id, raw, video_key) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '{"test_type": "memory", "score": 85, "completion_time": 600, "correct_answers": 17, "total_questions": 20}', 'videos/senior1_cognitive1.mp4'),
    ('660e8400-e29b-41d4-a716-446655440002', '{"test_type": "attention", "score": 78, "completion_time": 450, "reaction_time_avg": 1.2}', 'videos/senior3_cognitive1.mp4'),
    ('660e8400-e29b-41d4-a716-446655440001', '{"test_type": "problem_solving", "score": 92, "completion_time": 800, "steps_to_solution": 12}', 'videos/senior2_cognitive1.mp4'),
    ('660e8400-e29b-41d4-a716-446655440000', '{"test_type": "memory", "score": 88, "completion_time": 580, "correct_answers": 18, "total_questions": 20}', 'videos/senior1_cognitive2.mp4');