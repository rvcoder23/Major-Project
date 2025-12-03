const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all accounts transactions
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create account transaction
router.post('/', [
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').isIn(['Income', 'Expense']).withMessage('Type must be Income or Expense'),
    body('payment_method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const transactionData = {
            ...req.body,
            payment_method: req.body.payment_method || 'Cash'
        };

        const { data, error } = await supabase
            .from('accounts')
            .insert([transactionData])
            .select()
            .single();

        if (error) throw error;

        await logAction(`Account transaction created: ${req.body.type} - ${req.body.description}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating account transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update account transaction
router.put('/:id', [
    body('description').optional().notEmpty(),
    body('amount').optional().isNumeric(),
    body('type').optional().isIn(['Income', 'Expense'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('accounts')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Account transaction updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating account transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete account transaction
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Account transaction deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting account transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get daily summary
router.get('/daily-summary', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .gte('created_at', today)
            .lt('created_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const summary = {
            totalIncome: data.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalExpense: data.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            netProfit: 0,
            transactions: data.length
        };

        summary.netProfit = summary.totalIncome - summary.totalExpense;

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching daily summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get monthly summary
router.get('/monthly-summary', async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
            .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

        if (error) throw error;

        const summary = {
            totalIncome: data.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalExpense: data.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            netProfit: 0,
            transactions: data.length
        };

        summary.netProfit = summary.totalIncome - summary.totalExpense;

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get income vs expense chart data
router.get('/chart-data', async (req, res) => {
    try {
        const { period = '7' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // Group by date
        const chartData = {};
        data.forEach(transaction => {
            const date = transaction.created_at.split('T')[0];
            if (!chartData[date]) {
                chartData[date] = { income: 0, expense: 0 };
            }
            if (transaction.type === 'Income') {
                chartData[date].income += parseFloat(transaction.amount);
            } else {
                chartData[date].expense += parseFloat(transaction.amount);
            }
        });

        const formattedData = Object.keys(chartData).map(date => ({
            date,
            income: chartData[date].income,
            expense: chartData[date].expense
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
