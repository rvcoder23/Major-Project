const supabase = require('./config/supabaseClient');

async function runMigration() {
    try {
        console.log('Starting database migration...');
        
        // Test connection first
        const { data: testData, error: testError } = await supabase
            .from('food_menu')
            .select('*')
            .limit(1);
            
        if (testError) {
            console.error('Database connection error:', testError);
            return;
        }
        
        console.log('Database connected successfully');
        console.log('Current schema:', Object.keys(testData[0]));
        
        // Check if new columns already exist
        const { data: sampleData, error: sampleError } = await supabase
            .from('food_menu')
            .select('full_plate_price, half_plate_price, supports_half_plate')
            .limit(1);
            
        if (sampleError && sampleError.code === 'PGRST116') {
            console.log('New columns do not exist. Migration needed.');
            console.log('Please run the SQL migration manually in Supabase dashboard:');
            console.log('');
            console.log('-- Add new columns to food_menu table');
            console.log('ALTER TABLE food_menu ADD COLUMN half_plate_price DECIMAL(10,2) DEFAULT NULL;');
            console.log('ALTER TABLE food_menu ADD COLUMN full_plate_price DECIMAL(10,2) DEFAULT NULL;');
            console.log('ALTER TABLE food_menu ADD COLUMN supports_half_plate BOOLEAN DEFAULT FALSE;');
            console.log('');
            console.log('-- Add new columns to food_orders table');
            console.log('ALTER TABLE food_orders ADD COLUMN order_type VARCHAR(20) DEFAULT \'Restaurant\';');
            console.log('ALTER TABLE food_orders ADD COLUMN room_number INTEGER DEFAULT NULL;');
            console.log('ALTER TABLE food_orders ADD COLUMN plate_type VARCHAR(20) DEFAULT \'Full\';');
            console.log('');
            console.log('-- Update existing menu items');
            console.log('UPDATE food_menu SET full_plate_price = price, half_plate_price = ROUND(price * 0.6, 2), supports_half_plate = TRUE WHERE category IN (\'Main Course\', \'Rice\', \'Bread\');');
            console.log('UPDATE food_menu SET full_plate_price = price, supports_half_plate = FALSE WHERE category IN (\'Beverage\', \'Dessert\');');
        } else if (sampleError) {
            console.error('Error checking schema:', sampleError);
        } else {
            console.log('New columns already exist. Schema is up to date.');
        }
        
    } catch (err) {
        console.error('Migration error:', err);
    }
}

runMigration();
