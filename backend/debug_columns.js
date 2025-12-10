const supabase = require('./config/supabaseClient');

async function checkRoomColumn(roomNumber) {
    try {
        console.log('Checking with column: room_number');

        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('id, room_number, status')
            .eq('room_number', roomNumber)
            .single();

        if (roomError) {
            console.error('Error with room_number:', roomError);
        } else {
            console.log('Success with room_number:', room);
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

checkRoomColumn(111);
