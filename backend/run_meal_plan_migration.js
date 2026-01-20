const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🚀 Starting meal plan feature migration...\n');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../supabase/migrations/add_meal_plan_feature.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration file loaded successfully');
        console.log('📊 Executing migration...\n');

        // Split the SQL into individual statements
        // Supabase RPC can execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: migrationSQL
        });

        if (error) {
            // If exec_sql doesn't exist, we need to execute statements individually
            console.log('⚠️  exec_sql function not available, executing statements individually...\n');

            // Split by semicolons but preserve function bodies
            const statements = migrationSQL
                .split(/;(?=\s*(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|COMMENT|--|\n\n))/gi)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                if (!stmt || stmt.trim() === '') continue;

                try {
                    // Use raw SQL execution via Supabase
                    const { error: stmtError } = await supabase.rpc('exec', { sql: stmt + ';' });

                    if (stmtError) {
                        console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
                        console.error(`   Statement: ${stmt.substring(0, 100)}...`);
                        errorCount++;
                    } else {
                        successCount++;
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.error(`❌ Exception in statement ${i + 1}:`, err.message);
                    errorCount++;
                }
            }

            console.log(`\n📊 Migration Summary:`);
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ❌ Failed: ${errorCount}`);

            if (errorCount > 0) {
                console.log('\n⚠️  Some statements failed. Please run the migration manually via Supabase SQL Editor.');
                console.log(`   Migration file: ${migrationPath}`);
            }
        } else {
            console.log('✅ Migration executed successfully!');
        }

        // Verify migration by checking if tables exist
        console.log('\n🔍 Verifying migration...');

        const { data: mealPlanConfig, error: configError } = await supabase
            .from('meal_plan_config')
            .select('*')
            .limit(1);

        if (configError) {
            console.error('❌ Verification failed: meal_plan_config table not accessible');
            console.error('   Error:', configError.message);
            console.log('\n📝 Please run the migration manually:');
            console.log(`   1. Open Supabase SQL Editor: ${supabaseUrl}/project/_/sql`);
            console.log(`   2. Copy and paste the contents of: ${migrationPath}`);
            console.log(`   3. Execute the SQL`);
        } else {
            console.log('✅ meal_plan_config table verified');

            const { data: entitlements, error: entError } = await supabase
                .from('meal_entitlements')
                .select('*')
                .limit(1);

            if (entError) {
                console.error('⚠️  meal_entitlements table not accessible:', entError.message);
            } else {
                console.log('✅ meal_entitlements table verified');
            }

            // Check if bookings table has new columns
            const { data: bookings, error: bookError } = await supabase
                .from('bookings')
                .select('meal_plan, number_of_guests, meal_plan_cost')
                .limit(1);

            if (bookError) {
                console.error('⚠️  Bookings table columns not accessible:', bookError.message);
            } else {
                console.log('✅ Bookings table columns verified');
            }

            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Restart the backend server');
            console.log('   2. Test booking creation with meal plans');
            console.log('   3. Verify meal entitlement tracking');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n📝 Manual migration required:');
        console.log(`   1. Open Supabase SQL Editor: ${supabaseUrl}/project/_/sql`);
        console.log(`   2. Copy and paste the contents of: supabase/migrations/add_meal_plan_feature.sql`);
        console.log(`   3. Execute the SQL`);
        process.exit(1);
    }
}

// Run the migration
runMigration();
