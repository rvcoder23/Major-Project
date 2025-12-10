const supabase = require('./config/supabaseClient');

async function checkCategories() {
    try {
        const { data, error } = await supabase
            .from('food_menu')
            .select('category');

        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }

        const counts = {};
        data.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });

        console.log('Categories:', JSON.stringify(counts, null, 2));

    } catch (e) {
        console.error('Exception:', e);
    }
}

checkCategories();
