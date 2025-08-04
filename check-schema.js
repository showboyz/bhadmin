require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking table schemas...');
    
    // Check motor_results schema
    console.log('\n1. Motor Results table:');
    const { data: motorResults, error: motorError } = await supabase
      .from('motor_results')
      .select('*')
      .limit(1);
      
    if (motorError) {
      console.error('❌ Motor results error:', motorError);
    } else {
      console.log('✅ Motor results sample:', motorResults[0] || 'No data found');
      if (motorResults[0]) {
        console.log('   Columns:', Object.keys(motorResults[0]));
      }
    }
    
    // Check cognitive_results schema
    console.log('\n2. Cognitive Results table:');
    const { data: cognitiveResults, error: cognitiveError } = await supabase
      .from('cognitive_results')
      .select('*')
      .limit(1);
      
    if (cognitiveError) {
      console.error('❌ Cognitive results error:', cognitiveError);
    } else {
      console.log('✅ Cognitive results sample:', cognitiveResults[0] || 'No data found');
      if (cognitiveResults[0]) {
        console.log('   Columns:', Object.keys(cognitiveResults[0]));
      }
    }
    
    // Check what training results exist at all
    console.log('\n3. Checking for any existing training results...');
    const { data: allMotor, error: allMotorError } = await supabase
      .from('motor_results')
      .select('senior_id, created_at');
      
    const { data: allCognitive, error: allCognitiveError } = await supabase
      .from('cognitive_results')
      .select('senior_id, created_at');
      
    console.log(`Motor results count: ${allMotor?.length || 0}`);
    console.log(`Cognitive results count: ${allCognitive?.length || 0}`);
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSchema();