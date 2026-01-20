const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');

// Get all handovers
router.get('/', async (req, res) => {
    try {
        const { date, shift, status } = req.query;

        let query = supabase
            .from('shift_handovers')
            .select(`
                *,
                outgoing_staff:outgoing_staff_id (name, employee_id),
                incoming_staff:incoming_staff_id (name, employee_id),
                acknowledged_staff:acknowledged_by (name, employee_id),
                outgoing_shift_info:outgoing_shift (shift_name),
                incoming_shift_info:incoming_shift (shift_name)
            `)
            .order('handover_date', { ascending: false })
            .order('handover_time', { ascending: false });

        if (date) {
            query = query.eq('handover_date', date);
        }
        if (shift) {
            query = query.eq('outgoing_shift', shift);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching handovers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current shift handover (pending for incoming shift)
router.get('/current', async (req, res) => {
    try {
        // Get current shift
        const { data: currentShift } = await supabase.rpc('get_current_shift');

        // Get pending handover for current shift
        const { data, error } = await supabase
            .from('shift_handovers')
            .select(`
                *,
                outgoing_staff:outgoing_staff_id (name, employee_id, role),
                incoming_staff:incoming_staff_id (name, employee_id, role),
                outgoing_shift_info:outgoing_shift (shift_name),
                incoming_shift_info:incoming_shift (shift_name)
            `)
            .eq('incoming_shift', currentShift)
            .eq('handover_date', new Date().toISOString().split('T')[0])
            .eq('status', 'Pending')
            .order('handover_time', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        res.json({ success: true, data: data || null, current_shift: currentShift });
    } catch (error) {
        console.error('Error fetching current handover:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate handover report
router.post('/generate', [
    body('outgoing_staff_id').isInt().withMessage('Outgoing staff ID is required'),
    body('pending_issues').optional().isString(),
    body('special_notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Get current shift
        const { data: currentShift } = await supabase.rpc('get_current_shift');

        // Get next shift
        const { data: nextShift } = await supabase.rpc('get_next_shift', { current_shift: currentShift });

        const today = new Date().toISOString().split('T')[0];

        // Collect booking statistics for current shift
        const { data: bookingStats } = await supabase
            .from('bookings')
            .select('booking_status, created_at, actual_checkin_date, actual_checkout_date')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        // Calculate shift-specific stats
        const shiftStart = getShiftStartTime(currentShift);
        const shiftEnd = getShiftEndTime(currentShift);

        const reservations = bookingStats?.filter(b =>
            b.booking_status === 'Reserved' &&
            isInShiftTime(b.created_at, shiftStart, shiftEnd)
        ).length || 0;

        const checkins = bookingStats?.filter(b =>
            b.actual_checkin_date === today &&
            isInShiftTime(b.created_at, shiftStart, shiftEnd)
        ).length || 0;

        const checkouts = bookingStats?.filter(b =>
            b.actual_checkout_date === today &&
            isInShiftTime(b.created_at, shiftStart, shiftEnd)
        ).length || 0;

        const cancellations = bookingStats?.filter(b =>
            b.booking_status === 'Cancelled' &&
            isInShiftTime(b.created_at, shiftStart, shiftEnd)
        ).length || 0;

        const noshows = bookingStats?.filter(b =>
            b.booking_status === 'No-Show' &&
            isInShiftTime(b.created_at, shiftStart, shiftEnd)
        ).length || 0;

        // Get room status counts
        const { data: rooms } = await supabase
            .from('rooms')
            .select('status');

        const occupied = rooms?.filter(r => r.status === 'Occupied').length || 0;
        const reserved = rooms?.filter(r => r.status === 'Reserved').length || 0;
        const available = rooms?.filter(r => r.status === 'Available').length || 0;
        const cleaning = rooms?.filter(r => r.status === 'Cleaning').length || 0;
        const maintenance = rooms?.filter(r => r.status === 'Maintenance').length || 0;

        // Get food order statistics
        const { data: foodOrders } = await supabase
            .from('food_orders')
            .select('status, total_amount, created_at')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        const pendingOrders = foodOrders?.filter(o =>
            ['Pending', 'Preparing'].includes(o.status)
        ).length || 0;

        const completedOrders = foodOrders?.filter(o =>
            o.status === 'Served' &&
            isInShiftTime(o.created_at, shiftStart, shiftEnd)
        ).length || 0;

        // Get payment statistics
        const { data: bills } = await supabase
            .from('bills')
            .select('total_amount, payment_method, payment_status, created_at')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        const shiftBills = bills?.filter(b => isInShiftTime(b.created_at, shiftStart, shiftEnd)) || [];

        const totalRevenue = shiftBills.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        const cashPayments = shiftBills.filter(b => b.payment_method === 'Cash').reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        const cardPayments = shiftBills.filter(b => ['Credit Card', 'Debit Card'].includes(b.payment_method)).reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        const upiPayments = shiftBills.filter(b => b.payment_method === 'UPI').reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        const pendingPayments = bills?.filter(b => b.payment_status === 'Pending').length || 0;

        // Get VIP guests
        const { data: vipGuests } = await supabase
            .from('bookings')
            .select('guest_name, vip_category, rooms(room_number)')
            .in('booking_status', ['Reserved', 'Checked-In'])
            .not('vip_category', 'is', null);

        const vipGuestsList = vipGuests?.map(g =>
            `${g.guest_name} (${g.vip_category}) - Room ${g.rooms?.room_number}`
        ).join('\n') || '';

        // Create handover record
        const handoverData = {
            handover_date: today,
            outgoing_shift: currentShift,
            incoming_shift: nextShift,
            outgoing_staff_id: req.body.outgoing_staff_id,

            total_reservations: reservations,
            total_checkins: checkins,
            total_checkouts: checkouts,
            total_cancellations: cancellations,
            total_noshows: noshows,

            occupied_rooms: occupied,
            reserved_rooms: reserved,
            available_rooms: available,
            cleaning_rooms: cleaning,
            maintenance_rooms: maintenance,

            pending_food_orders: pendingOrders,
            completed_food_orders: completedOrders,

            total_revenue: totalRevenue,
            cash_payments: cashPayments,
            card_payments: cardPayments,
            upi_payments: upiPayments,
            pending_payments: pendingPayments,

            pending_issues: req.body.pending_issues || '',
            special_notes: req.body.special_notes || '',
            vip_guests: vipGuestsList,

            status: 'Pending'
        };

        const { data, error } = await supabase
            .from('shift_handovers')
            .insert([handoverData])
            .select(`
                *,
                outgoing_staff:outgoing_staff_id (name, employee_id),
                outgoing_shift_info:outgoing_shift (shift_name),
                incoming_shift_info:incoming_shift (shift_name)
            `)
            .single();

        if (error) throw error;

        res.json({ success: true, data, message: 'Handover report generated successfully' });
    } catch (error) {
        console.error('Error generating handover:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Acknowledge handover
router.post('/:id/acknowledge', [
    body('incoming_staff_id').isInt().withMessage('Incoming staff ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('shift_handovers')
            .update({
                status: 'Acknowledged',
                acknowledged_time: new Date().toISOString(),
                acknowledged_by: req.body.incoming_staff_id,
                incoming_staff_id: req.body.incoming_staff_id
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data, message: 'Handover acknowledged successfully' });
    } catch (error) {
        console.error('Error acknowledging handover:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get handovers for specific date
router.get('/date/:date', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('shift_handovers')
            .select(`
                *,
                outgoing_staff:outgoing_staff_id (name, employee_id),
                incoming_staff:incoming_staff_id (name, employee_id),
                outgoing_shift_info:outgoing_shift (shift_name),
                incoming_shift_info:incoming_shift (shift_name)
            `)
            .eq('handover_date', req.params.date)
            .order('handover_time');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching handovers by date:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper functions
function getShiftStartTime(shiftCode) {
    const times = {
        'M': '06:00:00',
        'A': '14:00:00',
        'E': '22:00:00'
    };
    return times[shiftCode] || '00:00:00';
}

function getShiftEndTime(shiftCode) {
    const times = {
        'M': '14:00:00',
        'A': '22:00:00',
        'E': '06:00:00'
    };
    return times[shiftCode] || '23:59:59';
}

function isInShiftTime(timestamp, shiftStart, shiftEnd) {
    if (!timestamp) return false;

    const time = new Date(timestamp).toTimeString().split(' ')[0];

    // Handle overnight shift (Evening: 22:00 - 06:00)
    if (shiftEnd < shiftStart) {
        return time >= shiftStart || time < shiftEnd;
    }

    return time >= shiftStart && time < shiftEnd;
}

module.exports = router;
