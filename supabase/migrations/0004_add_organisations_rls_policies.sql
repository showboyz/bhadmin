-- Add RLS policies for organisations table
-- This allows super admins to manage organizations

-- Enable RLS on organisations table
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Super admins can view all organizations
CREATE POLICY "Super admins can view all organizations" ON organisations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Super admins can insert organizations
CREATE POLICY "Super admins can insert organizations" ON organisations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Super admins can update organizations
CREATE POLICY "Super admins can update organizations" ON organisations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Super admins can delete organizations
CREATE POLICY "Super admins can delete organizations" ON organisations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Organization admins can view their own organization
CREATE POLICY "Org admins can view their organization" ON organisations
    FOR SELECT USING (
        id IN (
            SELECT ur.org_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('org_admin', 'staff', 'viewer')
        )
    );

-- Organization admins can update their own organization (limited fields)
CREATE POLICY "Org admins can update their organization" ON organisations
    FOR UPDATE USING (
        id IN (
            SELECT ur.org_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'org_admin'
        )
    );