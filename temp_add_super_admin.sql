-- Temporary SQL to add super admin role to current user
-- Replace 'your-user-id' with your actual user ID from the console logs

-- First, check your user ID (you can find this from the console logs when creating organization)
-- Then run this command in Supabase SQL Editor:

INSERT INTO user_roles (user_id, role, created_at, updated_at) 
VALUES ('your-user-id', 'super_admin', NOW(), NOW())
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Example (replace the UUID with your actual user ID):
-- INSERT INTO user_roles (user_id, role, created_at, updated_at) 
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'super_admin', NOW(), NOW())
-- ON CONFLICT (user_id, org_id) DO NOTHING;

-- To find your user ID, you can also run:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;