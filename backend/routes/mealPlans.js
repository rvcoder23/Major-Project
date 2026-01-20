const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get all available meal plans
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('meal_plan_config')
            .select('*')
            .eq('is_active', true)
            .order('cost_per_person_per_day');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching meal plans:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get meal plan by type
router.get('/:planType', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('meal_plan_config')
            .select('*')
            .eq('plan_type', req.params.planType.toUpperCase())
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching meal plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get meal entitlements for a booking
router.get('/:bookingId/entitlements', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('meal_entitlements')
            .select(`
                *,
                bookings!inner (
                    id,
                    guest_name,
                    meal_plan,
                    number_of_guests,
                    check_in,
                    check_out
                )
            `)
            .eq('booking_id', req.params.bookingId)
            .order('entitlement_date')
            .order('guest_number');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching meal entitlements:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check meal eligibility for a guest
router.post('/:bookingId/check-eligibility', [
    body('guest_number').isInt({ min: 1 }).withMessage('Guest number must be a positive integer'),
    body('meal_type').isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack']).withMessage('Invalid meal type'),
    body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { guest_number, meal_type, date } = req.body;
        const bookingId = req.params.bookingId;

        // Call the database function to check eligibility
        const { data, error } = await supabase.rpc('check_meal_eligibility', {
            p_booking_id: parseInt(bookingId),
            p_guest_number: guest_number,
            p_meal_type: meal_type,
            p_date: date
        });

        if (error) throw error;

        // The function returns an array with one row
        const result = data && data.length > 0 ? data[0] : { eligible: false, reason: 'Unknown error' };

        res.json({
            success: true,
            eligible: result.eligible,
            reason: result.reason
        });
    } catch (error) {
        console.error('Error checking meal eligibility:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Use meal entitlement (mark a meal as used)
router.patch('/:bookingId/use-entitlement', [
    body('guest_number').isInt({ min: 1 }).withMessage('Guest number must be a positive integer'),
    body('meal_type').isIn(['Breakfast', 'Lunch', 'Dinner']).withMessage('Invalid meal type'),
    body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { guest_number, meal_type, date } = req.body;
        const bookingId = req.params.bookingId;

        // First check if eligible
        const { data: eligibilityData, error: eligibilityError } = await supabase.rpc('check_meal_eligibility', {
            p_booking_id: parseInt(bookingId),
            p_guest_number: guest_number,
            p_meal_type: meal_type,
            p_date: date
        });

        if (eligibilityError) throw eligibilityError;

        const eligibility = eligibilityData && eligibilityData.length > 0 ? eligibilityData[0] : null;

        if (!eligibility || !eligibility.eligible) {
            return res.status(400).json({
                success: false,
                error: eligibility ? eligibility.reason : 'Meal not eligible'
            });
        }

        // Mark the meal as used
        const updateField = `${meal_type.toLowerCase()}_used`;
        const updateTimeField = `${meal_type.toLowerCase()}_used_at`;

        const updateData = {
            [updateField]: true,
            [updateTimeField]: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('meal_entitlements')
            .update(updateData)
            .eq('booking_id', bookingId)
            .eq('guest_number', guest_number)
            .eq('entitlement_date', date)
            .select()
            .single();

        if (error) throw error;

        await logAction(`Meal entitlement used: Booking ${bookingId}, Guest ${guest_number}, ${meal_type} on ${date}`, 'system', supabase);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error using meal entitlement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get entitlement summary for a booking (useful for reports)
router.get('/:bookingId/summary', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                id,
                guest_name,
                meal_plan,
                number_of_guests,
                check_in,
                check_out,
                meal_plan_cost,
                meal_plan_config!inner (
                    plan_name,
                    description,
                    cost_per_person_per_day
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError) throw bookingError;

        // Get entitlement usage statistics
        const { data: entitlements, error: entitlementsError } = await supabase
            .from('meal_entitlements')
            .select('*')
            .eq('booking_id', bookingId);

        if (entitlementsError) throw entitlementsError;

        // Calculate statistics
        const totalBreakfasts = entitlements.filter(e => e.breakfast_used).length;
        const totalLunches = entitlements.filter(e => e.lunch_used).length;
        const totalDinners = entitlements.filter(e => e.dinner_used).length;
        const totalMealsUsed = totalBreakfasts + totalLunches + totalDinners;

        // Calculate total available meals based on plan
        const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24));
        const guests = booking.number_of_guests;

        let availableBreakfasts = 0;
        let availableLunches = 0;
        let availableDinners = 0;

        if (booking.meal_plan === 'CP') {
            availableBreakfasts = nights * guests;
        } else if (booking.meal_plan === 'MAP') {
            availableBreakfasts = nights * guests;
            availableLunches = nights * guests; // Can use lunch OR dinner
            availableDinners = nights * guests;
        } else if (booking.meal_plan === 'AP') {
            availableBreakfasts = nights * guests;
            availableLunches = nights * guests;
            availableDinners = nights * guests;
        }

        res.json({
            success: true,
            data: {
                booking: {
                    id: booking.id,
                    guest_name: booking.guest_name,
                    meal_plan: booking.meal_plan,
                    plan_name: booking.meal_plan_config.plan_name,
                    number_of_guests: booking.number_of_guests,
                    nights: nights,
                    meal_plan_cost: booking.meal_plan_cost
                },
                usage: {
                    breakfasts: {
                        used: totalBreakfasts,
                        available: availableBreakfasts,
                        remaining: Math.max(0, availableBreakfasts - totalBreakfasts)
                    },
                    lunches: {
                        used: totalLunches,
                        available: availableLunches,
                        remaining: Math.max(0, availableLunches - totalLunches)
                    },
                    dinners: {
                        used: totalDinners,
                        available: availableDinners,
                        remaining: Math.max(0, availableDinners - totalDinners)
                    },
                    total: {
                        used: totalMealsUsed,
                        available: availableBreakfasts + availableLunches + availableDinners
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching entitlement summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
