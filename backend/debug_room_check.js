const supabase = require('./config/supabaseClient');

async function checkRoom(roomNumber) {
    try {
        console.log(`Checking room: ${roomNumber} (Type: ${typeof roomNumber})`);

        // 1. Exact query as in food.js
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('id, number, status')
            .eq('number', roomNumber)
            .single();

        if (roomError) {
            console.error('Error (Exact Check):', roomError);
        } else {
            console.log('Result (Exact Check):', room);
        }

        // 2. Query without .eq to see what exists/schema
        const { data: allRooms, error: listError } = await supabase
            .from('rooms')
            .select('id, number, status')
            .limit(5);

        if (listError) {
            console.error('Error (List Check):', listError);
        } else {
            console.log('First 5 rooms:', allRooms);
            const r111 = allRooms.find(r => r.number == roomNumber);
            if (r111) console.log('Found 111 in first 5 manually:', r111);
        }

        // 3. Try query with string vs number
        const { data: roomStr, error: errStr } = await supabase
            .from('rooms')
            .select('*')
            .eq('number', String(roomNumber))
            .maybeSingle(); // maybeSingle allows 0 rows without error

        console.log('Result (String Check):', roomStr);

    } catch (e) {
        console.error('Exception:', e);
    }
}

// Run the check for 111
checkRoom(111);
