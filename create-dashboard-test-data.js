const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMTkxMiwiZXhwIjoyMDY3MDk3OTEyfQ.BPeQe56hWDYKfAxOvFNvZwxb7PPToA6vRS5r6a8vJ60';

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = 'bf579a76-e9c5-45be-8659-7e62664883c4';

async function createTestData() {
  console.log('🚀 Creating dashboard test data...');

  try {
    // 1. Create the organization first
    console.log('📋 Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert([
        {
          id: ORG_ID,
          name: "Andrew's Clinic",
          licence_seats: 100,
          org_type: 'clinic',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (orgError && !orgError.message.includes('duplicate key')) {
      console.error('Error creating organization:', orgError);
      return;
    }
    console.log('✅ Organization created or already exists');

    // 2. Create Korean seniors (users) for this organization
    console.log('👥 Creating Korean seniors...');
    const koreanUsers = [
      { name: '김철수', email: 'kim.chulsu@example.com', phone: '010-1234-5678' },
      { name: '이영희', email: 'lee.younghee@example.com', phone: '010-2345-6789' },
      { name: '박민수', email: 'park.minsu@example.com', phone: '010-3456-7890' },
      { name: '최순자', email: 'choi.sunja@example.com', phone: '010-4567-8901' },
      { name: '정광호', email: 'jung.kwangho@example.com', phone: '010-5678-9012' },
      { name: '한미영', email: 'han.miyoung@example.com', phone: '010-6789-0123' },
      { name: '윤대수', email: 'yoon.daesu@example.com', phone: '010-7890-1234' }
    ];

    const seniorsToInsert = koreanUsers.map((user, index) => ({
      name: user.name,
      phone: user.phone,
      org_id: ORG_ID,
      birth: new Date(1945 + index * 2, index % 12, (index + 1) * 3).toISOString().split('T')[0],
      gender_enum: index % 2 === 0 ? 'M' : 'F',
      guardian_phone: `010-${1000 + index}00-${1000 + index}`,
      eduyear: ['elementary', 'middle', 'high', 'college'][index % 4],
      address: `서울시 강남구 ${index + 1}동 ${(index + 1) * 100}번지`,
      note: index % 3 === 0 ? '고혈압 병력 있음' : index % 3 === 1 ? '당뇨 병력 있음' : null,
      created_at: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString() // Created over last 6 days
    }));

    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .insert(seniorsToInsert)
      .select();

    if (seniorsError) {
      console.error('Error creating seniors:', seniorsError);
      return;
    }
    console.log(`✅ Created ${seniors.length} Korean seniors`);

    // 3. Create schedules for each senior
    console.log('📅 Creating schedules...');
    const schedulesToInsert = seniors.map((senior, index) => {
      const startDate = new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000); // Started 1-7 weeks ago
      const endDate = new Date(startDate.getTime() + 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks duration
      
      return {
        senior_id: senior.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        sessions_per_week: 3,
        status: index >= 5 ? 'Completed' : 'Active', // Last 2 users are completed
        created_at: startDate.toISOString()
      };
    });

    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .insert(schedulesToInsert)
      .select();

    if (schedulesError) {
      console.error('Error creating schedules:', schedulesError);
      return;
    }
    console.log(`✅ Created ${schedules.length} schedules`);

    // 4. Create motor training results (recent activity)
    console.log('🏃‍♂️ Creating motor training results...');
    const motorResults = [];
    
    // Create results for active users (김철수, 이영희, 박민수, 최순자, 정광호)
    const activeUsers = seniors.slice(0, 5);
    
    for (let i = 0; i < activeUsers.length; i++) {
      const senior = activeUsers[i];
      const daysBack = [0, 1, 2, 1, 0][i]; // Some today, some yesterday, some 2 days ago
      
      // Create multiple results for each user
      for (let j = 0; j < 3; j++) {
        const testDate = new Date(Date.now() - (daysBack + j) * 24 * 60 * 60 * 1000);
        
        motorResults.push({
          senior_id: senior.id,
          raw: {
            test_type: ['Balance', 'Coordination', 'Strength'][j % 3],
            score: Math.floor(Math.random() * 40) + 60,
            duration: Math.floor(Math.random() * 300) + 180,
            exercises: ['squats', 'balance', 'coordination'][j % 3]
          },
          bpm: Math.floor(Math.random() * 40) + 60, // Heart rate 60-100
          video_key: `videos/${senior.name}_session_${j + 1}.mp4`,
          created_at: testDate.toISOString()
        });
      }
    }

    const { data: motorData, error: motorError } = await supabase
      .from('motor_results')
      .insert(motorResults)
      .select();

    if (motorError) {
      console.error('Error creating motor results:', motorError);
      return;
    }
    console.log(`✅ Created ${motorData.length} motor training results`);

    // 5. Create cognitive training results 
    console.log('🧠 Creating cognitive training results...');
    const cognitiveResults = [];
    
    for (let i = 0; i < activeUsers.length; i++) {
      const senior = activeUsers[i];
      const daysBack = [0, 0, 1, 2, 1][i]; // Mix of recent activity
      
      // Create cognitive results
      for (let j = 0; j < 2; j++) {
        const testDate = new Date(Date.now() - (daysBack + j) * 24 * 60 * 60 * 1000);
        
        cognitiveResults.push({
          senior_id: senior.id,
          raw: {
            test_type: ['Memory', 'Attention'][j % 2],
            score: Math.floor(Math.random() * 30) + 70,
            duration: Math.floor(Math.random() * 240) + 120,
            tasks_completed: Math.floor(Math.random() * 10) + 5
          },
          video_key: `videos/${senior.name}_cognitive_${j + 1}.mp4`,
          created_at: testDate.toISOString()
        });
      }
    }

    const { data: cognitiveData, error: cognitiveError } = await supabase
      .from('cognitive_results')
      .insert(cognitiveResults)
      .select();

    if (cognitiveError) {
      console.error('Error creating cognitive results:', cognitiveError);
      return;
    }
    console.log(`✅ Created ${cognitiveData.length} cognitive training results`);

    // 6. Verify the data
    console.log('\n🔍 Verifying created data...');
    
    const { data: verifyOrg } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', ORG_ID)
      .single();
      
    const { data: verifySeniors } = await supabase
      .from('seniors')
      .select('id, name, org_id')
      .eq('org_id', ORG_ID);
      
    const { data: verifySchedules } = await supabase
      .from('schedules')
      .select('senior_id, status')
      .in('senior_id', verifySeniors.map(s => s.id));
      
    const { data: verifyMotor } = await supabase
      .from('motor_results')
      .select('senior_id, created_at')
      .in('senior_id', verifySeniors.map(s => s.id));
      
    const { data: verifyCognitive } = await supabase
      .from('cognitive_results')
      .select('senior_id, created_at')
      .in('senior_id', verifySeniors.map(s => s.id));

    console.log('📊 Data Summary:');
    console.log(`   Organization: ${verifyOrg.name} (${verifyOrg.licence_seats} seats)`);
    console.log(`   Seniors: ${verifySeniors.length}`);
    console.log(`   Active schedules: ${verifySchedules.filter(s => s.status === 'Active').length}`);
    console.log(`   Inactive schedules: ${verifySchedules.filter(s => s.status === 'Inactive').length}`);
    console.log(`   Motor results: ${verifyMotor.length}`);
    console.log(`   Cognitive results: ${verifyCognitive.length}`);
    
    console.log('\n👥 Korean Users Created:');
    verifySeniors.forEach((senior, index) => {
      console.log(`   ${index + 1}. ${senior.name} (${senior.id})`);
    });

    console.log('\n✅ Dashboard test data creation completed successfully!');
    console.log('🔗 You can now test the dashboard at:');
    console.log(`   http://localhost:3000/org/${ORG_ID}/dashboard`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the script
createTestData().catch(console.error);