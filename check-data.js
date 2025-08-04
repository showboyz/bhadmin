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

async function checkData() {
  try {
    const andrewsClinicId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
    
    console.log('🔍 Checking andrew\'s clinic data...\n');

    // Check organization
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', andrewsClinicId)
      .single();

    if (orgError) {
      console.error('❌ Organization error:', orgError);
    } else {
      console.log('✅ Organization:', org.name, `(ID: ${org.id})`);
    }

    // Check seniors
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('*')
      .eq('org_id', andrewsClinicId);

    if (seniorsError) {
      console.error('❌ Seniors error:', seniorsError);
    } else {
      console.log(`\n👥 Seniors count: ${seniors?.length || 0}`);
      seniors?.forEach((senior, index) => {
        console.log(`   ${index + 1}. ${senior.name} (${senior.gender_enum}, birth: ${senior.birth})`);
      });
    }

    // Check schedules
    if (seniors && seniors.length > 0) {
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .in('senior_id', seniors.map(s => s.id));

      if (schedulesError) {
        console.error('❌ Schedules error:', schedulesError);
      } else {
        console.log(`\n📅 Schedules count: ${schedules?.length || 0}`);
        schedules?.forEach((schedule, index) => {
          const senior = seniors.find(s => s.id === schedule.senior_id);
          console.log(`   ${index + 1}. ${senior?.name}: ${schedule.start_date} to ${schedule.end_date} (${schedule.sessions_per_week}/week)`);
        });
      }

      // Check motor results
      const { data: motorResults, error: motorError } = await supabase
        .from('motor_results')
        .select('*, seniors(name)')
        .in('senior_id', seniors.map(s => s.id))
        .order('created_at', { ascending: false });

      if (motorError) {
        console.error('❌ Motor results error:', motorError);
      } else {
        console.log(`\n🏃 Motor results count: ${motorResults?.length || 0}`);
        motorResults?.slice(0, 5).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.seniors?.name}: ${result.exercise_type} (score: ${result.score}) - ${new Date(result.created_at).toLocaleDateString()}`);
        });
      }

      // Check cognitive results
      const { data: cognitiveResults, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .select('*, seniors(name)')
        .in('senior_id', seniors.map(s => s.id))
        .order('created_at', { ascending: false });

      if (cognitiveError) {
        console.error('❌ Cognitive results error:', cognitiveError);
      } else {
        console.log(`\n🧠 Cognitive results count: ${cognitiveResults?.length || 0}`);
        cognitiveResults?.slice(0, 5).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.seniors?.name}: ${result.game_type} (score: ${result.score}) - ${new Date(result.created_at).toLocaleDateString()}`);
        });
      }
    }

    console.log('\n📊 Dashboard API Test:');
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/bf579a76-e9c5-45be-8659-7e62664883c4');
      if (response.ok) {
        const dashboardData = await response.json();
        console.log('   ✅ Dashboard API response:', JSON.stringify(dashboardData, null, 2));
      } else {
        console.log('   ❌ Dashboard API failed:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('   ❌ Dashboard API error:', apiError.message);
    }

  } catch (error) {
    console.error('💥 Check error:', error);
  }
}

checkData();