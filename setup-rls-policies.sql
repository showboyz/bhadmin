-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admin can access all organisations" ON organisations;
DROP POLICY IF EXISTS "Super admin can access all seniors" ON seniors;
DROP POLICY IF EXISTS "Super admin can access all schedules" ON schedules;
DROP POLICY IF EXISTS "Super admin can access all motor_results" ON motor_results;
DROP POLICY IF EXISTS "Super admin can access all cognitive_results" ON cognitive_results;
DROP POLICY IF EXISTS "Super admin can access all reports" ON reports;

-- RLS Policies for super_admin users
-- Super admins can access all data from all organizations

-- Organizations table
CREATE POLICY "Super admin can access all organisations" ON organisations
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Seniors table  
CREATE POLICY "Super admin can access all seniors" ON seniors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Schedules table
CREATE POLICY "Super admin can access all schedules" ON schedules  
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Motor results table
CREATE POLICY "Super admin can access all motor_results" ON motor_results
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Cognitive results table
CREATE POLICY "Super admin can access all cognitive_results" ON cognitive_results
FOR ALL TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Reports table
CREATE POLICY "Super admin can access all reports" ON reports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Also add policies for organization admins to access their own organization data
CREATE POLICY "Org admin can access their organisation" ON organisations  
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('org_admin', 'staff', 'viewer')
    AND org_id = id
  )
);

CREATE POLICY "Org admin can access their seniors" ON seniors
FOR ALL TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('org_admin', 'staff', 'viewer')
    AND org_id = seniors.org_id
  )
);

CREATE POLICY "Org admin can access their schedules" ON schedules
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN seniors s ON s.org_id = ur.org_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('org_admin', 'staff', 'viewer')
    AND s.id = schedules.senior_id
  )
);

CREATE POLICY "Org admin can access their motor_results" ON motor_results
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN seniors s ON s.org_id = ur.org_id  
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('org_admin', 'staff', 'viewer')
    AND s.id = motor_results.senior_id
  )
);

CREATE POLICY "Org admin can access their cognitive_results" ON cognitive_results
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN seniors s ON s.org_id = ur.org_id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('org_admin', 'staff', 'viewer') 
    AND s.id = cognitive_results.senior_id
  )
);

CREATE POLICY "Org admin can access their reports" ON reports  
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN seniors s ON s.org_id = ur.org_id
    JOIN motor_results mr ON mr.senior_id = s.id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('org_admin', 'staff', 'viewer')
    AND mr.id = reports.session_id
  ) OR EXISTS (
    SELECT 1 FROM user_roles ur  
    JOIN seniors s ON s.org_id = ur.org_id
    JOIN cognitive_results cr ON cr.senior_id = s.id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('org_admin', 'staff', 'viewer')
    AND cr.id = reports.session_id
  )
);