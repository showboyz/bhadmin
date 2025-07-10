-- Step 2: Create tables (run this second)
-- User roles table for role-based access control
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users(id)
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- References auth.users(id) of the user who created this role
    
    -- Constraints
    UNIQUE(user_id, org_id), -- One role per user per organization
    
    -- Super admin doesn't need org_id, others do
    CONSTRAINT check_org_id_for_non_super_admin 
        CHECK (role = 'super_admin' OR org_id IS NOT NULL)
);

-- Organization settings table
CREATE TABLE organization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE UNIQUE,
    
    -- Subscription and billing
    subscription_plan subscription_plan_enum DEFAULT 'basic',
    license_limit INTEGER DEFAULT 50,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- Organization details
    org_type TEXT DEFAULT 'clinic' CHECK (org_type IN ('clinic', 'hospital', 'care_center')),
    address JSONB,
    phone TEXT,
    email TEXT,
    
    -- Status and configuration
    is_active BOOLEAN DEFAULT TRUE,
    api_access_enabled BOOLEAN DEFAULT TRUE,
    data_retention_days INTEGER DEFAULT 365,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Billing dates
    subscription_start_date DATE,
    subscription_end_date DATE,
    last_billing_date DATE,
    next_billing_date DATE
);

-- System audit log table
CREATE TABLE system_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users(id)
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'organization', 'user', 'senior', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization usage statistics table
CREATE TABLE organization_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    
    -- Usage metrics
    active_seniors_count INTEGER DEFAULT 0,
    total_sessions_count INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    
    -- Time period
    stat_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(org_id, stat_date)
);