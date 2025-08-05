-- Create comprehensive dummy data for Andrew's Clinic Dashboard
-- Run this in Supabase SQL Editor

-- First, let's check if Andrew's Clinic exists
SELECT id, name, licence_seats FROM organisations WHERE name ILIKE '%andrew%clinic%';

-- If not found, let's see all organizations
SELECT id, name, licence_seats FROM organisations ORDER BY name;

-- Create Andrew's Clinic if it doesn't exist (update the org_id as needed)
INSERT INTO organisations (id, name, licence_seats, org_type, contact_email, contact_phone, address, is_active) 
VALUES (
  'bf579a76-e9c5-45be-8659-7e62664883c4',
  'Andrew''s Clinic',
  50,
  'clinic',
  'admin@andrewsclinic.com',
  '02-1234-5678',
  '{"address": "서울특별시 강남구 논현로 123", "city": "서울", "postal_code": "06292"}',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  licence_seats = EXCLUDED.licence_seats,
  org_type = EXCLUDED.org_type,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active;

-- Create realistic Korean seniors for Andrew's Clinic
INSERT INTO seniors (id, org_id, name, gender_enum, birth, eduyear, phone, guardian_phone, address, note, created_at) VALUES
-- Active seniors (will have recent training data)
('550e8400-e29b-41d4-a716-446655440001', 'bf579a76-e9c5-45be-8659-7e62664883c4', '김철수', 'M', '1952-03-15', 'high', '010-1234-5678', '010-9876-5432', '{"address": "서울특별시 강남구 삼성로 456", "city": "서울"}', '고혈압, 당뇨병 관리 중', NOW() - INTERVAL '2 months'),
('550e8400-e29b-41d4-a716-446655440002', 'bf579a76-e9c5-45be-8659-7e62664883c4', '이영희', 'F', '1948-07-22', 'middle', '010-2345-6789', '010-8765-4321', '{"address": "서울특별시 강남구 테헤란로 789", "city": "서울"}', '치매 초기 단계, 주 3회 인지훈련 권장', NOW() - INTERVAL '3 months'),
('550e8400-e29b-41d4-a716-446655440003', 'bf579a76-e9c5-45be-8659-7e62664883c4', '박지민', 'F', '1955-11-08', 'college', '010-3456-7890', '010-7654-3210', '{"address": "서울특별시 강남구 역삼로 321", "city": "서울"}', '운동 부족으로 근력 약화', NOW() - INTERVAL '1 months'),
('550e8400-e29b-41d4-a716-446655440004', 'bf579a76-e9c5-45be-8659-7e62664883c4', '최민수', 'M', '1950-01-30', 'elementary', '010-4567-8901', '010-6543-2109', '{"address": "서울특별시 강남구 논현로 654", "city": "서울"}', '관절염으로 인한 움직임 제한', NOW() - INTERVAL '4 months'),
('550e8400-e29b-41d4-a716-446655440005', 'bf579a76-e9c5-45be-8659-7e62664883c4', '정수연', 'F', '1953-09-14', 'high', '010-5678-9012', '010-5432-1098', '{"address": "서울특별시 강남구 강남대로 987", "city": "서울"}', '우울감 호소, 사회적 활동 부족', NOW() - INTERVAL '2 months'),

-- Moderately active seniors
('550e8400-e29b-41d4-a716-446655440006', 'bf579a76-e9c5-45be-8659-7e62664883c4', '강동훈', 'M', '1949-06-03', 'middle', '010-6789-0123', '010-4321-0987', '{"address": "서울특별시 강남구 선릉로 432", "city": "서울"}', '혈압 관리 필요', NOW() - INTERVAL '5 months'),
('550e8400-e29b-41d4-a716-446655440007', 'bf579a76-e29b-41d4-a716-446655440007', '윤미라', 'F', '1951-12-25', 'high', '010-7890-1234', '010-3210-9876', '{"address": "서울특별시 강남구 봉은사로 765", "city": "서울"}', '균형감각 개선 필요', NOW() - INTERVAL '3 months'),

-- Less active seniors (for inactive users section) 
('550e8400-e29b-41d4-a716-446655440008', 'bf579a76-e9c5-45be-8659-7e62664883c4', '송태호', 'M', '1954-04-17', 'college', '010-8901-2345', '010-2109-8765', '{"address": "서울특별시 강남구 압구정로 543", "city": "서울"}', '최근 활동량 감소', NOW() - INTERVAL '6 months'),
('550e8400-e29b-41d4-a716-446655440009', 'bf579a76-e9c5-45be-8659-7e62664883c4', '한소영', 'F', '1947-08-11', 'elementary', '010-9012-3456', '010-1098-7654', '{"address": "서울특별시 강남구 신사로 876", "city": "서울"}', '가족 지원 부족으로 참여도 낮음', NOW() - INTERVAL '4 months'),

-- New users (this month)
('550e8400-e29b-41d4-a716-446655440010', 'bf579a76-e9c5-45be-8659-7e62664883c4', '임재혁', 'M', '1952-10-05', 'high', '010-0123-4567', '010-9876-5433', '{"address": "서울특별시 강남구 도산대로 234", "city": "서울"}', '신규 등록, 적응 기간 중', NOW() - INTERVAL '2 weeks'),
('550e8400-e29b-41d4-a716-446655440011', 'bf579a76-e9c5-45be-8659-7e62664883c4', '조은숙', 'F', '1956-02-28', 'middle', '010-1234-5679', '010-8765-4322', '{"address": "서울특별시 강남구 언주로 567", "city": "서울"}', '신규 등록, 동기 부여 필요', NOW() - INTERVAL '1 week'),
('550e8400-e29b-41d4-a716-446655440012', 'bf579a76-e9c5-45be-8659-7e62664883c4', '백현우', 'M', '1950-05-13', 'college', '010-2345-6780', '010-7654-3211', '{"address": "서울특별시 강남구 청담로 890", "city": "서울"}', '신규 등록, 의욕적', NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;

-- Create training schedules for seniors
INSERT INTO schedules (id, senior_id, start_date, end_date, sessions_per_week, status, created_at) VALUES
-- Active schedules for currently active seniors
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '1 month'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 4, 'Active', NOW() - INTERVAL '2 months'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '2 months', 2, 'Active', NOW() - INTERVAL '3 weeks'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '6 weeks', 3, 'Active', NOW() - INTERVAL '1 month'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '6 weeks', CURRENT_DATE + INTERVAL '1 month', 2, 'Active', NOW() - INTERVAL '6 weeks'),

-- Moderately active
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 2, 'Active', NOW() - INTERVAL '2 months'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 3, 'Active', NOW() - INTERVAL '1 month'),

-- Less active (these will show as inactive users)
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '1 week', 2, 'Active', NOW() - INTERVAL '3 months'),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '2 weeks', 2, 'Active', NOW() - INTERVAL '2 months'),

-- New users
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '3 months', 3, 'Active', NOW() - INTERVAL '2 weeks'),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '3 months', 2, 'Active', NOW() - INTERVAL '1 week'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 months', 4, 'Active', NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;