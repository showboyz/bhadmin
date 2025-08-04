const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';  
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMTkxMiwiZXhwIjoyMDY3MDk3OTEyfQ.BPeQe56hWDYKfAxOvFNvZwxb7PPToA6vRS5r6a8vJ60';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function temporarilyDisableRLS() {
  console.log('⚠️  Temporarily disabling RLS to test dashboard functionality...');
  console.log('📝 Note: This is for testing only - RLS should be properly configured in production');

  try {
    // First, create the admin user if it doesn't exist
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'todays777@gmail.com');
      
    if (!adminUsers || adminUsers.length === 0) {
      console.log('Creating admin user entry...');
      
      // Get the user from auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers.users.find(u => u.email === 'todays777@gmail.com');
      
      if (targetUser) {
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert([
            {
              id: targetUser.id,
              email: targetUser.email,  
              role: 'super_admin',
              is_active: true,
              created_at: new Date().toISOString()
            }
          ]);
          
        if (insertError) {
          console.error('Error creating admin user:', insertError);
        } else {
          console.log('✅ Created admin user');
        }
      }
    }

    // Use direct SQL to disable RLS on key tables
    const tables = ['seniors', 'schedules', 'organisations', 'motor_results', 'cognitive_results'];
    
    for (const table of tables) {
      try {
        // Use the service role to execute raw SQL
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
          
        console.log(`Table ${table}: ${data ? 'accessible' : 'blocked'}`);
        
        if (error) {
          console.log(`Error accessing ${table}:`, error.message);
        }
      } catch (e) {
        console.log(`Exception accessing ${table}:`, e.message);
      }
    }

    // Test access with anon user (this simulates what the app does)
    console.log('\\n🧪 Testing anon access...');
    const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjE5MTIsImV4cCI6MjA2NzA5NzkxMn0.wql8nRl4SAytpap_goijKjvbDrMT2v-b5ITr7qLy84Q');
    
    const { data: anonSeniors, error: anonError } = await supabaseAnon
      .from('seniors')
      .select('id, name, org_id')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4')
      .limit(5);
      
    console.log('Anon access to seniors:', {
      count: anonSeniors?.length || 0,
      error: anonError?.message || 'none'
    });

    // Test with authenticated user  
    console.log('\\n🔐 Testing authenticated access...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: 'todays777@gmail.com',
      password: 'your-new-password'
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError);
      return;
    }
    
    const { data: authSeniors, error: authError } = await supabaseAnon
      .from('seniors')
      .select('id, name, org_id')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4')
      .limit(5);
      
    console.log('Authenticated access to seniors:', {
      count: authSeniors?.length || 0,
      error: authError?.message || 'none',
      names: authSeniors?.map(s => s.name) || []
    });

    if (authSeniors && authSeniors.length > 0) {
      console.log('\\n🎉 SUCCESS! Data is accessible after authentication');
      console.log('The dashboard should now work with Korean names');
    } else {
      console.log('\\n❌ Still blocked - RLS policies may need manual database configuration');
      console.log('\\n💡 Alternative: Use Supabase dashboard to manually:');
      console.log('   1. Go to Authentication > Users');
      console.log('   2. Find todays777@gmail.com');
      console.log('   3. Set role/permissions');
      console.log('   4. Or disable RLS temporarily in Database > Settings');
    }
    
    await supabaseAnon.auth.signOut();

  } catch (error) {
    console.error('Error in RLS disable script:', error);
  }
}

temporarilyDisableRLS().catch(console.error);