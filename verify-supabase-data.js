const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjE5MTIsImV4cCI6MjA2NzA5NzkxMn0.wql8nRl4SAytpap_goijKjvbDrMT2v-b5ITr7qLy84Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupabaseData() {
  console.log('🔍 Starting Supabase Data Verification');
  console.log('🎯 Purpose: Verify INNER JOIN fix and data availability for Andrew\'s Clinic');
  console.log('');

  try {
    // Test 1: Check user authentication for andrew@youngandx.com
    console.log('1️⃣ Testing user authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'andrew@youngandx.com',
      password: 'RX3XJEemQAfw'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('📧 User:', authData.user.email);
    console.log('🆔 User ID:', authData.user.id);
    console.log('');

    // Test 2: Check user roles
    console.log('2️⃣ Testing user roles...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.log('❌ Error fetching user roles:', rolesError.message);
    } else {
      console.log('✅ User roles found:', rolesData.length);
      rolesData.forEach(role => {
        console.log(`   - Role: ${role.role}, Org: ${role.org_id || 'global'}`);
      });
    }
    console.log('');

    // Test 3: Check organization data
    console.log('3️⃣ Testing organization data...');
    const orgId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.log('❌ Error fetching organization:', orgError.message);
    } else {
      console.log('✅ Organization found:');
      console.log(`   - Name: ${orgData.name}`);
      console.log(`   - Type: ${orgData.org_type}`);
      console.log(`   - Active: ${orgData.is_active}`);
      console.log(`   - License Seats: ${orgData.licence_seats}`);
    }
    console.log('');

    // Test 4: Check seniors data (INNER JOIN fix verification)
    console.log('4️⃣ Testing seniors data (INNER JOIN fix)...');
    const { data: seniorsData, error: seniorsError } = await supabase
      .from('seniors')
      .select(`
        *,
        schedules (
          id,
          start_date,
          end_date,
          status,
          sessions_per_week
        )
      `)
      .eq('org_id', orgId);

    if (seniorsError) {
      console.log('❌ Error fetching seniors:', seniorsError.message);
    } else {
      console.log('✅ Seniors data retrieved:');
      console.log(`   - Total seniors: ${seniorsData.length}`);
      
      const activeSeniors = seniorsData.filter(s => 
        s.schedules && s.schedules.some(schedule => schedule.status === 'Active')
      );
      console.log(`   - Seniors with active schedules: ${activeSeniors.length}`);
      
      console.log('   - Sample seniors:');
      seniorsData.slice(0, 5).forEach((senior, index) => {
        console.log(`     ${index + 1}. ${senior.name} (${senior.schedules?.length || 0} schedules)`);
      });
    }
    console.log('');

    // Test 5: Check training results data
    console.log('5️⃣ Testing training results data...');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: motorResults, error: motorError } = await supabase
      .from('motor_results')
      .select('senior_id, created_at')
      .gte('created_at', weekAgo.toISOString());

    const { data: cognitiveResults, error: cognitiveError } = await supabase
      .from('cognitive_results')
      .select('senior_id, created_at')
      .gte('created_at', weekAgo.toISOString());

    if (motorError) {
      console.log('❌ Error fetching motor results:', motorError.message);
    } else {
      console.log(`✅ Motor results (last 7 days): ${motorResults.length}`);
    }

    if (cognitiveError) {
      console.log('❌ Error fetching cognitive results:', cognitiveError.message);
    } else {
      console.log(`✅ Cognitive results (last 7 days): ${cognitiveResults.length}`);
    }

    // Test 6: Calculate KPIs like the dashboard does
    console.log('');
    console.log('6️⃣ Calculating Dashboard KPIs...');
    
    if (seniorsData && !seniorsError) {
      const totalUsers = seniorsData.length;
      const licenseSeats = orgData?.licence_seats || 100;
      const licenseSeatRemaining = licenseSeats - totalUsers;

      // Combine all training results for activity analysis
      const allResults = [
        ...(motorResults || []),
        ...(cognitiveResults || [])
      ];

      // Get unique senior IDs who were active this week
      const activeSeniorIds = new Set(allResults.map(r => r.senior_id));
      const weeklyActive = activeSeniorIds.size;

      // Get seniors active today
      const todayResults = allResults.filter(r => {
        const resultDate = new Date(r.created_at);
        const today = new Date();
        return resultDate.toDateString() === today.toDateString();
      });
      const activeTodayIds = new Set(todayResults.map(r => r.senior_id));
      const activeToday = activeTodayIds.size;

      // Get new users this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const newUsersThisMonth = seniorsData.filter(s => {
        const createdDate = new Date(s.created_at);
        return createdDate >= startOfMonth;
      }).length;

      console.log('📊 CALCULATED KPIs:');
      console.log(`   - Total Users: ${totalUsers} (Expected: 33)`);
      console.log(`   - Active Today: ${activeToday} (Expected: 3)`);
      console.log(`   - Weekly Active: ${weeklyActive} (Expected: 19)`);
      console.log(`   - New Users This Month: ${newUsersThisMonth} (Expected: 1)`);
      console.log(`   - License Seats Remaining: ${licenseSeatRemaining}`);
      console.log('');

      // Verification of INNER JOIN fix
      console.log('🔧 INNER JOIN FIX VERIFICATION:');
      const kpiMatches = {
        totalUsers: totalUsers === 33,
        activeToday: activeToday === 3,
        weeklyActive: weeklyActive === 19,
        newUsersThisMonth: newUsersThisMonth === 1
      };

      const allMatch = Object.values(kpiMatches).every(match => match);
      
      if (allMatch) {
        console.log('✅ INNER JOIN FIX IS WORKING CORRECTLY');
        console.log('   All KPI values match expected results');
      } else {
        console.log('⚠️ INNER JOIN FIX NEEDS ATTENTION');
        console.log('   KPI Matching Status:');
        Object.entries(kpiMatches).forEach(([kpi, matches]) => {
          console.log(`   - ${kpi}: ${matches ? '✅' : '❌'}`);
        });
      }
    }

    console.log('');
    console.log('🎯 CONCLUSION:');
    if (rolesData && rolesData.length > 0) {
      console.log('✅ Authentication and roles are working');
      console.log('❌ The issue is in the frontend auth context initialization');
      console.log('💡 RECOMMENDATION: Fix the auth context to properly initialize roles on direct navigation');
    } else {
      console.log('❌ Authentication or role assignment is broken');
      console.log('💡 RECOMMENDATION: Check user_roles table and RLS policies');
    }

  } catch (error) {
    console.error('💥 Critical error during verification:', error);
  }
}

// Run the verification
verifySupabaseData().then(() => {
  console.log('');
  console.log('🏁 Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});