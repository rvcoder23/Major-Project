const bcrypt = require('bcryptjs');
const supabase = require('./config/supabaseClient');

async function testLogin() {
    console.log('====== Testing Login System ======\n');

    const testUsername = 'admin';
    const testPassword = 'admin123';

    console.log(`1. Testing with username: ${testUsername}, password: ${testPassword}\n`);

    // Step 1: Check Supabase connection
    console.log('2. Checking Supabase connection...');
    try {
        const { data: testQuery, error: testError } = await supabase
            .from('admin_users')
            .select('count')
            .limit(1);

        if (testError) {
            console.error('❌ Supabase connection error:', testError);
            return;
        }
        console.log('✅ Supabase connection successful\n');
    } catch (err) {
        console.error('❌ Supabase connection failed:', err);
        return;
    }

    // Step 2: Fetch user from database
    console.log('3. Fetching admin user from database...');
    const { data: user, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', testUsername)
        .single();

    if (error) {
        console.error(`❌ Error fetching user:`, error);
        return;
    }

    if (!user) {
        console.error(`❌ User '${testUsername}' not found in database`);
        return;
    }

    console.log('✅ User found in database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Password Hash: ${user.password_hash}`);
    console.log(`   Created At: ${user.created_at}\n`);

    // Step 3: Verify password hash format
    console.log('4. Checking password hash format...');
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        console.log(`✅ Valid bcrypt hash format\n`);
    } else {
        console.log(`❌ Invalid hash format: ${user.password_hash}\n`);
        return;
    }

    // Step 4: Test password comparison
    console.log('5. Testing password comparison...');
    try {
        const isMatch = await bcrypt.compare(testPassword, user.password_hash);

        if (isMatch) {
            console.log(`✅ Password matches! Login should work.\n`);
            console.log('====== TEST SUCCESSFUL ======');
            console.log('The admin user exists and password is correct.');
            console.log('You should be able to login with:');
            console.log(`  Username: ${testUsername}`);
            console.log(`  Password: ${testPassword}`);
        } else {
            console.log(`❌ Password does NOT match`);
            console.log(`Expected password: ${testPassword}`);
            console.log(`Hash in database: ${user.password_hash}\n`);

            // Generate correct hash for comparison
            console.log('Generating fresh hash for comparison...');
            const salt = await bcrypt.genSalt(10);
            const correctHash = await bcrypt.hash(testPassword, salt);
            console.log(`Fresh hash for '${testPassword}': ${correctHash}`);
            console.log(`\n❌ The password hash in database is INCORRECT`);
            console.log(`Run this SQL in Supabase to fix it:`);
            console.log(`UPDATE admin_users SET password_hash = '${correctHash}' WHERE username = '${testUsername}';`);
        }
    } catch (err) {
        console.error('❌ Error comparing passwords:', err);
    }
}

testLogin().catch(console.error);
