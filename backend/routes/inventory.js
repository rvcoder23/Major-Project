const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('item_name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create inventory item
router.post('/', [
    body('item_name').notEmpty().withMessage('Item name is required'),
    body('quantity').isInt().withMessage('Quantity must be a number'),
    body('threshold').isInt().withMessage('Threshold must be a number'),
    body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('inventory')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        await logAction(`Inventory item created: ${req.body.item_name}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update inventory item
router.put('/:id', [
    body('item_name').optional().notEmpty(),
    body('quantity').optional().isInt(),
    body('threshold').optional().isInt(),
    body('price').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { data, error } = await supabase
            .from('inventory')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Inventory item updated: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        await logAction(`Inventory item deleted: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, message: 'Inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .lte('quantity', supabase.raw('threshold'));

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add stock (purchase)
router.post('/:id/add-stock', [
    body('quantity').isInt().withMessage('Quantity must be a number'),
    body('total_cost').optional().isNumeric().withMessage('Total cost must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Read current quantity and price
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity, price')
            .eq('id', req.params.id)
            .single();

        if (inventoryError) throw inventoryError;

        const qtyToAdd = Number(req.body.quantity);
        const unitPrice = Number(inventoryData.price || 0);
        const computedTotal = qtyToAdd * unitPrice;
        const finalTotalCost = typeof req.body.total_cost === 'number' ? req.body.total_cost : computedTotal;

        const newQuantity = inventoryData.quantity + qtyToAdd;

        const { data, error } = await supabase
            .from('inventory')
            .update({
                quantity: newQuantity,
                last_refilled: new Date().toISOString().split('T')[0]
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Record purchase
        await supabase
            .from('purchases')
            .insert([{
                item_id: req.params.id,
                quantity: qtyToAdd,
                total_cost: finalTotalCost
            }]);

        await logAction(`Stock added to inventory item: ${req.params.id}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get purchase history
router.get('/purchases', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('purchases')
            .select(`
        *,
        inventory (
          item_name
        )
      `)
            .order('purchase_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
