-- Minimal setup - just create tables and add super admin
-- Execute this step by step in Supabase SQL Editor

-- Step 1: Create enums
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'org_admin', 'staff', 'viewer');

-- Step 2: Create table WITHOUT RLS first
CREATE TABLE user_roles (
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

-- Step 3: Insert super admin role
INSERT INTO user_roles (user_id, role, org_id) 
VALUES ('91f360ba-2c8b-4256-a82a-538066030d9f', 'super_admin', null);

-- Step 4: Verify
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'todays777@gmail.com';