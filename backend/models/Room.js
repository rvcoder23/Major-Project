class Room {
    static async findById(roomId) {
        const { data, error } = await supabase
            .from('rooms')
            .select(`
                *,
                room_amenities(amenity_name)
            `)
            .eq('id', roomId)
            .single();

        if (error) throw error;
        return data;
    }

    static async findAvailableRooms(checkIn, checkOut, preferences = {}) {
        // Base query to find available rooms
        let query = supabase
            .from('rooms')
            .select(`
                *,
                room_amenities(amenity_name)
            `)
            .eq('status', 'Available');

        // Apply preferences filters
        if (preferences.bedType) {
            query = query.in('bed_type', Array.isArray(preferences.bedType) ? preferences.bedType : [preferences.bedType]);
        }
        if (preferences.viewType) {
            query = query.in('view_type', Array.isArray(preferences.viewType) ? preferences.viewType : [preferences.viewType]);
        }
        if (preferences.isAccessible !== undefined) {
            query = query.eq('is_accessible', preferences.isAccessible);
        }
        if (preferences.isSmokingAllowed !== undefined) {
            query = query.eq('is_smoking_allowed', preferences.isSmokingAllowed);
        }
        if (preferences.minRoomSize) {
            query = query.gte('room_size_sqft', preferences.minRoomSize);
        }
        if (preferences.amenities && preferences.amenities.length > 0) {
            query = query.contains('amenities', preferences.amenities);
        }

        const { data: availableRooms, error } = await query;
        if (error) throw error;

        // Additional filtering for date availability
        const { data: bookedRooms } = await supabase
            .from('bookings')
            .select('room_id')
            .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn}),and(booking_status.eq.Confirmed,check_in.lte.${checkOut},check_out.gte.${checkIn})`);

        const bookedRoomIds = new Set(bookedRooms.map(br => br.room_id));
        return availableRooms.filter(room => !bookedRoomIds.has(room.id));
    }

    static async updateRoomPreferences(roomId, preferences) {
        const { data, error } = await supabase
            .from('rooms')
            .update({
                bed_type: preferences.bedType,
                mattress_type: preferences.mattressType,
                view_type: preferences.viewType,
                floor_level: preferences.floorLevel,
                has_balcony: preferences.hasBalcony,
                is_accessible: preferences.isAccessible,
                has_kitchenette: preferences.hasKitchenette,
                is_soundproof: preferences.isSoundproof,
                has_air_purifier: preferences.hasAirPurifier,
                is_smoking_allowed: preferences.isSmokingAllowed,
                room_size_sqft: preferences.roomSizeSqft,
                max_occupancy: preferences.maxOccupancy
            })
            .eq('id', roomId)
            .select();

        if (error) throw error;
        return data[0];
    }

    static async getRoomAmenities(roomId) {
        const { data, error } = await supabase
            .from('room_amenities')
            .select('amenity_name')
            .eq('room_id', roomId);

        if (error) throw error;
        return data.map(item => item.amenity_name);
    }

    static async updateRoomAmenities(roomId, amenities) {
        // First, delete existing amenities
        const { error: deleteError } = await supabase
            .from('room_amenities')
            .delete()
            .eq('room_id', roomId);

        if (deleteError) throw deleteError;

        // Then insert new ones if there are any
        if (amenities && amenities.length > 0) {
            const amenitiesToInsert = amenities.map(amenity => ({
                room_id: roomId,
                amenity_name: amenity
            }));

            const { error: insertError } = await supabase
                .from('room_amenities')
                .insert(amenitiesToInsert);

            if (insertError) throw insertError;
        }

        return this.getRoomAmenities(roomId);
    }
}

module.exports = Room;
