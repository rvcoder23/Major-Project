const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all housekeeping tasks
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .order('cleaning_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching housekeeping tasks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create housekeeping task
router.post('/', [
    body('room_id').isInt().withMessage('Room ID is required'),
    body('staff_name').notEmpty().withMessage('Staff name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .insert([req.body])
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .single();

        if (error) throw error;

        await logAction(`Housekeeping task created for room ${req.body.room_id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating housekeeping task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update housekeeping status
router.patch('/:id/status', [
    body('status').isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .update({ status: req.body.status })
            .eq('id', req.params.id)
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .single();

        if (error) throw error;

        // If completed, update room status to Available
        if (req.body.status === 'Completed') {
            await supabase
                .from('rooms')
                .update({ status: 'Available' })
                .eq('id', data.room_id);
        }

        await logAction(`Housekeeping status updated: ${req.params.id} to ${req.body.status}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating housekeeping status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get pending cleaning tasks
router.get('/pending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .eq('status', 'Pending')
            .order('cleaning_date');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching pending cleaning tasks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get today's cleaning report
router.get('/today/report', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('housekeeping')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .eq('cleaning_date', today);

        if (error) throw error;

        // Calculate summary
        const summary = {
            total: data.length,
            completed: data.filter(task => task.status === 'Completed').length,
            pending: data.filter(task => task.status === 'Pending').length,
            in_progress: data.filter(task => task.status === 'In Progress').length
        };

        res.json({ success: true, data, summary });
    } catch (error) {
        console.error('Error fetching today\'s cleaning report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
