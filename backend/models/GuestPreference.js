class GuestPreference {
    static async findByBookingId(bookingId) {
        const { data, error } = await supabase
            .from('guest_preferences')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows returned
        return data || null;
    }

    static async createOrUpdate(bookingId, preferences) {
        const existingPref = await this.findByBookingId(bookingId);
        
        const preferenceData = {
            booking_id: bookingId,
            bed_type_preference: preferences.bedType,
            mattress_firmness: preferences.mattressFirmness,
            pillow_type: preferences.pillowType,
            view_preference: preferences.viewPreference,
            floor_preference: preferences.floorPreference,
            accessibility_needs: preferences.accessibilityNeeds,
            temperature_preference: preferences.temperaturePreference,
            special_requests: preferences.specialRequests
        };

        if (existingPref) {
            const { data, error } = await supabase
                .from('guest_preferences')
                .update(preferenceData)
                .eq('id', existingPref.id)
                .select();
            
            if (error) throw error;
            return data[0];
        } else {
            const { data, error } = await supabase
                .from('guest_preferences')
                .insert([preferenceData])
                .select();
            
            if (error) throw error;
            return data[0];
        }
    }

    static async getPreferencesForBooking(bookingId) {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                guest_preferences(*)
            `)
            .eq('id', bookingId)
            .single();

        if (error) throw error;
        return data;
    }

    static async getRecommendedRooms(preferences) {
        const roomFilters = {};
        
        // Map guest preferences to room filters
        if (preferences.bedType) roomFilters.bedType = preferences.bedType;
        if (preferences.viewPreference) roomFilters.viewType = preferences.viewPreference;
        if (preferences.floorPreference) roomFilters.floorLevel = preferences.floorPreference;
        
        // Handle accessibility needs
        if (preferences.accessibilityNeeds && preferences.accessibilityNeeds.length > 0) {
            roomFilters.isAccessible = true;
        }

        // Handle smoking preference
        if (preferences.smokingPreference !== undefined) {
            roomFilters.isSmokingAllowed = preferences.smokingPreference === 'smoking';
        }

        // Get available rooms matching the filters
        const availableRooms = await Room.findAvailableRooms(
            preferences.checkInDate,
            preferences.checkOutDate,
            roomFilters
        );

        // Score and sort rooms based on preference matching
        const scoredRooms = availableRooms.map(room => ({
            ...room,
            score: this.calculateRoomScore(room, preferences)
        })).sort((a, b) => b.score - a.score);

        return scoredRooms;
    }

    static calculateRoomScore(room, preferences) {
        let score = 0;
        
        // Bed type match (high priority)
        if (preferences.bedType && room.bed_type === preferences.bedType) {
            score += 5;
        }
        
        // View preference match (high priority)
        if (preferences.viewPreference && room.view_type === preferences.viewPreference) {
            score += 5;
        }
        
        // Floor preference match
        if (preferences.floorPreference && room.floor_level === preferences.floorPreference) {
            score += 3;
        }
        
        // Accessibility needs
        if (preferences.accessibilityNeeds && preferences.accessibilityNeeds.length > 0 && room.is_accessible) {
            score += 4;
        }
        
        // Smoking preference
        if (preferences.smokingPreference === 'smoking' && room.is_smoking_allowed) {
            score += 3;
        } else if (preferences.smokingPreference === 'non-smoking' && !room.is_smoking_allowed) {
            score += 3;
        }
        
        // Additional preferences (lower priority)
        if (preferences.hasBalcony && room.has_balcony) score += 2;
        if (preferences.requiresSoundproof && room.is_soundproof) score += 2;
        if (preferences.requiresAirPurifier && room.has_air_purifier) score += 2;
        
        return score;
    }
}

module.exports = GuestPreference;
