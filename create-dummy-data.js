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

async function createDummyData() {
  try {
    console.log('🏥 Looking for andrew\'s clinic...');

    // Find andrew's clinic organization
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .ilike('name', '%andrew%clinic%')
      .limit(1);

    if (orgError) {
      console.error('❌ Error finding organization:', orgError);
      return;
    }

    let andrewsClinic = orgs?.[0];

    // If no andrew's clinic found, create it
    if (!andrewsClinic) {
      console.log('🏗️ Creating andrew\'s clinic organization...');
      const { data: newOrg, error: createError } = await supabase
        .from('organisations')
        .insert({
          name: "Andrew's Clinic",
          org_type: 'healthcare',
          contact_email: 'admin@andrewsclinic.com',
          contact_phone: '02-1234-5678',
          address: {
            street: '123 Health Street',
            city: 'Seoul',
            country: 'South Korea'
          },
          licence_seats: 50,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating organization:', createError);
        return;
      }
      andrewsClinic = newOrg;
    }

    console.log(`✅ Found/Created organization: ${andrewsClinic.name} (ID: ${andrewsClinic.id})`);

    // Check if dummy seniors already exist
    const { data: existingSeniors } = await supabase
      .from('seniors')
      .select('id, name')
      .eq('org_id', andrewsClinic.id);

    let seniors = existingSeniors;

    if (existingSeniors && existingSeniors.length > 0) {
      console.log(`ℹ️ Found ${existingSeniors.length} existing seniors. Using existing seniors for training data.`);
    } else {
      // Create dummy seniors
      console.log('👥 Creating dummy seniors...');
      const dummySeniors = [
        {
          name: '김철수',
          birth: '1952-03-15',
          gender_enum: 'M',
          phone: '010-1234-5678',
          guardian_phone: '010-9876-5432',
          note: '고혈압, 당뇨병 관리 중',
          org_id: andrewsClinic.id,
          eduyear: 'high'
        },
        {
          name: '이영희',
          birth: '1956-07-22',
          gender_enum: 'F',
          phone: '010-2345-6789',
          guardian_phone: '010-8765-4321',
          note: '무릎 관절염 주의',
          org_id: andrewsClinic.id,
          eduyear: 'middle'
        },
        {
          name: '박민수',
          birth: '1949-11-08',
          gender_enum: 'M',
          phone: '010-3456-7890',
          guardian_phone: '010-7654-3210',
          note: '심장질환 과거력',
          org_id: andrewsClinic.id,
          eduyear: 'college'
        },
        {
          name: '최순자',
          birth: '1954-05-30',
          gender_enum: 'F',
          phone: '010-4567-8901',
          guardian_phone: '010-6543-2109',
          note: '경미한 치매 초기 증상',
          org_id: andrewsClinic.id,
          eduyear: 'elementary'
        },
        {
          name: '정광호',
          birth: '1950-09-12',
          gender_enum: 'M',
          phone: '010-5678-9012',
          guardian_phone: '010-5432-1098',
          note: '파킨슨병 초기',
          org_id: andrewsClinic.id,
          eduyear: 'high'
        },
        {
          name: '한미영',
          birth: '1955-12-03',
          gender_enum: 'F',
          phone: '010-6789-0123',
          guardian_phone: '010-4321-0987',
          note: '골다공증 관리',
          org_id: andrewsClinic.id,
          eduyear: 'middle'
        },
        {
          name: '윤대수',
          birth: '1947-01-25',
          gender_enum: 'M',
          phone: '010-7890-1234',
          guardian_phone: '010-3210-9876',
          note: '건강한 상태',
          org_id: andrewsClinic.id,
          eduyear: 'college'
        }
      ];

      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .insert(dummySeniors)
        .select();

      if (seniorsError) {
        console.error('❌ Error creating seniors:', seniorsError);
        return;
      }

      console.log(`✅ Created ${seniors.length} seniors`);
      
      // Create training schedules for seniors
      console.log('📅 Creating training schedules...');
      const schedulePromises = seniors.map(senior => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Random start within last 30 days
        
        return supabase
          .from('schedules')
          .insert({
            senior_id: senior.id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: new Date(startDate.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 4 weeks later
            sessions_per_week: 3, // 3 times per week
            status: 'Active'
          });
      });

      await Promise.all(schedulePromises);
      console.log('✅ Created training schedules');
    }

    // Always create training results (whether seniors existed or were just created)
    console.log('🏃 Creating recent training results...');
    const recentSeniors = seniors.slice(0, 5); // Top 5 for recent activity
      
      for (const senior of recentSeniors) {
        const daysAgo = Math.floor(Math.random() * 3); // 0-2 days ago
        const resultDate = new Date();
        resultDate.setDate(resultDate.getDate() - daysAgo);

        // Create motor results
        if (Math.random() > 0.3) { // 70% chance
          await supabase
            .from('motor_results')
            .insert({
              senior_id: senior.id,
              exercise_type: ['balance', 'strength', 'flexibility'][Math.floor(Math.random() * 3)],
              duration_seconds: 1200 + Math.floor(Math.random() * 600), // 20-30 minutes
              score: 70 + Math.floor(Math.random() * 30), // 70-100 score
              created_at: resultDate.toISOString()
            });
        }

        // Create cognitive results
        if (Math.random() > 0.3) { // 70% chance
          await supabase
            .from('cognitive_results')
            .insert({
              senior_id: senior.id,
              game_type: ['memory', 'attention', 'executive'][Math.floor(Math.random() * 3)],
              level_completed: Math.floor(Math.random() * 10) + 1,
              score: 60 + Math.floor(Math.random() * 40), // 60-100 score
              duration_seconds: 900 + Math.floor(Math.random() * 600), // 15-25 minutes
              created_at: resultDate.toISOString()
            });
        }
      }

      // Create older results for inactive users (making some seniors inactive)
      console.log('😴 Creating inactive user data...');
      const inactiveSeniors = seniors.slice(5, 7); // Last 2 seniors will be inactive
      
      for (const senior of inactiveSeniors) {
        const daysAgo = 5 + Math.floor(Math.random() * 10); // 5-14 days ago
        const resultDate = new Date();
        resultDate.setDate(resultDate.getDate() - daysAgo);

        // Create old results to make them appear inactive
        await supabase
          .from('motor_results')
          .insert({
            senior_id: senior.id,
            exercise_type: 'balance',
            duration_seconds: 1800,
            score: 85,
            created_at: resultDate.toISOString()
          });
      }

    console.log('✅ Created training results');

    console.log(`🎉 Dummy data setup complete for ${andrewsClinic.name}!`);
    console.log(`📊 Dashboard should now show:`);
    console.log(`   - Recent User Activity (Top 5): Users with activity in last 3 days`);
    console.log(`   - Inactive Users: Users with no activity for 3+ days`);
    console.log(`🔗 Visit: http://localhost:3000/org/${andrewsClinic.id}/dashboard`);

  } catch (error) {
    console.error('💥 Error creating dummy data:', error);
  }
}

createDummyData();