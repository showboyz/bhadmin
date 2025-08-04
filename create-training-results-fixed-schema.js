require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTrainingResults() {
  try {
    console.log('🏃 Creating training results with correct schema...');
    
    // Get seniors from andrew's clinic
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, name')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4');
      
    if (seniorsError) {
      console.error('❌ Error fetching seniors:', seniorsError);
      return;
    }
    
    console.log(`✅ Found ${seniors.length} seniors to create training results for`);
    
    // Clear existing training results for these seniors first
    console.log('🧹 Clearing existing training results...');
    const seniorIds = seniors.map(s => s.id);
    
    await supabase.from('motor_results').delete().in('senior_id', seniorIds);
    await supabase.from('cognitive_results').delete().in('senior_id', seniorIds);
    
    // Create recent training results (last 3 days) for active users
    console.log('📊 Creating recent training results for active seniors...');
    const activeSeniors = seniors.slice(0, 5); // First 5 are active
    
    for (const senior of activeSeniors) {
      const daysAgo = Math.floor(Math.random() * 3); // 0-2 days ago
      const resultDate = new Date();
      resultDate.setDate(resultDate.getDate() - daysAgo);
      
      // Create motor result
      if (Math.random() > 0.3) { // 70% chance
        const motorResult = {
          senior_id: senior.id,
          raw: {
            steps: 2000 + Math.floor(Math.random() * 1000),
            distance: 1.5 + Math.random() * 1.0,
            duration: 1200 + Math.floor(Math.random() * 600),
            exercise_type: ['walking', 'balance', 'strength', 'flexibility'][Math.floor(Math.random() * 4)]
          },
          video_key: `videos/${senior.name}_motor_${Date.now()}.mp4`,
          bpm: 70 + Math.floor(Math.random() * 30),
          created_at: resultDate.toISOString()
        };
        
        const { error: motorError } = await supabase
          .from('motor_results')
          .insert(motorResult);
          
        if (motorError) {
          console.error(`❌ Error creating motor result for ${senior.name}:`, motorError);
        } else {
          console.log(`✅ Created motor result for ${senior.name} (${daysAgo} days ago)`);
        }
      }
      
      // Create cognitive result  
      if (Math.random() > 0.3) { // 70% chance
        const cognitiveResult = {
          senior_id: senior.id,
          raw: {
            score: 60 + Math.floor(Math.random() * 40),
            test_type: ['memory', 'attention', 'executive', 'processing'][Math.floor(Math.random() * 4)],
            completion_time: 300 + Math.floor(Math.random() * 600),
            correct_answers: 15 + Math.floor(Math.random() * 10),
            total_questions: 20
          },
          video_key: `videos/${senior.name}_cognitive_${Date.now()}.mp4`,
          created_at: resultDate.toISOString()
        };
        
        const { error: cognitiveError } = await supabase
          .from('cognitive_results')
          .insert(cognitiveResult);
          
        if (cognitiveError) {
          console.error(`❌ Error creating cognitive result for ${senior.name}:`, cognitiveError);
        } else {
          console.log(`✅ Created cognitive result for ${senior.name} (${daysAgo} days ago)`);
        }
      }
      
      // Add a small delay to avoid timestamp conflicts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Create older results for inactive users
    console.log('😴 Creating older results for inactive seniors...');
    const inactiveSeniors = seniors.slice(5, 7); // Last 2 seniors (한미영, 윤대수)
    
    for (const senior of inactiveSeniors) {
      const daysAgo = 5 + Math.floor(Math.random() * 10); // 5-14 days ago
      const resultDate = new Date();
      resultDate.setDate(resultDate.getDate() - daysAgo);
      
      // Create one old result to show they exist but are inactive
      const motorResult = {
        senior_id: senior.id,
        raw: {
          steps: 1800,
          distance: 1.2,
          duration: 1800,
          exercise_type: 'walking'
        },
        video_key: `videos/${senior.name}_motor_old.mp4`,
        bpm: 75,
        created_at: resultDate.toISOString()
      };
      
      const { error: motorError } = await supabase
        .from('motor_results')
        .insert(motorResult);
        
      if (motorError) {
        console.error(`❌ Error creating old motor result for ${senior.name}:`, motorError);
      } else {
        console.log(`✅ Created old motor result for ${senior.name} (${daysAgo} days ago - inactive)`);
      }
    }
    
    console.log('✅ Training results creation completed!');
    console.log('📊 Expected dashboard results:');
    console.log('   - Recent User Activity: 김철수, 이영희, 박민수, 최순자, 정광호');
    console.log('   - Inactive Users: 한미영, 윤대수');
    console.log('   - Active Today/Weekly should show > 0');
    console.log('   - Total Users: 7');
    
  } catch (error) {
    console.error('💥 Error creating training results:', error);
  }
}

createTrainingResults();