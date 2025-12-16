const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .order('room_number');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get room by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new room
router.post('/', [
    body('room_number').notEmpty().withMessage('Room number is required'),
    body('room_type').notEmpty().withMessage('Room type is required'),
    body('rate_per_night').isNumeric().withMessage('Rate must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('rooms')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        await logAction(`Room created: ${req.body.room_number}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update room
router.put('/:id', [
    body('room_number').optional().notEmpty(),
    body('room_type').optional().notEmpty(),
    body('rate_per_night').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('rooms')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Room updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete room
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Room deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get available rooms
router.get('/available/rooms', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('status', 'Available')
            .order('room_number');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update room status
router.patch('/:id/status', [
    body('status').isIn(['Available', 'Occupied', 'Maintenance', 'Cleaning']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Enforce room status rules
        if (req.body.status === 'Available') {
            // Block making room available if cleaning/inspection is pending
            const { data: pendingTasks, error: housekeepingErr } = await supabase
                .from('housekeeping')
                .select('id, status, inspection_status')
                .eq('room_id', req.params.id)
                .in('status', ['Pending', 'In Progress']);

            if (housekeepingErr) throw housekeepingErr;

            const hasPendingCleaning = pendingTasks?.length > 0 || pendingTasks?.some(t => t.inspection_status !== 'Approved');
            if (hasPendingCleaning) {
                return res.status(409).json({
                    success: false,
                    error: 'Room has pending cleaning/inspection. Complete housekeeping before marking Available.'
                });
            }
        }

        if (req.body.status === 'Occupied') {
            // Prevent occupying rooms that are under maintenance or cleaning
            const { data: roomCurrent } = await supabase
                .from('rooms')
                .select('status')
                .eq('id', req.params.id)
                .single();

            if (roomCurrent?.status === 'Maintenance' || roomCurrent?.status === 'Cleaning') {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot occupy a room that is under maintenance or cleaning.'
                });
            }
        }

        const { data, error } = await supabase
            .from('rooms')
            .update({ status: req.body.status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Room status updated: ${req.params.id} to ${req.body.status}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating room status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
