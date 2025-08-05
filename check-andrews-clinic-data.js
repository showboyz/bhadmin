const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxazmbvlnqhvkfqpqhfh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YXptYnZsbnFodmtmcXBxaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5ODkxNTAsImV4cCI6MjA1MTU2NTE1MH0.tJJKROK4W4uDdEJ3Ur8RQoUhKOhAkCr8PGDBz15fF-Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndrewsClinicData() {
  console.log('🏥 Checking Andrew\'s Clinic data...');
  
  try {
    // 1. Find Andrew's clinic organization
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .ilike('name', '%andrew%clinic%');
    
    if (orgError) {
      console.error('❌ Error fetching organization:', orgError);
      return;
    }
    
    if (!orgs || orgs.length === 0) {
      console.log('❌ Andrew\'s clinic not found in organizations');
      
      // Show all organizations
      const { data: allOrgs } = await supabase
        .from('organisations')
        .select('*');
      
      console.log('📋 Available organizations:');
      allOrgs?.forEach(org => {
        console.log(`  - ${org.name} (${org.id})`);
      });
      return;
    }
    
    const andrewsClinic = orgs[0];
    console.log('✅ Found Andrew\'s Clinic:', {
      id: andrewsClinic.id,
      name: andrewsClinic.name,
      licence_seats: andrewsClinic.licence_seats
    });
    
    // 2. Check seniors data
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('*')
      .eq('org_id', andrewsClinic.id);
    
    if (seniorsError) {
      console.error('❌ Error fetching seniors:', seniorsError);
      return;
    }
    
    console.log(`\n👥 Seniors count: ${seniors?.length || 0}`);
    if (seniors && seniors.length > 0) {
      console.log('📋 Seniors list:');
      seniors.forEach(senior => {
        console.log(`  - ${senior.name} (${senior.gender_enum}, born ${senior.birth})`);
      });
    }
    
    // 3. Check schedules data
    if (seniors && seniors.length > 0) {
      const seniorIds = seniors.map(s => s.id);
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .in('senior_id', seniorIds);
      
      if (!schedulesError) {
        console.log(`\n📅 Schedules count: ${schedules?.length || 0}`);
        schedules?.forEach(schedule => {
          const senior = seniors.find(s => s.id === schedule.senior_id);
          console.log(`  - ${senior?.name}: ${schedule.status} (${schedule.start_date} to ${schedule.end_date})`);
        });
      }
    }
    
    // 4. Check training results
    if (seniors && seniors.length > 0) {
      const seniorIds = seniors.map(s => s.id);
      
      const { data: motorResults } = await supabase
        .from('motor_results')
        .select('senior_id, created_at')
        .in('senior_id', seniorIds);
      
      const { data: cognitiveResults } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at')
        .in('senior_id', seniorIds);
      
      console.log(`\n🏃 Motor results count: ${motorResults?.length || 0}`);
      console.log(`🧠 Cognitive results count: ${cognitiveResults?.length || 0}`);
      
      // Show recent activity
      const allResults = [
        ...(motorResults || []).map(r => ({...r, type: 'motor'})),
        ...(cognitiveResults || []).map(r => ({...r, type: 'cognitive'}))
      ];
      
      if (allResults.length > 0) {
        allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        console.log('\n📊 Recent training activity (last 5):');
        allResults.slice(0, 5).forEach(result => {
          const senior = seniors.find(s => s.id === result.senior_id);
          const date = new Date(result.created_at).toLocaleDateString();
          console.log(`  - ${senior?.name}: ${result.type} training on ${date}`);
        });
      }
    }
    
    // 5. Calculate dashboard metrics
    console.log('\n📈 Dashboard Metrics:');
    const totalUsers = seniors?.length || 0;
    const licenseSeats = andrewsClinic.licence_seats || 100;
    const licenseSeatRemaining = licenseSeats - totalUsers;
    
    // Get activity data for the last week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allResults = [];
    
    if (seniors && seniors.length > 0) {
      const seniorIds = seniors.map(s => s.id);
      
      const { data: recentMotor } = await supabase
        .from('motor_results')
        .select('senior_id, created_at')
        .in('senior_id', seniorIds)
        .gte('created_at', weekAgo.toISOString());
      
      const { data: recentCognitive } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at')
        .in('senior_id', seniorIds)
        .gte('created_at', weekAgo.toISOString());
      
      allResults.push(...(recentMotor || []), ...(recentCognitive || []));
    }
    
    const activeSeniorIds = new Set(allResults.map(r => r.senior_id));
    const weeklyActive = activeSeniorIds.size;
    
    // Active today
    const today = new Date();
    const todayResults = allResults.filter(r => {
      const resultDate = new Date(r.created_at);
      return resultDate.toDateString() === today.toDateString();
    });
    const activeTodayIds = new Set(todayResults.map(r => r.senior_id));
    const activeToday = activeTodayIds.size;
    
    console.log(`  - Total Users: ${totalUsers}`);
    console.log(`  - Active Today: ${activeToday}`);
    console.log(`  - Weekly Active: ${weeklyActive}`);
    console.log(`  - License Seats Remaining: ${licenseSeatRemaining}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndrewsClinicData();