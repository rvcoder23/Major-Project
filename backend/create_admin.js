const bcrypt = require('bcryptjs');
const supabase = require('./config/supabaseClient');

async function createAdminUser() {
    console.log('========================================');
    console.log('Creating Admin User');
    console.log('========================================\n');

    const username = 'admin';
    const password = 'admin123';

    try {
        // Step 1: Generate password hash
        console.log('Step 1: Generating password hash...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        console.log(`✅ Hash generated: ${passwordHash}\n`);

        // Step 2: Delete existing admin user (if any)
        console.log('Step 2: Removing existing admin user...');
        const { error: deleteError } = await supabase
            .from('admin_users')
            .delete()
            .eq('username', username);

        if (deleteError) {
            console.log(`⚠️  Delete error (this is OK if user doesn't exist): ${deleteError.message}`);
        } else {
            console.log('✅ Existing user removed\n');
        }

        // Step 3: Insert new admin user
        console.log('Step 3: Creating new admin user...');
        const { data, error } = await supabase
            .from('admin_users')
            .insert([
                {
                    username: username,
                    password_hash: passwordHash
                }
            ])
            .select();

        if (error) {
            console.error('❌ Error creating user:', error);
            return;
        }

        console.log('✅ Admin user created successfully!');
        console.log('User details:', data);
        console.log('\n========================================');
        console.log('SUCCESS!');
        console.log('========================================');
        console.log('Login credentials:');
        console.log(`  Username: ${username}`);
        console.log(`  Password: ${password}`);
        console.log('\nYou can now login to your application!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

createAdminUser();
