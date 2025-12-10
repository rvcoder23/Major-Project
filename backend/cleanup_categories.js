const supabase = require('./config/supabaseClient');

async function cleanupCategories() {
    try {
        console.log('Starting cleanup...');

        // 1. Update Beverage -> Beverages
        const { error: e1 } = await supabase.from('food_menu')
            .update({ category: 'Beverages' })
            .eq('category', 'Beverage');
        if (e1) console.error('Error updating Beverage:', e1);
        else console.log('Updated Beverage -> Beverages');

        // 2. Update Bread -> Roti / Bread
        const { error: e2 } = await supabase.from('food_menu')
            .update({ category: 'Roti / Bread' })
            .eq('category', 'Bread');
        if (e2) console.error('Error updating Bread:', e2);
        else console.log('Updated Bread -> Roti / Bread');

        // 3. Update Rice -> Rice / Biryani
        const { error: e3 } = await supabase.from('food_menu')
            .update({ category: 'Rice / Biryani' })
            .eq('category', 'Rice');
        if (e3) console.error('Error updating Rice:', e3);
        else console.log('Updated Rice -> Rice / Biryani');

        // 4. Delete bnkjjb
        const { error: e4 } = await supabase.from('food_menu')
            .delete()
            .eq('category', 'bnkjjb');
        if (e4) console.error('Error deleting bnkjjb:', e4);
        else console.log('Deleted bnkjjb');

        // 5. Delete Food
        const { error: e5 } = await supabase.from('food_menu')
            .delete()
            .eq('category', 'Food');
        if (e5) console.error('Error deleting Food:', e5);
        else console.log('Deleted Food');

        console.log('Cleanup complete.');

    } catch (e) {
        console.error('Exception:', e);
    }
}

cleanupCategories();
