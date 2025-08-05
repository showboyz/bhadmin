-- 나머지 확인 쿼리들을 실행해주세요

-- 1. Andrew's Clinic 조직 확인
SELECT * FROM organisations WHERE id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 2. 시니어 데이터 확인
SELECT COUNT(*) as total_seniors FROM seniors WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 3. 스케줄 데이터 확인 (가장 중요!)
SELECT COUNT(*) as total_schedules FROM schedules s 
JOIN seniors sen ON s.senior_id = sen.id 
WHERE sen.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 4. 주간 활동 데이터 확인
SELECT COUNT(DISTINCT mr.senior_id) as active_week
FROM motor_results mr
JOIN seniors s ON mr.senior_id = s.id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4'
AND mr.created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 5. 대시보드 쿼리 시뮬레이션 (use-dashboard.ts의 실제 쿼리)
SELECT 
    COUNT(DISTINCT s.id) as total_users,
    COUNT(DISTINCT CASE WHEN mr.created_at >= CURRENT_DATE THEN s.id END) as active_today,
    COUNT(DISTINCT CASE WHEN mr.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN s.id END) as active_week,
    COUNT(CASE WHEN s.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_users_month
FROM seniors s
INNER JOIN schedules sch ON s.id = sch.senior_id  -- 이 INNER JOIN이 핵심!
LEFT JOIN motor_results mr ON s.id = mr.senior_id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';