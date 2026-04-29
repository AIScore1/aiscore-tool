#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

console.log('🔌 Testing Supabase connection...\n');
console.log(`📍 URL: ${url}`);
console.log(`🔑 Key: ${key.substring(0, 20)}...\n`);

const supabase = createClient(url, key);

(async () => {
  try {
    // Test 1: Try to query credit_balance
    console.log('Test 1: Checking credit_balance table...');
    const { data, error } = await supabase
      .from('credit_balance')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ credit_balance table does not exist');
        console.log('\n⚠️  ACTION NEEDED: Run the schema.sql in Supabase\n');
        console.log('Steps:');
        console.log('1. Go to https://supabase.com and sign into your project');
        console.log('2. Click "SQL Editor" in the left sidebar');
        console.log('3. Click "New Query"');
        console.log('4. Copy all content from docs/schema.sql');
        console.log('5. Paste into Supabase SQL editor');
        console.log('6. Click "Run"\n');
        process.exit(1);
      } else {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    }

    console.log('✅ credit_balance table exists');
    console.log(`   Data: ${JSON.stringify(data)}\n`);

    // Test 2: Check if all required tables exist
    console.log('Test 2: Checking all required tables...');
    const tables = ['audits', 'improvements', 'leads', 'api_usage', 'credit_balance'];
    let allTablesExist = true;

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (tableError && tableError.message.includes('does not exist')) {
        console.error(`   ❌ ${table}`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ ${table}`);
      }
    }

    if (!allTablesExist) {
      console.error('\n❌ Some tables are missing. Run schema.sql');
      process.exit(1);
    }

    console.log('\n✅ All tables exist!\n');

    // Test 3: Test write operation
    console.log('Test 3: Testing write operation...');
    const { error: writeError } = await supabase
      .from('credit_balance')
      .update({ initial_credits_usd: 100 })
      .eq('id', 1);

    if (writeError) {
      console.error('❌ Write failed:', writeError.message);
      process.exit(1);
    }

    console.log('✅ Write operation successful\n');

    console.log('=' .repeat(50));
    console.log('✅ Supabase is fully connected and ready!');
    console.log('=' .repeat(50));
    console.log('\nYou can now:');
    console.log('- Run GEO audits (data saved to Supabase)');
    console.log('- Leads will persist across server restarts');
    console.log('- API calls are logged to database\n');

  } catch (e) {
    console.error('❌ Unexpected error:', e.message);
    process.exit(1);
  }
})();
