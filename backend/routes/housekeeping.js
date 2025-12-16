const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all housekeeping tasks with filters
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('housekeeping')
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `);

        // Apply filters
        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }
        if (req.query.priority) {
            query = query.eq('priority', req.query.priority);
        }
        if (req.query.task_type) {
            query = query.eq('task_type', req.query.task_type);
        }
        if (req.query.staff_id) {
            query = query.eq('assigned_staff_id', req.query.staff_id);
        }
        if (req.query.date) {
            query = query.eq('cleaning_date', req.query.date);
        }

        // Sort by priority and date
        query = query.order('priority', { ascending: false })
            .order('cleaning_date', { ascending: true })
            .order('due_time', { ascending: true, nullsFirst: false });

        const { data, error } = await query;

        if (error) throw error;

        // Fetch staff information for tasks that have assigned staff
        const staffIds = [...new Set(data.filter(t => t.assigned_staff_id).map(t => t.assigned_staff_id))];
        let staffMap = {};

        if (staffIds.length > 0) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('id, staff_name, employee_id, designation, specialization')
                .in('id', staffIds);

            if (staffData) {
                staffMap = staffData.reduce((acc, staff) => {
                    acc[staff.id] = staff;
                    return acc;
                }, {});
            }
        }

        // Merge staff information into tasks
        const enrichedData = data.map(task => ({
            ...task,
            staff: task.assigned_staff_id ? staffMap[task.assigned_staff_id] || null : null
        }));

        res.json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching housekeeping tasks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get housekeeping task by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping')
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        // Fetch staff information if assigned
        if (data.assigned_staff_id) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('id, staff_name, employee_id, phone_number, designation, specialization')
                .eq('id', data.assigned_staff_id)
                .single();

            data.staff = staffData || null;
        } else {
            data.staff = null;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching housekeeping task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create housekeeping task
router.post('/', [
    body('room_id').isInt().withMessage('Room ID is required'),
    body('task_type').optional().isIn(['Regular Cleaning', 'Deep Cleaning', 'VIP Service', 'Maintenance']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Get checklist template for task type
        const taskType = req.body.task_type || 'Regular Cleaning';
        const { data: template } = await supabase
            .from('housekeeping_checklist_template')
            .select('checklist_items')
            .eq('task_type', taskType)
            .single();

        const checklist = template?.checklist_items || [];

        // Prepare task data
        const taskData = {
            room_id: req.body.room_id,
            task_type: taskType,
            priority: req.body.priority || 'Medium',
            status: 'Pending',
            cleaning_date: req.body.cleaning_date || new Date().toISOString().split('T')[0],
            due_time: req.body.due_time || null,
            estimated_duration: req.body.estimated_duration || 30,
            assigned_staff_id: req.body.assigned_staff_id || null,
            special_instructions: req.body.special_instructions || null,
            checklist: checklist,
            notes: req.body.notes || null,
            inspection_status: 'Pending',
            created_by: req.body.created_by || 'admin'
        };

        if (req.body.assigned_staff_id) {
            taskData.assigned_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .insert([taskData])
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .single();

        if (error) throw error;

        // Fetch staff information if assigned
        if (data.assigned_staff_id) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('staff_name, employee_id, designation')
                .eq('id', data.assigned_staff_id)
                .single();

            data.staff = staffData || null;
        } else {
            data.staff = null;
        }

        // Update room status to Cleaning if not already
        if (data.rooms?.status !== 'Cleaning') {
            await supabase
                .from('rooms')
                .update({ status: 'Cleaning' })
                .eq('id', req.body.room_id);
        }

        await logAction(`Housekeeping task created for room ${data.rooms?.room_number}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating housekeeping task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update housekeeping task status
router.patch('/:id/status', [
    body('status').isIn(['Pending', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const updateData = { status: req.body.status };

        // Set timestamps based on status
        if (req.body.status === 'In Progress') {
            updateData.started_at = new Date().toISOString();
        } else if (req.body.status === 'Completed') {
            updateData.completed_at = new Date().toISOString();
            // Calculate actual duration if started_at exists
            const { data: task } = await supabase
                .from('housekeeping')
                .select('started_at')
                .eq('id', req.params.id)
                .single();

            if (task?.started_at) {
                const startTime = new Date(task.started_at);
                const endTime = new Date();
                updateData.actual_duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
            }
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .update(updateData)
            .eq('id', req.params.id)
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .single();

        if (error) throw error;

        // Fetch staff information if assigned
        if (data.assigned_staff_id) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('staff_name, employee_id, designation')
                .eq('id', data.assigned_staff_id)
                .single();

            data.staff = staffData || null;
        } else {
            data.staff = null;
        }

        // Update room status based on task status
        if (req.body.status === 'Completed' && data.inspection_status === 'Approved') {
            await supabase
                .from('rooms')
                .update({ status: 'Available' })
                .eq('id', data.room_id);
        } else if (req.body.status === 'Cancelled') {
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

// Update housekeeping task (general update)
router.put('/:id', async (req, res) => {
    try {
        const allowedFields = [
            'task_type', 'priority', 'assigned_staff_id', 'estimated_duration',
            'special_instructions', 'due_time', 'notes', 'checklist'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Set assigned_at if staff is assigned
        if (req.body.assigned_staff_id && !updateData.assigned_at) {
            updateData.assigned_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .update(updateData)
            .eq('id', req.params.id)
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .single();

        if (error) throw error;

        // Fetch staff information if assigned
        if (data.assigned_staff_id) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('staff_name, employee_id, designation')
                .eq('id', data.assigned_staff_id)
                .single();

            data.staff = staffData || null;
        } else {
            data.staff = null;
        }

        await logAction(`Housekeeping task updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating housekeeping task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update checklist
router.patch('/:id/checklist', [
    body('checklist').isArray().withMessage('Checklist must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('housekeeping')
            .update({ checklist: req.body.checklist })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating checklist:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update inspection status
router.patch('/:id/inspect', [
    body('inspection_status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid inspection status'),
    body('supervisor_notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const updateData = {
            inspection_status: req.body.inspection_status,
            inspected_by: req.body.inspected_by || 'admin',
            inspected_at: new Date().toISOString()
        };

        if (req.body.supervisor_notes) {
            updateData.supervisor_notes = req.body.supervisor_notes;
        }

        const { data: task, error: fetchError } = await supabase
            .from('housekeeping')
            .select('room_id, status')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        const { data, error } = await supabase
            .from('housekeeping')
            .update(updateData)
            .eq('id', req.params.id)
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .single();

        if (error) throw error;

        // Fetch staff information if assigned
        if (data.assigned_staff_id) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('staff_name, employee_id, designation')
                .eq('id', data.assigned_staff_id)
                .single();

            data.staff = staffData || null;
        } else {
            data.staff = null;
        }

        // If approved and completed, update room status
        if (req.body.inspection_status === 'Approved' && task.status === 'Completed') {
            await supabase
                .from('rooms')
                .update({ status: 'Available' })
                .eq('id', task.room_id);
        } else if (req.body.inspection_status === 'Rejected') {
            // If rejected, set status back to In Progress
            await supabase
                .from('housekeeping')
                .update({ status: 'In Progress' })
                .eq('id', req.params.id);
        }

        await logAction(`Housekeeping inspection ${req.body.inspection_status}: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating inspection:', error);
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
                    room_type,
                    status
                )
            `)
            .eq('status', 'Pending')
            .order('priority', { ascending: false })
            .order('cleaning_date', { ascending: true });

        if (error) throw error;

        // Fetch staff information
        const staffIds = [...new Set(data.filter(t => t.assigned_staff_id).map(t => t.assigned_staff_id))];
        let staffMap = {};

        if (staffIds.length > 0) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('id, staff_name, employee_id, designation')
                .in('id', staffIds);

            if (staffData) {
                staffMap = staffData.reduce((acc, staff) => {
                    acc[staff.id] = staff;
                    return acc;
                }, {});
            }
        }

        const enrichedData = data.map(task => ({
            ...task,
            staff: task.assigned_staff_id ? staffMap[task.assigned_staff_id] || null : null
        }));

        res.json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching pending cleaning tasks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get overdue tasks
router.get('/overdue', async (req, res) => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        const { data, error } = await supabase
            .from('housekeeping')
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    status
                )
            `)
            .in('status', ['Pending', 'In Progress'])
            .or(`cleaning_date.lt.${today},and(cleaning_date.eq.${today},due_time.lt.${currentTime})`);

        if (error) throw error;

        // Fetch staff information
        const staffIds = [...new Set(data.filter(t => t.assigned_staff_id).map(t => t.assigned_staff_id))];
        let staffMap = {};

        if (staffIds.length > 0) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('id, staff_name, employee_id, designation')
                .in('id', staffIds);

            if (staffData) {
                staffMap = staffData.reduce((acc, staff) => {
                    acc[staff.id] = staff;
                    return acc;
                }, {});
            }
        }

        const enrichedData = data.map(task => ({
            ...task,
            staff: task.assigned_staff_id ? staffMap[task.assigned_staff_id] || null : null
        }));

        res.json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching overdue tasks:', error);
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
                    room_type,
                    status
                )
            `)
            .eq('cleaning_date', today);

        if (error) throw error;

        // Fetch staff information
        const staffIds = [...new Set(data.filter(t => t.assigned_staff_id).map(t => t.assigned_staff_id))];
        let staffMap = {};

        if (staffIds.length > 0) {
            const { data: staffData } = await supabase
                .from('housekeeping_staff')
                .select('id, staff_name, employee_id, designation')
                .in('id', staffIds);

            if (staffData) {
                staffMap = staffData.reduce((acc, staff) => {
                    acc[staff.id] = staff;
                    return acc;
                }, {});
            }
        }

        const enrichedData = data.map(task => ({
            ...task,
            staff: task.assigned_staff_id ? staffMap[task.assigned_staff_id] || null : null
        }));

        // Calculate summary
        const summary = {
            total: enrichedData.length,
            completed: enrichedData.filter(task => task.status === 'Completed').length,
            pending: enrichedData.filter(task => task.status === 'Pending').length,
            in_progress: enrichedData.filter(task => task.status === 'In Progress').length,
            cancelled: enrichedData.filter(task => task.status === 'Cancelled').length,
            approved: enrichedData.filter(task => task.inspection_status === 'Approved').length,
            rejected: enrichedData.filter(task => task.inspection_status === 'Rejected').length
        };

        res.json({ success: true, data: enrichedData, summary });
    } catch (error) {
        console.error('Error fetching today\'s cleaning report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get housekeeping staff (all statuses)
router.get('/staff/list', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping_staff')
            .select('*')
            .order('staff_name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching housekeeping staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get active housekeeping staff only
router.get('/staff/active', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping_staff')
            .select('*')
            .eq('status', 'Active')
            .order('staff_name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching active housekeeping staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get staff by ID
router.get('/staff/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('housekeeping_staff')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new staff member
router.post('/staff', [
    body('staff_name').notEmpty().withMessage('Staff name is required'),
    body('employee_id').optional().isString(),
    body('designation').optional().isString(),
    body('status').optional().isIn(['Active', 'On Leave', 'Inactive']),
    body('shift').optional().isIn(['Day', 'Night', 'Flexible'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const staffData = {
            staff_name: req.body.staff_name,
            employee_id: req.body.employee_id || null,
            phone_number: req.body.phone_number || null,
            email: req.body.email || null,
            designation: req.body.designation || 'Housekeeping Staff',
            shift: req.body.shift || 'Day',
            status: req.body.status || 'Active',
            specialization: req.body.specialization || null,
            performance_rating: req.body.performance_rating || 0.00,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('housekeeping_staff')
            .insert([staffData])
            .select()
            .single();

        if (error) throw error;

        await logAction(`Housekeeping staff created: ${data.staff_name}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update staff member
router.put('/staff/:id', [
    body('status').optional().isIn(['Active', 'On Leave', 'Inactive']),
    body('shift').optional().isIn(['Day', 'Night', 'Flexible'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const updateData = {
            updated_at: new Date().toISOString()
        };

        const allowedFields = [
            'staff_name', 'employee_id', 'phone_number', 'email',
            'designation', 'shift', 'status', 'specialization', 'performance_rating'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const { data, error } = await supabase
            .from('housekeeping_staff')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Housekeeping staff updated: ${data.staff_name}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete staff member
router.delete('/staff/:id', async (req, res) => {
    try {
        // Check if staff has assigned tasks
        const { data: assignedTasks } = await supabase
            .from('housekeeping')
            .select('id')
            .eq('assigned_staff_id', req.params.id)
            .in('status', ['Pending', 'In Progress']);

        if (assignedTasks && assignedTasks.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete staff member with ${assignedTasks.length} active task(s). Please reassign tasks first.` 
            });
        }

        const { error } = await supabase
            .from('housekeeping_staff')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Housekeeping staff deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's tasks
        const { data: todayTasks } = await supabase
            .from('housekeeping')
            .select('status, priority, inspection_status')
            .eq('cleaning_date', today);

        // Get pending tasks
        const { data: pendingTasks } = await supabase
            .from('housekeeping')
            .select('id')
            .in('status', ['Pending', 'In Progress']);

        // Get overdue tasks
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
        const { data: overdueTasks } = await supabase
            .from('housekeeping')
            .select('id')
            .in('status', ['Pending', 'In Progress'])
            .or(`cleaning_date.lt.${today},and(cleaning_date.eq.${today},due_time.lt.${currentTime})`);

        const stats = {
            pending: pendingTasks?.length || 0,
            completedToday: todayTasks?.filter(t => t.status === 'Completed').length || 0,
            overdue: overdueTasks?.length || 0,
            inProgress: todayTasks?.filter(t => t.status === 'In Progress').length || 0,
            awaitingInspection: todayTasks?.filter(t => t.inspection_status === 'Pending' && t.status === 'Completed').length || 0,
            urgent: pendingTasks?.filter(t => t.priority === 'Urgent').length || 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete housekeeping task
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('housekeeping')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Housekeeping task deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting housekeeping task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
