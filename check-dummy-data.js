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
    console.log('🔍 Checking dummy data...');
    
    // Check organization
    console.log('\n1. Checking organization...');
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', 'bf579a76-e9c5-45be-8659-7e62664883c4')
      .single();
      
    if (orgError) {
      console.error('❌ Organization error:', orgError);
    } else if (org) {
      console.log('✅ Organization found:', org.name);
    } else {
      console.log('❌ Organization not found');
    }
    
    // Check seniors
    console.log('\n2. Checking seniors...');
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, name, created_at, org_id')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4');
      
    if (seniorsError) {
      console.error('❌ Seniors error:', seniorsError);
    } else {
      console.log(`✅ Found ${seniors.length} seniors:`);
      seniors.forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));
    }
    
    // Check training results
    console.log('\n3. Checking training results...');
    const seniorIds = seniors?.map(s => s.id) || [];
    
    if (seniorIds.length > 0) {
      const { data: motorResults, error: motorError } = await supabase
        .from('motor_results')
        .select('senior_id, created_at, exercise_type')
        .in('senior_id', seniorIds);
        
      const { data: cognitiveResults, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at, game_type')
        .in('senior_id', seniorIds);
        
      if (motorError || cognitiveError) {
        console.error('❌ Results errors:', { motorError, cognitiveError });
      } else {
        console.log(`✅ Found ${motorResults.length} motor results and ${cognitiveResults.length} cognitive results`);
        
        // Check recent results (last 3 days)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentMotor = motorResults.filter(r => new Date(r.created_at) >= threeDaysAgo);
        const recentCognitive = cognitiveResults.filter(r => new Date(r.created_at) >= threeDaysAgo);
        
        console.log(`   - Recent motor results (last 3 days): ${recentMotor.length}`);
        console.log(`   - Recent cognitive results (last 3 days): ${recentCognitive.length}`);
        
        // Show which seniors have recent activity
        const allResults = [...motorResults, ...cognitiveResults];
        const recentResults = allResults.filter(r => new Date(r.created_at) >= threeDaysAgo);
        const activeSeniorIds = new Set(recentResults.map(r => r.senior_id));
        
        console.log('\n   Active seniors (with recent activity):');
        seniors.forEach(s => {
          if (activeSeniorIds.has(s.id)) {
            console.log(`   ✅ ${s.name} - has recent activity`);
          } else {
            console.log(`   😴 ${s.name} - no recent activity (inactive)`);
          }
        });
      }
    }
    
    // Check schedules
    console.log('\n4. Checking schedules...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('senior_id, status, start_date, end_date, sessions_per_week')
      .in('senior_id', seniorIds);
      
    if (schedulesError) {
      console.error('❌ Schedules error:', schedulesError);
    } else {
      console.log(`✅ Found ${schedules.length} schedules:`);
      schedules.forEach(s => {
        const senior = seniors.find(senior => senior.id === s.senior_id);
        console.log(`   - ${senior?.name}: ${s.status} (${s.sessions_per_week}/week)`);
      });
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   - Organization: ${org ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - Seniors: ${seniors?.length || 0} found`);
    console.log(`   - Active seniors: ${activeSeniorIds?.size || 0}`);
    console.log(`   - Inactive seniors: ${seniors ? seniors.length - (activeSeniorIds?.size || 0) : 0}`);
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkData();