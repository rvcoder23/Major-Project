const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');

// Get all staff
router.get('/', async (req, res) => {
    try {
        const { shift, role, active } = req.query;

        let query = supabase
            .from('staff')
            .select(`
                *,
                shifts (
                    shift_name,
                    start_time,
                    end_time
                )
            `)
            .order('name');

        if (shift) {
            query = query.eq('assigned_shift', shift);
        }
        if (role) {
            query = query.eq('role', role);
        }
        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff')
            .select(`
                *,
                shifts (
                    shift_name,
                    start_time,
                    end_time
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ success: false, error: 'Staff not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new staff
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('assigned_shift').optional().isIn(['M', 'A', 'E']).withMessage('Invalid shift code'),
    body('phone_number').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('email').optional().isEmail().withMessage('Invalid email format')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('staff')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data, message: 'Staff created successfully' });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update staff
router.put('/:id', [
    body('name').optional().notEmpty(),
    body('role').optional().notEmpty(),
    body('assigned_shift').optional().isIn(['M', 'A', 'E']),
    body('phone_number').optional().matches(/^[0-9]{10}$/),
    body('email').optional().isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('staff')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data, message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete staff (soft delete by setting is_active to false)
router.delete('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff')
            .update({ is_active: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data, message: 'Staff deactivated successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get staff by shift
router.get('/shift/:shiftCode', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('assigned_shift', req.params.shiftCode)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching staff by shift:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current shift
router.get('/current/shift', async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_current_shift');

        if (error) throw error;

        res.json({ success: true, shift_code: data });
    } catch (error) {
        console.error('Error getting current shift:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
