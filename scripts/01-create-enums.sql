-- Step 1: Create enums (run this first)
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'org_admin', 'staff', 'viewer');
CREATE TYPE subscription_plan_enum AS ENUM ('basic', 'premium', 'enterprise');