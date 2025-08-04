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

async function checkUserRoles() {
  try {
    const targetEmail = 'todays777@gmail.com';
    console.log(`🔍 Checking roles for ${targetEmail}...\n`);

    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    const user = authData.users.find(u => u.email === targetEmail);
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('❌ Roles error:', rolesError);
      return;
    }

    console.log(`🎭 User roles (${roles?.length || 0} total):`);
    if (roles && roles.length > 0) {
      roles.forEach(role => {
        console.log(`   - ${role.role} ${role.org_id ? `(org: ${role.org_id})` : '(global)'}`);
      });
    } else {
      console.log('   No roles found');
    }

    const hasSuperAdmin = roles?.some(role => role.role === 'super_admin');
    const hasOrgAccess = roles?.some(role => 
      role.org_id === 'bf579a76-e9c5-45be-8659-7e62664883c4'
    );

    console.log('\n📊 Access Analysis:');
    console.log(`   Is Super Admin: ${hasSuperAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has Org Access: ${hasOrgAccess ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can Access Andrew's Clinic: ${hasSuperAdmin || hasOrgAccess ? '✅ YES' : '❌ NO'}`);

    if (!hasSuperAdmin && !hasOrgAccess) {
      console.log('\n🔧 To fix access, run:');
      console.log('   node create-super-admin-role.js');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUserRoles();