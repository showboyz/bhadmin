-- Simple fix for super admin setup without RLS recursion
-- Execute this in Supabase SQL Editor

-- 1. Disable RLS temporarily
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Super admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can delete user roles" ON user_roles;

-- 3. Create the super admin role directly (without RLS checks)
INSERT INTO user_roles (user_id, role, org_id) 
VALUES ('91f360ba-2c8b-4256-a82a-538066030d9f', 'super_admin', null)
ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'super_admin';

-- 4. Create simple RLS policies that don't cause recursion
CREATE POLICY "Allow super admin full access" ON user_roles
    FOR ALL
    USING (
        user_id = '91f360ba-2c8b-4256-a82a-538066030d9f'::uuid 
        OR 
        auth.uid() = '91f360ba-2c8b-4256-a82a-538066030d9f'::uuid
    );

-- 5. Create a policy for regular users to see their own roles
CREATE POLICY "Users can see their own roles" ON user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- 6. Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Verify the setup
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'todays777@gmail.com';