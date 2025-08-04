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

async function createTrainingResults() {
  try {
    const andrewsClinicId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
    
    console.log('🏃 Creating training results for andrew\'s clinic...\n');

    // Get existing seniors
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, name')
      .eq('org_id', andrewsClinicId);

    if (seniorsError) {
      console.error('❌ Error fetching seniors:', seniorsError);
      return;
    }

    console.log(`👥 Found ${seniors.length} seniors`);

    // Create recent training results for some seniors (Recent Activity)
    console.log('\n🏃 Creating recent motor training results...');
    const recentSeniors = seniors.slice(0, 5); // Top 5 for recent activity
    
    for (const senior of recentSeniors) {
      const daysAgo = Math.floor(Math.random() * 3); // 0-2 days ago
      const resultDate = new Date();
      resultDate.setDate(resultDate.getDate() - daysAgo);

      const exerciseType = ['balance', 'strength', 'flexibility'][Math.floor(Math.random() * 3)];
      const duration = 1200 + Math.floor(Math.random() * 600); // 20-30 minutes
      const score = 70 + Math.floor(Math.random() * 30); // 70-100 score

      console.log(`   Creating motor result for ${senior.name} (${daysAgo} days ago)`);

      // Create motor results with correct structure
      const { data: motorResult, error: motorError } = await supabase
        .from('motor_results')
        .insert({
          senior_id: senior.id,
          raw: {
            exercise_type: exerciseType,
            duration_seconds: duration,
            score: score,
            repetitions: Math.floor(Math.random() * 20) + 10,
            intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
          },
          video_key: `videos/${senior.name}_${exerciseType}_${Date.now()}.mp4`,
          bpm: 70 + Math.floor(Math.random() * 40), // 70-110 bpm
          created_at: resultDate.toISOString()
        })
        .select();

      if (motorError) {
        console.error(`   ❌ Motor error for ${senior.name}:`, motorError);
      } else {
        console.log(`   ✅ Motor result created for ${senior.name}`);
      }
    }

    console.log('\n🧠 Creating recent cognitive training results...');
    for (const senior of recentSeniors) {
      const daysAgo = Math.floor(Math.random() * 3); // 0-2 days ago
      const resultDate = new Date();
      resultDate.setDate(resultDate.getDate() - daysAgo);

      const gameType = ['memory', 'attention', 'problem_solving'][Math.floor(Math.random() * 3)];
      const score = 60 + Math.floor(Math.random() * 40); // 60-100 score
      const duration = 900 + Math.floor(Math.random() * 600); // 15-25 minutes

      console.log(`   Creating cognitive result for ${senior.name} (${daysAgo} days ago)`);

      // Create cognitive results with correct structure
      const { data: cognitiveResult, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .insert({
          senior_id: senior.id,
          raw: {
            test_type: gameType,
            score: score,
            completion_time: duration,
            level_completed: Math.floor(Math.random() * 10) + 1,
            correct_answers: Math.floor(score / 5), // Roughly proportional to score
            total_questions: 20
          },
          video_key: `videos/${senior.name}_${gameType}_${Date.now()}.mp4`,
          created_at: resultDate.toISOString()
        })
        .select();

      if (cognitiveError) {
        console.error(`   ❌ Cognitive error for ${senior.name}:`, cognitiveError);
      } else {
        console.log(`   ✅ Cognitive result created for ${senior.name}`);
      }
    }

    // Create older results for inactive users (making some seniors inactive)
    console.log('\n😴 Creating inactive user data...');
    const inactiveSeniors = seniors.slice(5, 7); // Last 2 seniors will be inactive
    
    for (const senior of inactiveSeniors) {
      const daysAgo = 5 + Math.floor(Math.random() * 10); // 5-14 days ago
      const resultDate = new Date();
      resultDate.setDate(resultDate.getDate() - daysAgo);

      console.log(`   Creating old result for ${senior.name} (${daysAgo} days ago)`);

      // Create old results to make them appear inactive
      const { data: oldResult, error: oldError } = await supabase
        .from('motor_results')
        .insert({
          senior_id: senior.id,
          raw: {
            exercise_type: 'balance',
            duration_seconds: 1800,
            score: 85,
            repetitions: 15,
            intensity: 'moderate'
          },
          video_key: `videos/${senior.name}_balance_old_${Date.now()}.mp4`,
          bpm: 85,
          created_at: resultDate.toISOString()
        })
        .select();

      if (oldError) {
        console.error(`   ❌ Old result error for ${senior.name}:`, oldError);
      } else {
        console.log(`   ✅ Old result created for ${senior.name}`);
      }
    }

    console.log('\n✅ Training results creation completed!');

  } catch (error) {
    console.error('💥 Error creating training results:', error);
  }
}

createTrainingResults();