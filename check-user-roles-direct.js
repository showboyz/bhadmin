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
    console.log('🔍 Checking user roles directly from user_roles table...\n');

    // Get all user roles for todays777@gmail.com
    // We need to find the user ID first by checking all roles with email-like pattern
    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('❌ Roles error:', rolesError);
      return;
    }

    console.log(`📊 Total roles in database: ${allRoles?.length || 0}`);
    
    if (allRoles && allRoles.length > 0) {
      console.log('\n🎭 All user roles:');
      allRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. User: ${role.user_id.substring(0, 8)}... | Role: ${role.role} | Org: ${role.org_id || 'global'}`);
      });

      // Look for super_admin roles
      const superAdminRoles = allRoles.filter(role => role.role === 'super_admin');
      console.log(`\n👑 Super Admin roles: ${superAdminRoles.length}`);
      superAdminRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. User ID: ${role.user_id} | Created: ${role.created_at}`);
      });

      // Look for roles with andrew's clinic org_id
      const andrewsClinicId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
      const andrewsRoles = allRoles.filter(role => role.org_id === andrewsClinicId);
      console.log(`\n🏥 Andrew's Clinic roles: ${andrewsRoles.length}`);
      andrewsRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. User ID: ${role.user_id.substring(0, 8)}... | Role: ${role.role}`);
      });
    } else {
      console.log('   No roles found in database');
    }

    // Try to manually add super_admin role if none exists
    if (!allRoles || allRoles.filter(role => role.role === 'super_admin').length === 0) {
      console.log('\n🔧 No super_admin roles found. We need to create one manually.');
      console.log('Since we can\'t access auth.users, we\'ll need to get the user ID another way.');
      
      // Check if we can find any user ID from existing data
      if (allRoles && allRoles.length > 0) {
        console.log('\n💡 Available user IDs in the system:');
        const uniqueUserIds = [...new Set(allRoles.map(role => role.user_id))];
        uniqueUserIds.forEach((userId, index) => {
          console.log(`   ${index + 1}. ${userId}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUserRoles();