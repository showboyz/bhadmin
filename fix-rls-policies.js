const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMTkxMiwiZXhwIjoyMDY3MDk3OTEyfQ.BPeQe56hWDYKfAxOvFNvZwxb7PPToA6vRS5r6a8vJ60';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for dashboard access...');

  try {
    // First, let's check if the user is in admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'todays777@gmail.com');
      
    console.log('Admin users found:', adminUsers?.length || 0);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('Creating admin user entry...');
      
      // Get the user ID from auth.users 
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers.users.find(u => u.email === 'todays777@gmail.com');
      
      if (targetUser) {
        console.log('Found auth user:', targetUser.id);
        
        // Insert into admin_users table
        const { data: newAdmin, error: insertError } = await supabase
          .from('admin_users')
          .insert([
            {
              id: targetUser.id,
              email: targetUser.email,
              role: 'super_admin',
              is_active: true,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating admin user:', insertError);
        } else {
          console.log('✅ Created admin user:', newAdmin.email);
        }
      }
    }

    // Create/update RLS policies for seniors table
    console.log('\\n📋 Creating RLS policies...');
    
    const policies = [
      {
        table: 'seniors',
        policy: `
          CREATE POLICY "Super admins can access all seniors" ON public.seniors
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM admin_users 
              WHERE admin_users.id = auth.uid() 
              AND admin_users.role = 'super_admin' 
              AND admin_users.is_active = true
            )
          );
        `
      },
      {
        table: 'schedules', 
        policy: `
          CREATE POLICY "Super admins can access all schedules" ON public.schedules
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM admin_users 
              WHERE admin_users.id = auth.uid() 
              AND admin_users.role = 'super_admin' 
              AND admin_users.is_active = true
            )
          );
        `
      },
      {
        table: 'organisations',
        policy: `
          CREATE POLICY "Super admins can access all organisations" ON public.organisations
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM admin_users 
              WHERE admin_users.id = auth.uid() 
              AND admin_users.role = 'super_admin' 
              AND admin_users.is_active = true
            )
          );
        `
      },
      {
        table: 'motor_results',
        policy: `
          CREATE POLICY "Super admins can access all motor_results" ON public.motor_results
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM admin_users 
              WHERE admin_users.id = auth.uid() 
              AND admin_users.role = 'super_admin' 
              AND admin_users.is_active = true
            )
          );
        `
      },
      {
        table: 'cognitive_results',
        policy: `
          CREATE POLICY "Super admins can access all cognitive_results" ON public.cognitive_results
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM admin_users 
              WHERE admin_users.id = auth.uid() 
              AND admin_users.role = 'super_admin' 
              AND admin_users.is_active = true
            )
          );
        `
      }
    ];

    for (const { table, policy } of policies) {
      console.log(`Creating policy for ${table}...`);
      
      // First drop existing policy if it exists
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "Super admins can access all ${table}" ON public.${table};`
        });
      } catch (e) {
        // Ignore errors from dropping non-existent policies
      }
      
      // Create the new policy
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.error(`Error creating policy for ${table}:`, error);
        } else {
          console.log(`✅ Created policy for ${table}`);
        }
      } catch (e) {
        console.error(`Exception creating policy for ${table}:`, e);
      }
    }

    // Enable RLS on all tables
    const tables = ['seniors', 'schedules', 'organisations', 'motor_results', 'cognitive_results'];
    for (const table of tables) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
        });
        console.log(`✅ Enabled RLS on ${table}`);
      } catch (e) {
        console.log(`RLS already enabled on ${table} or error:`, e.message);
      }
    }

    console.log('\\n🧪 Testing access after policy creation...');
    
    // Test access with the user account
    const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjE5MTIsImV4cCI6MjA2NzA5NzkxMn0.wql8nRl4SAytpap_goijKjvbDrMT2v-b5ITr7qLy84Q');
    
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: 'todays777@gmail.com',
      password: 'your-new-password'
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError);
      return;
    }
    
    console.log('Signed in as:', signInData.user?.email);
    
    // Test the dashboard query
    const { data: testSeniors, error: testError } = await supabaseAnon
      .from('seniors')
      .select(`
        *,
        schedules!inner (
          id,
          start_date,
          end_date,
          status,
          sessions_per_week
        )
      `)
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4');
      
    console.log('\\n📊 Dashboard query test result:');
    console.log('Count:', testSeniors?.length || 0);
    console.log('Error:', testError?.message || 'none');
    if (testSeniors && testSeniors.length > 0) {
      console.log('Sample names:', testSeniors.slice(0, 3).map(s => s.name));
      console.log('✅ SUCCESS! Dashboard data is now accessible');
    } else {
      console.log('❌ Still no access - may need to check policy conditions');
    }
    
    await supabaseAnon.auth.signOut();

  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

fixRLSPolicies().catch(console.error);