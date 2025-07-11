-- Supabase 콘솔의 SQL Editor에서 실행할 SQL
-- andrew@test.com 사용자에게 super_admin 역할 추가

-- 1. 먼저 andrew@test.com의 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'andrew@test.com';

-- 2. user_roles 테이블에 super_admin 역할 추가 (위에서 확인한 ID를 사용)
-- 아래 YOUR_USER_ID_HERE를 위에서 확인한 실제 ID로 교체하세요
INSERT INTO user_roles (user_id, org_id, role, created_by)
VALUES (
  'YOUR_USER_ID_HERE', -- 위에서 확인한 사용자 ID로 교체
  NULL, -- super_admin은 특정 조직에 속하지 않음
  'super_admin',
  'YOUR_USER_ID_HERE' -- 동일한 사용자 ID
);

-- 3. 확인: andrew@test.com의 역할 조회
SELECT ur.*, au.email 
FROM user_roles ur 
JOIN auth.users au ON ur.user_id = au.id 
WHERE au.email = 'andrew@test.com';