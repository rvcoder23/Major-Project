const fs = require('fs');
const path = require('path');

// Read the SQL migration file
const sqlFile = path.join(__dirname, '../supabase/housekeeping_schema_fixed.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('='.repeat(60));
console.log('Housekeeping Database Migration Script');
console.log('='.repeat(60));
console.log('');
console.log('📋 Instructions:');
console.log('');
console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor (left sidebar)');
console.log('4. Click "New Query"');
console.log('5. Copy and paste the SQL below:');
console.log('');
console.log('-'.repeat(60));
console.log(sqlContent);
console.log('-'.repeat(60));
console.log('');
console.log('6. Click "Run" to execute the migration');
console.log('');
console.log('✅ After running the SQL, your housekeeping module will be ready!');
console.log('');
console.log('📝 Note: This migration is safe to run multiple times');
console.log('   It uses IF NOT EXISTS and ON CONFLICT DO NOTHING');
console.log('');

// Also save a copy for easy access
const outputFile = path.join(__dirname, '../HOUSEKEEPING_MIGRATION.sql');
fs.writeFileSync(outputFile, sqlContent);
console.log(`💾 SQL content also saved to: ${outputFile}`);
console.log('');



