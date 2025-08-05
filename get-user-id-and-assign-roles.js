const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMTkxMiwiZXhwIjoyMDY3MDk3OTEyfQ.BPeQe56hWDYKfAxOvFNvZwxb7PPToA6vRS5r6a8vJ60';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserIdAndAssignRoles() {
  console.log('🔍 Finding user ID for todays777@gmail.com...');
  
  try {
    // Get user ID
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const targetUser = userData.users.find(user => user.email === 'todays777@gmail.com');
    
    if (!targetUser) {
      console.error('❌ User todays777@gmail.com not found');
      return;
    }
    
    console.log('✅ Found user:', {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at
    });
    
    const userId = targetUser.id;
    
    // Check existing roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('❌ Error checking existing roles:', rolesError);
      return;
    }
    
    console.log('📋 Existing roles:', existingRoles);
    
    // Add super admin role (global)
    console.log('➕ Adding super admin role...');
    const { error: superAdminError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        org_id: null,
        role: 'super_admin',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (superAdminError && !superAdminError.message.includes('duplicate')) {
      console.error('❌ Error adding super admin role:', superAdminError);
    } else {
      console.log('✅ Super admin role added/confirmed');
    }
    
    // Add org admin role for Andrew's Clinic
    console.log('➕ Adding org admin role for Andrew\'s Clinic...');
    const { error: orgAdminError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
        role: 'org_admin',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (orgAdminError && !orgAdminError.message.includes('duplicate')) {
      console.error('❌ Error adding org admin role:', orgAdminError);
    } else {
      console.log('✅ Org admin role added/confirmed for Andrew\'s Clinic');
    }
    
    // Verify final roles
    const { data: finalRoles, error: finalRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (!finalRolesError) {
      console.log('🎯 Final user roles:', finalRoles);
    }
    
    console.log('✅ User roles setup completed!');
    console.log(`📝 User ID for SQL scripts: ${userId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getUserIdAndAssignRoles();