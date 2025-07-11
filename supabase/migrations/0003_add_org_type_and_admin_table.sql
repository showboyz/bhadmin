-- Add org_type to organisations table
ALTER TABLE organisations 
ADD COLUMN org_type TEXT;

-- Create organization_admins table for storing admin account info
CREATE TABLE organization_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    admin_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    admin_phone TEXT,
    admin_id TEXT NOT NULL, -- App login ID
    admin_password TEXT NOT NULL, -- Temporary password
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admin_email),
    UNIQUE(admin_id)
);

-- Add RLS policies for organization_admins
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can access all admin records
CREATE POLICY "Super admins can access all organization admins"
    ON organization_admins FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Organization admins can only see their own org's admin info
CREATE POLICY "Org admins can access their org admin info"
    ON organization_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.org_id = organization_admins.org_id
            AND ur.role IN ('org_admin', 'staff')
        )
    );

-- Add indexes for better performance
CREATE INDEX idx_organization_admins_org_id ON organization_admins(org_id);
CREATE INDEX idx_organization_admins_email ON organization_admins(admin_email);
CREATE INDEX idx_organization_admins_app_id ON organization_admins(admin_id);

-- Update organizations table to include org_type values
UPDATE organisations 
SET org_type = 'clinic' 
WHERE org_type IS NULL;

-- Make org_type NOT NULL after setting default values
ALTER TABLE organisations 
ALTER COLUMN org_type SET NOT NULL;