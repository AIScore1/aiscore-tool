#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗄️  AI Score Database Setup\n');

const schemaPath = path.join(__dirname, '../docs/schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.sql not found at', schemaPath);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('📋 Schema to run:\n');
console.log(schema);
console.log('\n' + '='.repeat(60));
console.log('\n✅ To apply this schema:\n');
console.log('1. Go to https://supabase.com and sign in to your project');
console.log('2. Click "SQL Editor" in the left sidebar');
console.log('3. Click "New Query"');
console.log('4. Paste the schema above');
console.log('5. Click "Run"\n');
console.log('Alternative: Copy the contents of docs/schema.sql and run it in Supabase SQL Editor\n');

console.log('After schema is created, add these to .env.local:\n');
console.log('SUPABASE_URL=https://[your-project].supabase.co');
console.log('SUPABASE_ANON_KEY=[your-anon-key]\n');

console.log('Get these values from:\n');
console.log('- Project Settings → API');
console.log('- Copy "Project URL" and "anon public" key\n');

console.log('Then restart the dev server: npm run dev\n');
