const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

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
    body('guest_name').notEmpty().withMessage('Guest name is required'),
    body('phone_number').matches(/^[+]?[0-9]{10,15}$/).withMessage('Valid phone number is required'),
    body('aadhar_number').matches(/^[0-9]{12}$/).withMessage('Valid 12-digit Aadhar number is required'),
    body('room_id').isInt().withMessage('Room ID must be a number'),
    body('check_in').isISO8601().withMessage('Check-in date is required'),
    body('check_out').isISO8601().withMessage('Check-out date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Calculate total amount
        const { data: roomData } = await supabase
            .from('rooms')
            .select('rate_per_night')
            .eq('id', req.body.room_id)
            .single();

        const checkIn = new Date(req.body.check_in);
        const checkOut = new Date(req.body.check_out);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalAmount = nights * roomData.rate_per_night;

        const bookingData = {
            ...req.body,
            total_amount: totalAmount
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
    body('phone_number').optional().matches(/^[+]?[0-9]{10,15}$/),
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

module.exports = router;
