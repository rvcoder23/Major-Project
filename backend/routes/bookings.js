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
    body('aadhar_number').matches(/^[0-9]{12}$/).withMessage('Valid 12-digit Aadhar number is required'),
    body('room_id').isInt().withMessage('Room ID must be a number'),
    body('check_in').isISO8601().withMessage('Check-in date is required'),
    body('check_out').isISO8601().withMessage('Check-out date is required'),
    body('registration_card_printout').optional().isBoolean(),
    body('vip_category').optional().isIn(['VIP', 'CIP', 'VVIP']),
    body('booking_notes').optional().isString(),
    body('payment_method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer'])
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

        // Calculate total amount
        const { data: roomData } = await supabase
            .from('rooms')
            .select('rate_per_night')
            .eq('id', req.body.room_id)
            .single();

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const baseAmount = nights * roomData.rate_per_night;

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
            registration_card_printout: req.body.registration_card_printout ?? false,
            vip_category: req.body.vip_category || null,
            booking_notes: req.body.booking_notes || null
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
        )
      `)
            .single();

        if (error) throw error;

        // Update room status to Occupied
        await supabase
            .from('rooms')
            .update({ status: 'Occupied' })
            .eq('id', req.body.room_id);

        await logAction(`Booking created for ${req.body.guest_name}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating booking:', error);
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
            .select('room_id')
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
