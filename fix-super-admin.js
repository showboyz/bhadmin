require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixSuperAdmin() {
  try {
    const targetEmail = 'todays777@gmail.com';
    console.log('🔍 Looking for user:', targetEmail);

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    const user = authData.users.find(u => u.email === targetEmail);
    
    if (!user) {
      console.error('❌ User not found');
      console.log('Available users:');
      authData.users.slice(0, 5).forEach(u => console.log('  -', u.email));
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('   User ID:', user.id);

    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('❌ Roles error:', rolesError);
      return;
    }

    console.log('🎭 Current roles:', existingRoles?.length || 0);
    existingRoles?.forEach(role => {
      console.log('   -', role.role, role.org_id ? `(org: ${role.org_id})` : '(global)');
    });

    const hasSuperAdmin = existingRoles?.some(role => role.role === 'super_admin');
    
    if (hasSuperAdmin) {
      console.log('✅ User already has super_admin role!');
      return;
    }

    console.log('➕ Adding super_admin role...');
    const { data: newRole, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'super_admin',
        org_id: null,
        created_by: user.id
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return;
    }

    console.log('✅ Successfully added super_admin role!');
    console.log('🎉 User can now login as super admin');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fixSuperAdmin();