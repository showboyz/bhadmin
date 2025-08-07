const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtfostmllgjxosvvkauh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zm9zdG1sbGdqeG9zdnZrYXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwNzY3NTMsImV4cCI6MjAzNjY1Mjc1M30.cEWnkPZqkPGUo8mwUpLZJqPcr2V68dLR3mW4HPGOHKA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugHealthStatus() {
  console.log('🔍 Debugging Health Status Field in Seniors Table...\n');

  try {
    // Get seniors for Andrew's Clinic
    const { data: seniors, error } = await supabase
      .from('seniors')
      .select('id, name, gender_enum, health_status')
      .eq('org_id', 'bf579a76-e9c5-45be-8659-7e62664883c4')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching seniors:', error);
      return;
    }

    console.log(`✅ Found ${seniors.length} seniors for Andrew's Clinic\n`);

    // Analyze health_status field
    const healthStatusValues = {};
    const genderValues = {};
    
    seniors.forEach((senior, index) => {
      console.log(`Senior ${index + 1}:`);
      console.log(`  - Name: ${senior.name}`);
      console.log(`  - Gender: ${senior.gender_enum}`);
      console.log(`  - Health Status: ${senior.health_status || 'NULL/UNDEFINED'}`);
      console.log('');

      // Count health status values
      const healthStatus = senior.health_status || 'NULL/UNDEFINED';
      healthStatusValues[healthStatus] = (healthStatusValues[healthStatus] || 0) + 1;

      // Count gender values
      const gender = senior.gender_enum || 'NULL/UNDEFINED';
      genderValues[gender] = (genderValues[gender] || 0) + 1;
    });

    console.log('📊 Health Status Distribution:');
    Object.entries(healthStatusValues).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n📊 Gender Distribution:');
    Object.entries(genderValues).forEach(([gender, count]) => {
      console.log(`  - ${gender}: ${count}`);
    });

    // Check what the exact values are filtering for
    console.log('\n🔍 Testing Health Status Filters:');
    const excellentCount = seniors.filter(s => s.health_status === 'Excellent').length;
    const goodCount = seniors.filter(s => s.health_status === 'Good').length;
    const fairCount = seniors.filter(s => s.health_status === 'Fair').length;
    const poorCount = seniors.filter(s => s.health_status === 'Poor').length;

    console.log(`  - Excellent: ${excellentCount}`);
    console.log(`  - Good: ${goodCount}`);
    console.log(`  - Fair: ${fairCount}`);
    console.log(`  - Poor: ${poorCount}`);

    console.log('\n🔍 Testing Gender Filters:');
    const maleCount = seniors.filter(s => s.gender_enum === 'M').length;
    const femaleCount = seniors.filter(s => s.gender_enum === 'F').length;

    console.log(`  - Male (M): ${maleCount}`);
    console.log(`  - Female (F): ${femaleCount}`);

    // Get all unique values to see what's actually in the database
    const allHealthStatuses = [...new Set(seniors.map(s => s.health_status))];
    const allGenders = [...new Set(seniors.map(s => s.gender_enum))];

    console.log('\n🔍 All Unique Values:');
    console.log(`  - Health Statuses: [${allHealthStatuses.map(v => `"${v}"`).join(', ')}]`);
    console.log(`  - Genders: [${allGenders.map(v => `"${v}"`).join(', ')}]`);

    // Check table schema
    console.log('\n🔍 Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_columns', { table_name: 'seniors' });
    
    if (schemaError) {
      console.log('Could not fetch schema info');
    } else {
      console.log('Schema data:', schemaData);
    }

  } catch (err) {
    console.error('❌ Debug error:', err);
  }
}

debugHealthStatus();