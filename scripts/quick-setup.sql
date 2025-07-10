-- Quick setup for super admin (run in Supabase SQL Editor)

-- 1. Create enums if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('super_admin', 'org_admin', 'staff', 'viewer');
    END IF;
END $$;

-- 2. Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(user_id, org_id),
    CONSTRAINT check_org_id_for_non_super_admin 
        CHECK (role = 'super_admin' OR org_id IS NOT NULL)
);

-- 3. Find todays777@gmail.com user ID
SELECT id, email FROM auth.users WHERE email = 'todays777@gmail.com';

-- 4. Grant super admin role (replace 'USER_ID_HERE' with actual ID from step 3)
-- INSERT INTO user_roles (user_id, role) VALUES ('USER_ID_HERE', 'super_admin');

-- 5. Verify the role was created
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'todays777@gmail.com';