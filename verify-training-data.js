require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyData() {
  try {
    console.log('🔍 Verifying training data and dashboard logic...');
    
    // Get seniors from andrew's clinic
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, name, created_at')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4');
      
    if (seniorsError) {
      console.error('❌ Error fetching seniors:', seniorsError);
      return;
    }
    
    console.log(`✅ Found ${seniors.length} seniors`);
    
    // Get all training results for these seniors
    const seniorIds = seniors.map(s => s.id);
    
    const { data: motorResults, error: motorError } = await supabase
      .from('motor_results')
      .select('senior_id, created_at, raw')
      .in('senior_id', seniorIds);
      
    const { data: cognitiveResults, error: cognitiveError } = await supabase
      .from('cognitive_results')
      .select('senior_id, created_at, raw')
      .in('senior_id', seniorIds);
      
    if (motorError || cognitiveError) {
      console.error('❌ Error fetching results:', { motorError, cognitiveError });
      return;
    }
    
    console.log(`✅ Found ${motorResults.length} motor results and ${cognitiveResults.length} cognitive results`);
    
    // Combine all results and analyze activity
    const allResults = [...motorResults, ...cognitiveResults];
    
    console.log('\n📊 Activity Analysis:');
    
    // Check activity by senior
    for (const senior of seniors) {
      const seniorResults = allResults.filter(r => r.senior_id === senior.id);
      
      if (seniorResults.length > 0) {
        // Find most recent activity
        const mostRecentTime = Math.max(...seniorResults.map(r => new Date(r.created_at).getTime()));
        const daysSinceLastActivity = Math.floor((Date.now() - mostRecentTime) / (24 * 60 * 60 * 1000));
        
        // Check if active today
        const todayResults = seniorResults.filter(r => {
          const resultDate = new Date(r.created_at);
          const today = new Date();
          return resultDate.toDateString() === today.toDateString();
        });
        
        // Check if active this week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekResults = seniorResults.filter(r => new Date(r.created_at) >= weekAgo);
        
        const status = daysSinceLastActivity === 0 ? '🟢 Active Today' :
                      daysSinceLastActivity <= 3 ? '🟡 Recent' : 
                      '🔴 Inactive';
        
        console.log(`   ${senior.name}: ${status} (${seniorResults.length} results, last: ${daysSinceLastActivity}d ago)`);
        
        if (todayResults.length > 0) {
          console.log(`      - Active today: ${todayResults.length} sessions`);
        }
        if (weekResults.length > 0) {
          console.log(`      - This week: ${weekResults.length} sessions`);
        }
      } else {
        console.log(`   ${senior.name}: ❌ No training results`);
      }
    }
    
    // Calculate overall metrics like the dashboard would
    console.log('\n📈 Dashboard Metrics (if working correctly):');
    
    // Active today
    const todayResults = allResults.filter(r => {
      const resultDate = new Date(r.created_at);
      const today = new Date();
      return resultDate.toDateString() === today.toDateString();
    });
    const activeTodayIds = new Set(todayResults.map(r => r.senior_id));
    console.log(`   Active Today: ${activeTodayIds.size}`);
    
    // Active this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekResults = allResults.filter(r => new Date(r.created_at) >= weekAgo);
    const activeWeekIds = new Set(weekResults.map(r => r.senior_id));
    console.log(`   Weekly Active: ${activeWeekIds.size}`);
    
    // Total users
    console.log(`   Total Users: ${seniors.length}`);
    
    // Inactive users (3+ days no activity)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const inactiveSeniors = seniors.filter(senior => {
      const seniorResults = allResults.filter(r => r.senior_id === senior.id);
      if (seniorResults.length === 0) return true;
      
      const lastActivity = Math.max(...seniorResults.map(r => new Date(r.created_at).getTime()));
      return lastActivity < threeDaysAgo.getTime();
    });
    
    console.log(`   Inactive Users (3+ days): ${inactiveSeniors.length}`);
    if (inactiveSeniors.length > 0) {
      console.log(`   Inactive users: ${inactiveSeniors.map(s => s.name).join(', ')}`);
    }
    
    // Recent active users (for "Recent User Activity" section)
    const seniorsWithActivity = seniors.map(senior => {
      const seniorResults = allResults.filter(r => r.senior_id === senior.id);
      const lastActivity = seniorResults.length > 0 
        ? Math.max(...seniorResults.map(r => new Date(r.created_at).getTime()))
        : new Date(senior.created_at).getTime();
        
      return {
        ...senior,
        lastActivityTime: lastActivity,
        resultCount: seniorResults.length
      };
    });
    
    const recentActiveUsers = seniorsWithActivity
      .sort((a, b) => b.lastActivityTime - a.lastActivityTime)
      .slice(0, 5);
    
    console.log('\n👥 Recent User Activity (Top 5):');
    recentActiveUsers.forEach((senior, i) => {
      const daysSince = Math.floor((Date.now() - senior.lastActivityTime) / (24 * 60 * 60 * 1000));
      const lastActivityText = daysSince === 0 ? 'Today' : 
                              daysSince === 1 ? '1 day ago' : 
                              `${daysSince} days ago`;
      console.log(`   ${i + 1}. ${senior.name} - ${senior.resultCount} results, last: ${lastActivityText}`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

verifyData();