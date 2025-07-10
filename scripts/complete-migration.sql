-- Complete migration for super admin system
-- Execute this in Supabase SQL Editor

-- 1. Create enums (skip if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('super_admin', 'org_admin', 'staff', 'viewer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_enum') THEN
        CREATE TYPE subscription_plan_enum AS ENUM ('basic', 'premium', 'enterprise');
    END IF;
END $$;

-- 2. Create user_roles table (skip if already exists)
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

-- 3. Create organization_settings table (skip if already exists)
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE UNIQUE,
    subscription_plan subscription_plan_enum DEFAULT 'basic',
    license_limit INTEGER DEFAULT 50,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    org_type TEXT DEFAULT 'clinic' CHECK (org_type IN ('clinic', 'hospital', 'care_center')),
    address JSONB,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    api_access_enabled BOOLEAN DEFAULT TRUE,
    data_retention_days INTEGER DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_start_date DATE,
    subscription_end_date DATE,
    last_billing_date DATE,
    next_billing_date DATE
);

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 5. Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Super admins can view all user roles" ON user_roles;
    DROP POLICY IF EXISTS "Super admins can insert user roles" ON user_roles;
    DROP POLICY IF EXISTS "Super admins can update user roles" ON user_roles;
    DROP POLICY IF EXISTS "Super admins can delete user roles" ON user_roles;
    
    -- Create new policies
    CREATE POLICY "Super admins can view all user roles" ON user_roles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
        );

    CREATE POLICY "Super admins can insert user roles" ON user_roles
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
        );

    CREATE POLICY "Super admins can update user roles" ON user_roles
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
        );

    CREATE POLICY "Super admins can delete user roles" ON user_roles
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some policies may already exist';
END $$;

-- 7. Grant super admin role to todays777@gmail.com
INSERT INTO user_roles (user_id, role, org_id) 
VALUES ('91f360ba-2c8b-4256-a82a-538066030d9f', 'super_admin', null)
ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'super_admin';

-- 8. Update organisations table (add missing columns)
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 9. Verify the setup
SELECT 'User roles table created' as status;
SELECT 'Super admin role granted' as status;

-- 10. Final verification
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'todays777@gmail.com';