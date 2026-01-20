const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Helper to calculate GST rate based on base amount (total before tax)
// GST Rates:
// 12% for 0-5499 rupees
// 18% for 5500-7499 rupees
// 28% for 7500 rupees and above
const getGstRateForAmount = (baseAmount) => {
    if (baseAmount == null || baseAmount === 0) return 0;
    const amount = Number(baseAmount) || 0;

    if (amount >= 0 && amount <= 5499) return 0.12;      // 12%
    if (amount >= 5500 && amount <= 7499) return 0.18;   // 18%
    if (amount >= 7500) return 0.28;                     // 28% for 7500 and above
    return 0.12;                                         // Default to 12%
};

// Get all bookings
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_type,
          rate_per_night
        ),
        meal_plan_config (
          plan_name,
          description,
          cost_per_person_per_day
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_type,
          rate_per_night
        ),
        meal_plan_config (
          plan_name,
          description,
          cost_per_person_per_day
        )
      `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new booking
router.post('/', [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('phone_number').matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),
    body('email').optional().isEmail().withMessage('Valid email address is required'),
    body('aadhar_number').matches(/^[0-9]{12}$/).withMessage('Valid 12-digit Aadhar number is required'),
    body('room_id').isInt().withMessage('Room ID must be a number'),
    body('check_in').isISO8601().withMessage('Check-in date is required'),
    body('check_out').isISO8601().withMessage('Check-out date is required'),
    body('registration_card_printout').optional().isBoolean(),
    body('vip_category').optional().isIn(['VIP', 'CIP', 'VVIP']),
    body('booking_notes').optional().isString(),
    body('payment_method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer']),
    body('meal_plan').optional().isIn(['EP', 'CP', 'MAP', 'AP']).withMessage('Invalid meal plan'),
    body('number_of_guests').optional().isInt({ min: 1 }).withMessage('Number of guests must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Normalize dates to YYYY-MM-DD (date-only) strings
        const checkInStr = new Date(req.body.check_in).toISOString().split('T')[0];
        const checkOutStr = new Date(req.body.check_out).toISOString().split('T')[0];

        if (checkOutStr <= checkInStr) {
            return res.status(400).json({ success: false, error: 'Check-out must be after check-in' });
        }

        // Prevent overlapping booking for the same room
        const { data: overlappingRoomBookings, error: overlapErr } = await supabase
            .from('bookings')
            .select('id, guest_name, check_in, check_out, booking_status')
            .eq('room_id', req.body.room_id)
            .neq('booking_status', 'Cancelled')
            .lt('check_in', checkOutStr)
            .gt('check_out', checkInStr);

        if (overlapErr) throw overlapErr;
        if (overlappingRoomBookings && overlappingRoomBookings.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Room is already booked for the selected dates'
            });
        }

        // Prevent duplicate active booking for same guest by phone/Aadhaar overlapping in time
        const { data: overlappingGuestBookings, error: guestOverlapErr } = await supabase
            .from('bookings')
            .select('id')
            .neq('booking_status', 'Cancelled')
            .or(`phone_number.eq.${req.body.phone_number},aadhar_number.eq.${req.body.aadhar_number}`)
            .lt('check_in', checkOutStr)
            .gt('check_out', checkInStr);

        if (guestOverlapErr) throw guestOverlapErr;
        if (overlappingGuestBookings && overlappingGuestBookings.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Guest already has an active booking during the selected dates'
            });
        }

        // Occupancy threshold protection
        const occupancyThreshold = Number(process.env.BOOKING_OCCUPANCY_THRESHOLD || 0.95);
        const { data: roomStatusData, error: roomStatusErr } = await supabase
            .from('rooms')
            .select('status');

        if (roomStatusErr) throw roomStatusErr;

        const totalRooms = roomStatusData?.length || 0;
        const occupiedRooms = roomStatusData?.filter(r => r.status === 'Occupied' || r.status === 'Cleaning').length || 0;
        const projectedOccupancy = totalRooms === 0 ? 0 : (occupiedRooms + 1) / totalRooms; // include this booking

        if (totalRooms > 0 && projectedOccupancy > occupancyThreshold) {
            return res.status(409).json({
                success: false,
                error: 'Hotel occupancy threshold reached. Cannot create new booking right now.'
            });
        }

        // Calculate total amount
        const { data: roomData } = await supabase
            .from('rooms')
            .select('rate_per_night')
            .eq('id', req.body.room_id)
            .single();

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomBaseAmount = nights * roomData.rate_per_night;

        // Meal plan calculation
        const mealPlan = req.body.meal_plan || 'EP';
        const numberOfGuests = req.body.number_of_guests || 1;
        let mealPlanCost = 0;

        if (mealPlan !== 'EP') {
            // Fetch meal plan pricing
            const { data: mealPlanConfig } = await supabase
                .from('meal_plan_config')
                .select('cost_per_person_per_day')
                .eq('plan_type', mealPlan)
                .single();

            if (mealPlanConfig) {
                mealPlanCost = mealPlanConfig.cost_per_person_per_day * numberOfGuests * nights;
                mealPlanCost = Math.round(mealPlanCost * 100) / 100;
            }
        }

        // Base amount includes room + meal plan (before GST)
        const baseAmount = roomBaseAmount + mealPlanCost;

        // GST calculation based on base amount (total before tax)
        // 12% for 0-5499, 18% for 5500-7499, 28% for 7500+
        const gstRateDecimal = getGstRateForAmount(baseAmount); // 0.12, 0.18, 0.28 etc.
        const gstAmount = Math.round(baseAmount * gstRateDecimal * 100) / 100; // Round to 2 decimal places
        const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

        const bookingData = {
            ...req.body,
            guest_name: `${req.body.first_name} ${req.body.last_name}`.trim(),
            check_in: checkInStr,
            check_out: checkOutStr,
            base_amount: baseAmount,
            total_amount: totalAmount,
            gst_rate: gstRateDecimal * 100, // store as percentage (e.g. 12, 18, 28)
            gst_amount: gstAmount,
            payment_method: req.body.payment_method || 'Cash',
            booking_status: 'Reserved', // New reservations start as 'Reserved'
            registration_card_printout: req.body.registration_card_printout ?? false,
            vip_category: req.body.vip_category || null,
            booking_notes: req.body.booking_notes || null,
            meal_plan: mealPlan,
            number_of_guests: numberOfGuests,
            meal_plan_cost: mealPlanCost
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select(`
        *,
        rooms (
          room_number,
          room_type,
          rate_per_night
        ),
        meal_plan_config (
          plan_name,
          description
        )
      `)
            .single();

        if (error) throw error;

        // Update room status to Reserved (not Occupied until check-in)
        await supabase
            .from('rooms')
            .update({ status: 'Reserved' })
            .eq('id', req.body.room_id);

        // Note: Meal entitlements will be generated on actual check-in, not reservation
        // This prevents generating entitlements for cancelled or no-show reservations

        await logAction(`Reservation created for ${bookingData.guest_name} with ${mealPlan} meal plan`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check-in guest (when they actually arrive)
router.post('/:id/checkin', async (req, res) => {
    try {
        // Get booking details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.booking_status !== 'Reserved') {
            return res.status(400).json({
                success: false,
                error: `Cannot check-in. Booking status is ${booking.booking_status}`
            });
        }

        const now = new Date();
        const actualCheckinDate = now.toISOString().split('T')[0];
        const actualCheckinTime = now.toTimeString().split(' ')[0];

        // Update booking to Checked-In
        const { data, error } = await supabase
            .from('bookings')
            .update({
                booking_status: 'Checked-In',
                actual_checkin_date: actualCheckinDate,
                actual_checkin_time: actualCheckinTime
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Update room status to Occupied
        await supabase
            .from('rooms')
            .update({ status: 'Occupied' })
            .eq('id', booking.room_id);

        // Generate meal entitlements if meal plan is not EP
        if (booking.meal_plan && booking.meal_plan !== 'EP') {
            try {
                await supabase.rpc('generate_meal_entitlements', {
                    p_booking_id: booking.id,
                    p_check_in: booking.check_in,
                    p_check_out: booking.check_out,
                    p_number_of_guests: booking.number_of_guests || 1
                });
            } catch (entitlementError) {
                console.error('Error generating meal entitlements:', entitlementError);
                // Don't fail check-in if entitlement generation fails
            }
        }

        await logAction(`Guest checked-in: ${booking.guest_name} - Room ${booking.rooms?.room_number}`, 'admin', supabase);
        res.json({ success: true, data, message: 'Guest checked-in successfully' });
    } catch (error) {
        console.error('Error checking in guest:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel reservation
router.post('/:id/cancel', async (req, res) => {
    try {
        // Get booking details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.booking_status !== 'Reserved') {
            return res.status(400).json({
                success: false,
                error: `Cannot cancel. Booking status is ${booking.booking_status}`
            });
        }

        // Update booking to Cancelled
        const { data, error } = await supabase
            .from('bookings')
            .update({ booking_status: 'Cancelled' })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Update room status back to Available
        await supabase
            .from('rooms')
            .update({ status: 'Available' })
            .eq('id', booking.room_id);

        await logAction(`Reservation cancelled: ${booking.guest_name} - Room ${booking.rooms?.room_number}`, 'admin', supabase);
        res.json({ success: true, data, message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark as No-Show
router.post('/:id/no-show', async (req, res) => {
    try {
        // Get booking details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.booking_status !== 'Reserved') {
            return res.status(400).json({
                success: false,
                error: `Cannot mark as no-show. Booking status is ${booking.booking_status}`
            });
        }

        // Update booking to No-Show
        const { data, error } = await supabase
            .from('bookings')
            .update({ booking_status: 'No-Show' })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Update room status back to Available
        await supabase
            .from('rooms')
            .update({ status: 'Available' })
            .eq('id', booking.room_id);

        await logAction(`Marked as no-show: ${booking.guest_name} - Room ${booking.rooms?.room_number}`, 'admin', supabase);
        res.json({ success: true, data, message: 'Booking marked as no-show' });
    } catch (error) {
        console.error('Error marking as no-show:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update booking
router.put('/:id', [
    body('guest_name').optional().notEmpty(),
    body('phone_number').optional().matches(/^[0-9]{10}$/),
    body('aadhar_number').optional().matches(/^[0-9]{12}$/),
    body('room_id').optional().isInt(),
    body('check_in').optional().isISO8601(),
    body('check_out').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('bookings')
            .update(req.body)
            .eq('id', req.params.id)
            .select(`
        *,
        rooms (
          room_number,
          room_type,
          rate_per_night
        )
      `)
            .single();

        if (error) throw error;

        await logAction(`Booking updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel booking
router.patch('/:id/cancel', async (req, res) => {
    try {
        // Get booking details
        const { data: booking } = await supabase
            .from('bookings')
            .select('room_id')
            .eq('id', req.params.id)
            .single();

        // Update booking status
        const { data, error } = await supabase
            .from('bookings')
            .update({ booking_status: 'Cancelled' })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Update room status to Available
        await supabase
            .from('rooms')
            .update({ status: 'Available' })
            .eq('id', booking.room_id);

        await logAction(`Booking cancelled: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check-out booking
router.patch('/:id/checkout', async (req, res) => {
    try {
        // Get booking details
        const { data: booking } = await supabase
            .from('bookings')
            .select('room_id, check_out')
            .eq('id', req.params.id)
            .single();

        // Update booking status
        const { data, error } = await supabase
            .from('bookings')
            .update({
                booking_status: 'Completed',
                payment_status: 'Paid'
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Update room status to Cleaning
        await supabase
            .from('rooms')
            .update({ status: 'Cleaning' })
            .eq('id', booking.room_id);

        // Auto-create housekeeping task after checkout to reduce manual work
        const today = new Date().toISOString().split('T')[0];

        // Find the next booking for this room to set task priority
        const { data: nextBooking } = await supabase
            .from('bookings')
            .select('check_in')
            .eq('room_id', booking.room_id)
            .neq('booking_status', 'Cancelled')
            .gt('check_in', today)
            .order('check_in', { ascending: true })
            .limit(1)
            .single();

        let priority = 'Medium';
        if (nextBooking?.check_in) {
            const nextDate = new Date(nextBooking.check_in);
            const checkoutDate = new Date(booking.check_out);
            const diffHours = (nextDate - checkoutDate) / (1000 * 60 * 60);
            if (diffHours <= 4) priority = 'Urgent';
            else if (diffHours <= 24) priority = 'High';
        }

        await supabase
            .from('housekeeping')
            .insert([{
                room_id: booking.room_id,
                task_type: 'Regular Cleaning',
                priority,
                status: 'Pending',
                cleaning_date: today,
                inspection_status: 'Pending',
                special_instructions: 'Auto-created after checkout'
            }]);

        await logAction(`Booking checked out: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error checking out booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get today's check-ins
router.get('/today/checkins', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .eq('check_in', today)
            .eq('booking_status', 'Active');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching today\'s check-ins:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get today's check-outs
router.get('/today/checkouts', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .eq('check_out', today)
            .eq('booking_status', 'Active');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching today\'s check-outs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get available payment methods
router.get('/payment-methods', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('method_name')
            .eq('is_active', true)
            .order('method_name');

        if (error) {
            // If table doesn't exist, return default methods
            const defaultMethods = [
                'Cash',
                'Credit Card',
                'Debit Card',
                'UPI',
                'Net Banking',
                'Cheque',
                'Bank Transfer'
            ];
            return res.json({ success: true, data: defaultMethods.map(name => ({ method_name: name })) });
        }

        res.json({ success: true, data: data.map(item => item.method_name) });
    } catch (error) {
        // Return default methods if error
        const defaultMethods = [
            'Cash',
            'Credit Card',
            'Debit Card',
            'UPI',
            'Net Banking',
            'Cheque',
            'Bank Transfer'
        ];
        res.json({ success: true, data: defaultMethods });
    }
});

module.exports = router;
