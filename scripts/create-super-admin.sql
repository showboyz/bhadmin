-- Script to create super admin user
-- Replace 'your-user-id' with your actual user ID from auth.users

-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then, insert super admin role (replace 'your-user-id' with actual ID)
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'super_admin')
ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'super_admin';

-- Verify the role was created
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE ur.role = 'super_admin';