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

async function disableRLS() {
  try {
    console.log('🔓 Temporarily disabling RLS for testing...\n');

    // Disable RLS on all tables for testing
    const tables = ['organisations', 'seniors', 'schedules', 'motor_results', 'cognitive_results', 'reports'];
    
    for (const table of tables) {
      console.log(`Disabling RLS on ${table}...`);
      
      try {
        // This won't work with the JS client, but let's try
        const { error } = await supabase.rpc('disable_rls', { table_name: table });
        if (error) {
          console.log(`   ⚠️ Could not disable RLS on ${table} via RPC: ${error.message}`);
        } else {
          console.log(`   ✅ RLS disabled on ${table}`);
        }
      } catch (err) {
        console.log(`   ⚠️ Could not disable RLS on ${table}: RPC function not available`);
      }
    }

    console.log('\n📝 Note: RLS needs to be disabled manually in Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Database > Tables');
    console.log('   4. For each table (organisations, seniors, schedules, motor_results, cognitive_results):');
    console.log('      - Click on the table');
    console.log('      - Go to Settings tab');
    console.log('      - Toggle "Enable Row Level Security" to OFF');
    console.log('   5. Or run these SQL commands in the SQL Editor:');
    console.log('');
    for (const table of tables) {
      console.log(`      ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    console.log('\n✨ Once RLS is disabled, the dashboard should show all the Korean names and data!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

disableRLS();