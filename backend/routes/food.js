const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all menu items
router.get('/menu', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('food_menu')
            .select('*')
            .order('category', { ascending: true })
            .order('item_name', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create menu item
router.post('/menu', [
    body('item_name').notEmpty().withMessage('Item name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('food_menu')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        await logAction(`Menu item created: ${req.body.item_name}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update menu item
router.put('/menu/:id', [
    body('item_name').optional().notEmpty(),
    body('category').optional().notEmpty(),
    body('price').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('food_menu')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Menu item updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('food_menu')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Menu item deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('food_orders')
            .select(`
                *,
                food_menu (
                    item_name,
                    category,
                    price
                )
            `)
            .order('order_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new order
router.post('/orders', [
    body('item_id').isInt().withMessage('Item ID must be a number'),
    body('quantity').isInt().withMessage('Quantity must be a number'),
    body('customer_name').optional().notEmpty(),
    body('table_number').optional().isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Get menu item details
        const { data: menuItem, error: menuError } = await supabase
            .from('food_menu')
            .select('price')
            .eq('id', req.body.item_id)
            .single();

        if (menuError) throw menuError;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const totalAmount = menuItem.price * req.body.quantity;

        const orderData = {
            order_number: orderNumber,
            item_id: req.body.item_id,
            quantity: req.body.quantity,
            total_amount: totalAmount,
            customer_name: req.body.customer_name || null,
            table_number: req.body.table_number || null,
            status: 'Pending'
        };

        const { data, error } = await supabase
            .from('food_orders')
            .insert([orderData])
            .select(`
                *,
                food_menu (
                    item_name,
                    category,
                    price
                )
            `)
            .single();

        if (error) throw error;

        await logAction(`Order created: ${orderNumber}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update order status
router.patch('/orders/:id/status', [
    body('status').isIn(['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('food_orders')
            .update({ status: req.body.status })
            .eq('id', req.params.id)
            .select(`
                *,
                food_menu (
                    item_name,
                    category,
                    price
                )
            `)
            .single();

        if (error) throw error;

        await logAction(`Order status updated: ${req.params.id} to ${req.body.status}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get today's orders
router.get('/orders/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('food_orders')
            .select(`
                *,
                food_menu (
                    item_name,
                    category,
                    price
                )
            `)
            .gte('order_date', today)
            .order('order_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching today\'s orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get today's revenue
router.get('/revenue/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('food_orders')
            .select('total_amount, status')
            .gte('order_date', today)
            .in('status', ['Served', 'Ready']);

        if (error) throw error;

        const totalRevenue = data.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const orderCount = data.length;

        res.json({ 
            success: true, 
            data: { 
                total_revenue: totalRevenue,
                order_count: orderCount
            } 
        });
    } catch (error) {
        console.error('Error fetching today\'s revenue:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get menu categories
router.get('/categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('food_menu')
            .select('category')
            .order('category');

        if (error) throw error;

        const categories = [...new Set(data.map(item => item.category))];
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
