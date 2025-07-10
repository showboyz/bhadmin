-- Step 4: Create super admin user (run this last)
-- First, find your user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Replace 'your-actual-user-id' with your real user ID from above query
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('12345678-1234-1234-1234-123456789012', 'super_admin');

-- INSERT INTO user_roles (user_id, role) VALUES ('your-actual-user-id', 'super_admin');

-- Verify the role was created
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE ur.role = 'super_admin';