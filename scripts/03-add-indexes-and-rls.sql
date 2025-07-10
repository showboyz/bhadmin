-- Step 3: Add indexes and RLS policies (run this third)
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