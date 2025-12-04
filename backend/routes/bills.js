const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Helper to calculate GST rate based on amount
const getGstRateForAmount = (baseAmount) => {
    if (baseAmount == null || baseAmount === 0) return 0;
    const amount = Number(baseAmount) || 0;
    if (amount >= 0 && amount <= 5499) return 0.12;      // 12%
    if (amount >= 5500 && amount <= 7499) return 0.18;   // 18%
    if (amount >= 7500) return 0.28;                     // 28%
    return 0.12;
};

// Generate invoice number
const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `INV-${timestamp}-${random}`;
};

// Get bill by ID
router.get('/:id', async (req, res) => {
    try {
        const { data: bill, error } = await supabase
            .from('bills')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        // Get bill items
        const { data: items, error: itemsError } = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', req.params.id)
            .order('created_at');

        if (itemsError) throw itemsError;

        res.json({ success: true, data: { ...bill, items: items || [] } });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get bill by invoice number
router.get('/invoice/:invoiceNumber', async (req, res) => {
    try {
        const { data: bill, error } = await supabase
            .from('bills')
            .select('*')
            .eq('invoice_number', req.params.invoiceNumber)
            .single();

        if (error) throw error;

        const { data: items } = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', bill.id)
            .order('created_at');

        res.json({ success: true, data: { ...bill, items: items || [] } });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate bill for booking (comprehensive bill with all services)
router.post('/generate/:bookingId', async (req, res) => {
    try {
        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                rooms (
                    room_number,
                    room_type,
                    rate_per_night
                )
            `)
            .eq('id', req.params.bookingId)
            .single();

        if (bookingError) throw bookingError;

        // Get food orders for this guest (by phone or room)
        const { data: foodOrders } = await supabase
            .from('food_orders')
            .select(`
                *,
                food_menu (
                    item_name,
                    category,
                    price
                )
            `)
            .or(`customer_name.ilike.%${booking.guest_name}%,room_number.eq.${booking.rooms?.room_number}`)
            .in('status', ['Served', 'Ready'])
            .is('invoice_number', null); // Only unpaid orders

        const invoiceNumber = generateInvoiceNumber();
        const billDate = new Date().toISOString().split('T')[0];
        const billTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        // Calculate room charges
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomBaseAmount = booking.base_amount || (nights * booking.rooms?.rate_per_night);
        const roomGstRate = booking.gst_rate ? booking.gst_rate / 100 : getGstRateForAmount(roomBaseAmount);
        const roomGstAmount = booking.gst_amount || (roomBaseAmount * roomGstRate);
        const roomTotal = booking.total_amount || (roomBaseAmount + roomGstAmount);

        // Calculate food charges
        let foodSubtotal = 0;
        let foodGstTotal = 0;
        const foodItems = [];

        if (foodOrders && foodOrders.length > 0) {
            foodOrders.forEach(order => {
                const baseAmount = order.base_amount || order.total_amount || 0;
                const gstRate = order.gst_rate ? order.gst_rate / 100 : getGstRateForAmount(baseAmount);
                const gstAmount = order.gst_amount || (baseAmount * gstRate);
                const itemTotal = baseAmount + gstAmount;

                foodSubtotal += baseAmount;
                foodGstTotal += gstAmount;

                foodItems.push({
                    item_type: 'Food',
                    item_description: `${order.food_menu?.item_name || 'Food Item'} (${order.plate_type || 'Full'})`,
                    quantity: order.quantity || 1,
                    unit_price: baseAmount / (order.quantity || 1),
                    base_amount: baseAmount,
                    gst_rate: gstRate * 100,
                    gst_amount: gstAmount,
                    total_amount: itemTotal,
                    item_date: new Date(order.order_date).toISOString().split('T')[0],
                    reference_id: order.id
                });
            });
        }

        // Calculate totals
        const subtotal = roomBaseAmount + foodSubtotal;
        const totalGstAmount = roomGstAmount + foodGstTotal;
        const discount = req.body.discount || 0;
        const totalAmount = subtotal + totalGstAmount - discount;

        // Calculate overall GST rate (weighted average)
        const overallGstRate = subtotal > 0 ? ((roomGstAmount + foodGstTotal) / subtotal) * 100 : 0;

        // Create bill
        const billData = {
            invoice_number: invoiceNumber,
            booking_id: booking.id,
            guest_name: booking.guest_name,
            guest_phone: booking.phone_number,
            guest_aadhar: booking.aadhar_number,
            bill_date: billDate,
            bill_time: billTime,
            check_in_date: booking.check_in,
            check_out_date: booking.check_out,
            room_number: booking.rooms?.room_number,
            room_type: booking.rooms?.room_type,
            subtotal: subtotal,
            gst_rate: Math.round(overallGstRate * 100) / 100,
            gst_amount: Math.round(totalGstAmount * 100) / 100,
            discount: discount,
            total_amount: Math.round(totalAmount * 100) / 100,
            payment_method: req.body.payment_method || booking.payment_method || 'Cash',
            payment_status: req.body.payment_status || 'Pending',
            payment_reference: req.body.payment_reference || null,
            notes: req.body.notes || null,
            created_by: req.body.created_by || 'admin'
        };

        const { data: bill, error: billError } = await supabase
            .from('bills')
            .insert([billData])
            .select()
            .single();

        if (billError) throw billError;

        // Add room charge as bill item
        const roomItem = {
            bill_id: bill.id,
            item_type: 'Room',
            item_description: `Room ${booking.rooms?.room_number} (${booking.rooms?.room_type}) - ${nights} night(s)`,
            quantity: nights,
            unit_price: booking.rooms?.rate_per_night,
            base_amount: roomBaseAmount,
            gst_rate: roomGstRate * 100,
            gst_amount: roomGstAmount,
            total_amount: roomTotal,
            item_date: booking.check_in,
            reference_id: booking.id
        };

        await supabase.from('bill_items').insert([roomItem]);

        // Add food items
        if (foodItems.length > 0) {
            const itemsToInsert = foodItems.map(item => ({
                ...item,
                bill_id: bill.id
            }));
            await supabase.from('bill_items').insert(itemsToInsert);

            // Update food orders with invoice number
            const foodOrderIds = foodOrders.map(o => o.id);
            await supabase
                .from('food_orders')
                .update({ invoice_number: invoiceNumber })
                .in('id', foodOrderIds);
        }

        // Fetch complete bill with items
        const { data: completeBill } = await supabase
            .from('bills')
            .select('*')
            .eq('id', bill.id)
            .single();

        const { data: allItems } = await supabase
            .from('bill_items')
            .select('*')
            .eq('bill_id', bill.id)
            .order('created_at');

        await logAction(`Bill generated: ${invoiceNumber} for booking ${booking.id}`, 'admin', supabase);
        res.json({ success: true, data: { ...completeBill, items: allItems || [] } });
    } catch (error) {
        console.error('Error generating bill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update bill payment
router.patch('/:id/payment', [
    body('payment_method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer']),
    body('payment_status').isIn(['Pending', 'Paid', 'Failed', 'Refunded']),
    body('payment_reference').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const updateData = {
            payment_status: req.body.payment_status,
            updated_at: new Date().toISOString()
        };

        if (req.body.payment_method) updateData.payment_method = req.body.payment_method;
        if (req.body.payment_reference) updateData.payment_reference = req.body.payment_reference;

        const { data, error } = await supabase
            .from('bills')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // If paid, update booking payment status
        if (req.body.payment_status === 'Paid' && data.booking_id) {
            await supabase
                .from('bookings')
                .update({ payment_status: 'Paid' })
                .eq('id', data.booking_id);
        }

        await logAction(`Bill payment updated: ${req.params.id} - ${req.body.payment_status}`, 'admin', supabase);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating bill payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get bills by date range
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('bills')
            .select('*')
            .order('bill_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (req.query.startDate) {
            query = query.gte('bill_date', req.query.startDate);
        }
        if (req.query.endDate) {
            query = query.lte('bill_date', req.query.endDate);
        }
        if (req.query.guestName) {
            query = query.ilike('guest_name', `%${req.query.guestName}%`);
        }
        if (req.query.paymentStatus) {
            query = query.eq('payment_status', req.query.paymentStatus);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;



