const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMTkxMiwiZXhwIjoyMDY3MDk3OTEyfQ.BPeQe56hWDYKfAxOvFNvZwxb7PPToA6vRS5r6a8vJ60';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjE5MTIsImV4cCI6MjA2NzA5NzkxMn0.wql8nRl4SAytpap_goijKjvbDrMT2v-b5ITr7qLy84Q';

const ORG_ID = 'bf579a76-e9c5-45be-8659-7e62664883c4';

async function debugDashboardQuery() {
  console.log('🔍 Debugging useDashboard query execution...');
  
  // Test with service role (should bypass RLS)
  console.log('\n1. Testing with SERVICE ROLE (bypasses RLS)...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: seniorsService, error: errorService } = await supabaseService
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
    .eq('org_id', ORG_ID);
    
  console.log('Service role result:', { 
    count: seniorsService?.length || 0, 
    error: errorService?.message || 'none',
    sample: seniorsService?.[0]?.name || 'none'
  });

  // Test with anon role (same as what the app uses)
  console.log('\n2. Testing with ANON ROLE (respects RLS)...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: seniorsAnon, error: errorAnon } = await supabaseAnon
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
    .eq('org_id', ORG_ID);
    
  console.log('Anon role result:', { 
    count: seniorsAnon?.length || 0, 
    error: errorAnon?.message || 'none',
    sample: seniorsAnon?.[0]?.name || 'none'
  });

  // Test with user authentication (simulate the logged in user)
  console.log('\n3. Testing with USER AUTH simulation...');
  
  // First, let's see what users exist and their roles
  const { data: authUsers, error: authError } = await supabaseService
    .from('admin_users')
    .select('*')
    .eq('email', 'todays777@gmail.com');
    
  console.log('Admin user info:', authUsers?.[0] || 'Not found');
  
  // Test as authenticated user (sign in first)
  try {
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: 'todays777@gmail.com',
      password: 'your-new-password'
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError.message);
    } else {
      console.log('Signed in successfully, user ID:', signInData.user?.id);
      
      // Now test the query as authenticated user
      const { data: seniorsAuth, error: errorAuth } = await supabaseAnon
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
        .eq('org_id', ORG_ID);
        
      console.log('Authenticated user result:', { 
        count: seniorsAuth?.length || 0, 
        error: errorAuth?.message || 'none',
        sample: seniorsAuth?.[0]?.name || 'none'
      });
      
      // Test individual queries to isolate the issue
      console.log('\n4. Testing individual table access...');
      
      const { data: seniorsOnly, error: seniorsOnlyError } = await supabaseAnon
        .from('seniors')
        .select('id, name, org_id')
        .eq('org_id', ORG_ID);
        
      console.log('Seniors only:', { 
        count: seniorsOnly?.length || 0, 
        error: seniorsOnlyError?.message || 'none'
      });
      
      const { data: schedulesOnly, error: schedulesOnlyError } = await supabaseAnon
        .from('schedules')
        .select('id, senior_id, status')
        .limit(5);
        
      console.log('Schedules only:', { 
        count: schedulesOnly?.length || 0, 
        error: schedulesOnlyError?.message || 'none'
      });
      
      // Sign out
      await supabaseAnon.auth.signOut();
    }
  } catch (authErr) {
    console.log('Authentication test failed:', authErr);
  }

  // Test organization access
  console.log('\n5. Testing organization access...');
  const { data: org, error: orgError } = await supabaseAnon
    .from('organisations')
    .select('*')
    .eq('id', ORG_ID);
    
  console.log('Organization access:', { 
    found: !!org?.[0], 
    error: orgError?.message || 'none',
    name: org?.[0]?.name || 'none'
  });

  console.log('\n🔧 DIAGNOSIS:');
  if (seniorsService?.length > 0 && seniorsAnon?.length === 0) {
    console.log('❌ RLS is blocking anon access to seniors data');
    console.log('💡 Need to check/fix RLS policies for seniors table');
  } else if (seniorsService?.length === 0) {
    console.log('❌ No data exists even with service role');
    console.log('💡 Data insertion may have failed');
  } else {
    console.log('✅ Data access seems to be working');
    console.log('💡 Issue might be elsewhere - check browser cache or hook implementation');
  }
}

debugDashboardQuery().catch(console.error);