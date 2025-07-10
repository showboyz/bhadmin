-- Super Admin System Schema
-- This migration adds user roles and organization settings for super admin functionality

-- Create role enum
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'org_admin', 'staff', 'viewer');

-- Create subscription plan enum
CREATE TYPE subscription_plan_enum AS ENUM ('basic', 'premium', 'enterprise');

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

-- Indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_organization_settings_org_id ON organization_settings(org_id);
CREATE INDEX idx_organization_settings_subscription_plan ON organization_settings(subscription_plan);
CREATE INDEX idx_organization_settings_is_active ON organization_settings(is_active);
CREATE INDEX idx_system_audit_log_user_id ON system_audit_log(user_id);
CREATE INDEX idx_system_audit_log_created_at ON system_audit_log(created_at);
CREATE INDEX idx_system_audit_log_resource_type ON system_audit_log(resource_type);
CREATE INDEX idx_organization_usage_stats_org_id ON organization_usage_stats(org_id);
CREATE INDEX idx_organization_usage_stats_stat_date ON organization_usage_stats(stat_date);

-- Updated_at triggers
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at 
    BEFORE UPDATE ON organization_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can view all user roles" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Org admins can view roles in their organization" ON user_roles
    FOR SELECT USING (
        org_id IN (
            SELECT ur.org_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('org_admin', 'staff')
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

-- RLS Policies for organization_settings
CREATE POLICY "Super admins can view all organization settings" ON organization_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Org admins can view their organization settings" ON organization_settings
    FOR SELECT USING (
        org_id IN (
            SELECT ur.org_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('org_admin', 'staff')
        )
    );

CREATE POLICY "Super admins can manage organization settings" ON organization_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- RLS Policies for system_audit_log
CREATE POLICY "Super admins can view all audit logs" ON system_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- RLS Policies for organization_usage_stats
CREATE POLICY "Super admins can view all usage stats" ON organization_usage_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Org admins can view their usage stats" ON organization_usage_stats
    FOR SELECT USING (
        org_id IN (
            SELECT ur.org_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('org_admin', 'staff')
        )
    );

-- Sample data for development
-- Insert organization settings for existing organizations
INSERT INTO organization_settings (org_id, subscription_plan, license_limit, org_type, is_active)
SELECT 
    id as org_id, 
    'premium' as subscription_plan, 
    licence_seats as license_limit, 
    'clinic' as org_type, 
    TRUE as is_active
FROM organisations
WHERE id IN ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample super admin user role
-- Note: This would typically be done via application code with actual user IDs
-- INSERT INTO user_roles (user_id, role) VALUES 
--     ('your-super-admin-user-id', 'super_admin');

-- Update existing organisations table to include more fields
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update sample data
UPDATE organisations 
SET 
    contact_email = 'admin@seoulmedicine.com',
    contact_phone = '02-1234-5678',
    address = '{"street": "123 Seoul St", "city": "Seoul", "postal_code": "12345"}'::jsonb,
    is_active = TRUE
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE organisations 
SET 
    contact_email = 'info@busanhealth.com',
    contact_phone = '051-9876-5432',
    address = '{"street": "456 Busan Ave", "city": "Busan", "postal_code": "67890"}'::jsonb,
    is_active = TRUE
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Add a function to automatically create organization settings when a new organization is created
CREATE OR REPLACE FUNCTION create_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO organization_settings (org_id, subscription_plan, license_limit, org_type, is_active)
    VALUES (NEW.id, 'basic', NEW.licence_seats, 'clinic', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic organization settings creation
CREATE TRIGGER create_organization_settings_trigger
    AFTER INSERT ON organisations
    FOR EACH ROW
    EXECUTE FUNCTION create_organization_settings();

-- Create a function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO system_audit_log (
        user_id, action, resource_type, resource_id, old_values, new_values
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values
    );
END;
$$ LANGUAGE plpgsql;