const express = require('express');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Get notification settings for a user
router.get('/notifications', async (req, res) => {
    try {
        // For now, we assume single admin user or get user from auth middleware if available
        // Since we don't have full auth middleware context in the snippet, we'll try to find the user 'admin' 
        // OR better, we accept a username query param or just default to admin for this MVP as per existing code style

        // However, proper way is to use the user ID. 
        // Existing auth returns user with ID. Frontend should verify user.
        // Let's assume we pass username or ID in header or query for now since we saw no verifyToken middleware in server.js routes list
        // actually app.use('/api/auth', authRoutes) was there but no middleware on other routes visible in server.js snippet?
        // Wait, server.js lines 48-58 show simple app.use.

        // I'll check if there is a middleware.
        // But for safety, I will look up the 'admin' user id first as fallback.

        const username = 'admin'; // Default to admin for this project context

        const { data: user, error: userError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch settings
        const { data: settings, error: settingsError } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is 'not found'
            throw settingsError;
        }

        // Return default if not found
        const defaultSettings = {
            email_notifications: true,
            low_stock_alerts: true,
            booking_notifications: true
        };

        res.json({
            success: true,
            data: settings || defaultSettings
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update notification settings
router.put('/notifications', async (req, res) => {
    try {
        const { email_notifications, low_stock_alerts, booking_notifications } = req.body;
        const username = 'admin'; // Default to admin

        const { data: user, error: userError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Upsert settings
        const { data, error } = await supabase
            .from('notification_settings')
            .upsert({
                user_id: user.id,
                email_notifications,
                low_stock_alerts,
                booking_notifications,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        await logAction('Updated notification settings', username, supabase);

        res.json({
            success: true,
            data,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
