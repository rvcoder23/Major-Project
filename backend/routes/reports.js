const express = require('express');
const supabase = require('../config/supabaseClient');

const router = express.Router();

// Get dashboard KPIs
router.get('/dashboard', async (req, res) => {
    try {
        // Get total rooms
        const { data: roomsData } = await supabase
            .from('rooms')
            .select('id, status');

        // Get today's bookings
        const today = new Date().toISOString().split('T')[0];
        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('total_amount, payment_status')
            .eq('check_in', today);

        // Get today's revenue
        const { data: revenueData } = await supabase
            .from('accounts')
            .select('amount')
            .eq('type', 'Income')
            .gte('created_at', today);

        const totalRooms = roomsData?.length || 0;
        const availableRooms = roomsData?.filter(room => room.status === 'Available').length || 0;
        const occupiedRooms = roomsData?.filter(room => room.status === 'Occupied').length || 0;
        const maintenanceRooms = roomsData?.filter(room => room.status === 'Maintenance').length || 0;
        const cleaningRooms = roomsData?.filter(room => room.status === 'Cleaning').length || 0;

        const kpis = {
            totalRooms,
            availableRooms,
            occupiedRooms,
            maintenanceRooms,
            cleaningRooms,
            todayRevenue: revenueData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0,
            // Treat "pending cleaning" as rooms currently in Cleaning status
            pendingCleaning: cleaningRooms,
            todayCheckins: bookingsData?.length || 0
        };

        res.json({ success: true, data: kpis });
    } catch (error) {
        console.error('Error fetching dashboard KPIs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Live dashboard metrics (lightweight, polled every 30-60s)
router.get('/dashboard/live', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Use settled promises so a missing table/column does not break the endpoint
        const [
            roomsResult,
            checkinsResult,
            foodResult,
            inventoryResult,
            paymentResult,
            cleaningResult
        ] = await Promise.allSettled([
            supabase.from('rooms').select('status'),
            supabase.from('bookings').select('id').eq('check_in', today).eq('booking_status', 'Active'),
            supabase.from('food_orders').select('id, status').in('status', ['Pending', 'Preparing']),
            supabase.from('inventory').select('item_name, quantity, threshold'),
            supabase.from('bookings').select('id').eq('payment_status', 'Failed'),
            supabase.from('housekeeping').select('*')
        ]);

        const roomsData = roomsResult.status === 'fulfilled' ? roomsResult.value.data : [];
        const todayCheckins = checkinsResult.status === 'fulfilled' ? checkinsResult.value.data : [];
        const foodOrders = foodResult.status === 'fulfilled' ? foodResult.value.data : [];
        const inventoryData = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data : [];
        const failedPayments = paymentResult.status === 'fulfilled' ? paymentResult.value.data : [];
        const cleaningTasks = cleaningResult.status === 'fulfilled' ? cleaningResult.value.data : [];

        const lowStock = (inventoryData || []).filter(item => {
            const qty = Number(item.quantity) || 0;
            const threshold = Number(item.threshold) || 0;
            return qty <= threshold;
        });

        const roomStatus = {
            total: roomsData?.length || 0,
            available: roomsData?.filter(r => r.status === 'Available').length || 0,
            occupied: roomsData?.filter(r => r.status === 'Occupied').length || 0,
            maintenance: roomsData?.filter(r => r.status === 'Maintenance').length || 0,
            cleaning: roomsData?.filter(r => r.status === 'Cleaning').length || 0
        };

        const stuckCleaning = (cleaningTasks || []).filter(task => {
            if (!task || !['Pending', 'In Progress'].includes(task.status)) return false;
            const startTime = task.started_at ? new Date(task.started_at) : (task.created_at ? new Date(task.created_at) : new Date(task.cleaning_date));
            const hoursOpen = startTime ? (now - startTime) / (1000 * 60 * 60) : 0;
            return hoursOpen >= 4; // stuck more than 4 hours
        });

        const alerts = [];
        if ((lowStock?.length || 0) > 0) alerts.push('Low inventory items need restock');
        if ((stuckCleaning?.length || 0) > 0) alerts.push('Some rooms stuck in Cleaning for over 4 hours');
        if ((failedPayments?.length || 0) > 0) alerts.push('There are failed payments to review');

        res.json({
            success: true,
            data: {
                roomStatus,
                todayCheckins: todayCheckins?.length || 0,
                pendingCleaning: roomStatus.cleaning,
                newFoodOrders: foodOrders?.length || 0,
                lowStockCount: lowStock?.length || 0,
                paymentFailed: failedPayments?.length || 0,
                cleaningStuck: stuckCleaning?.length || 0,
                alerts
            }
        });
    } catch (error) {
        console.error('Error fetching live dashboard metrics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get weekly occupancy data
router.get('/occupancy', async (req, res) => {
    try {
        const { period = '7' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('bookings')
            .select('check_in, check_out, total_amount')
            .gte('check_in', startDate.toISOString().split('T')[0]);

        if (error) throw error;

        // Group by date
        const occupancyData = {};
        data.forEach(booking => {
            const date = booking.check_in;
            if (!occupancyData[date]) {
                occupancyData[date] = { bookings: 0, revenue: 0 };
            }
            occupancyData[date].bookings += 1;
            occupancyData[date].revenue += parseFloat(booking.total_amount || 0);
        });

        const formattedData = Object.keys(occupancyData).map(date => ({
            date,
            bookings: occupancyData[date].bookings,
            revenue: occupancyData[date].revenue
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching occupancy data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get monthly revenue data
router.get('/revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStartDate;
        let queryEndDate;

        if (startDate && endDate) {
            queryStartDate = startDate;
            // Adjust end date to include full day
            queryEndDate = `${endDate}T23:59:59.999Z`;
        } else {
            // Default to current month
            queryStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            queryEndDate = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('amount, created_at')
            .eq('type', 'Income')
            .gte('created_at', queryStartDate)
            .lte('created_at', queryEndDate);

        if (error) throw error;

        // Group by date
        const revenueData = {};
        data.forEach(transaction => {
            const date = transaction.created_at.split('T')[0];
            if (!revenueData[date]) {
                revenueData[date] = 0;
            }
            revenueData[date] += parseFloat(transaction.amount);
        });

        const formattedData = Object.keys(revenueData).map(date => ({
            date,
            revenue: revenueData[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate comprehensive report
router.get('/comprehensive', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStartDate = startDate || new Date().toISOString().split('T')[0];
        let queryEndDate = endDate || new Date().toISOString().split('T')[0];

        // Adjust endDate to include the full day
        // We use string manipulation to ensure we cover the entire UTC day for the given date
        // If queryEndDate is '2025-12-10', we want to search up to '2025-12-10T23:59:59.999Z'
        const adjustedEndDate = `${queryEndDate}T23:59:59.999Z`;

        // Get bookings in date range
        const { data: bookingsData } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_type
        )
      `)
            .gte('check_in', queryStartDate)
            .lte('check_out', queryEndDate); // Bookings checking out ON that day are fine, usually check_out is the date. 
        // Actually, for bookings, if check_out is the day, it's fine. 
        // The logic for bookings might need review too but let's stick to Accounts first.
        // If check_out is stored as date only, lte '2025-12-10' matches '2025-12-10'.
        // If it's timestamp, we might need adjustedEndDate too. 
        // Let's use adjustedEndDate for all to be safe for timestamps.

        // Get accounts in date range
        const { data: accountsData } = await supabase
            .from('accounts')
            .select('*')
            .gte('created_at', queryStartDate)
            .lte('created_at', adjustedEndDate);

        // Get housekeeping data
        const { data: housekeepingData } = await supabase
            .from('housekeeping')
            .select(`
        *,
        rooms (
          room_number
        )
      `)
            .gte('cleaning_date', queryStartDate)
            .lte('cleaning_date', adjustedEndDate);

        // Get food court orders in date range
        const { data: foodOrdersData } = await supabase
            .from('food_orders')
            .select('*')
            .gte('order_date', queryStartDate)
            .lte('order_date', adjustedEndDate);

        // Get inventory purchases in date range
        const { data: inventoryPurchasesData } = await supabase
            .from('purchases')
            .select('total_cost')
            .gte('purchase_date', queryStartDate)
            .lte('purchase_date', adjustedEndDate);

        // Get current inventory snapshot (for low stock and valuation)
        const { data: inventoryData } = await supabase
            .from('inventory')
            .select('*');

        // Get rooms added in date range
        const { data: roomsAddedData } = await supabase
            .from('rooms')
            .select('*')
            .gte('created_at', queryStartDate)
            .lte('created_at', adjustedEndDate);

        const report = {
            bookings: {
                total: bookingsData?.length || 0,
                totalRevenue: bookingsData?.reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0,
                completed: bookingsData?.filter(b => b.booking_status === 'Completed').length || 0,
                cancelled: bookingsData?.filter(b => b.booking_status === 'Cancelled').length || 0
            },
            accounts: {
                totalIncome: accountsData?.filter(a => a.type === 'Income').reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0,
                totalExpense: accountsData?.filter(a => a.type === 'Expense').reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0,
                netProfit: 0
            },
            housekeeping: {
                totalTasks: housekeepingData?.length || 0,
                completed: housekeepingData?.filter(h => h.status === 'Completed').length || 0,
                pending: housekeepingData?.filter(h => h.status === 'Pending').length || 0
            },
            foodCourt: {
                totalOrders: foodOrdersData?.length || 0,
                totalRevenue: foodOrdersData?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0,
                served: foodOrdersData?.filter(o => o.status === 'Served').length || 0,
                cancelled: foodOrdersData?.filter(o => o.status === 'Cancelled').length || 0
            },
            inventory: {
                totalItems: inventoryData?.length || 0,
                totalValuation: inventoryData?.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0) || 0,
                lowStockItems: inventoryData?.filter(item => item.quantity <= item.threshold).length || 0,
                purchaseCost: inventoryPurchasesData?.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0) || 0
            },
            rooms: {
                added: roomsAddedData?.length || 0,
                newRooms: roomsAddedData?.map(r => r.room_number) || []
            }
        };

        report.accounts.netProfit = report.accounts.totalIncome - report.accounts.totalExpense;

        res.json({ success: true, data: report });
    } catch (error) {
        console.error('Error generating comprehensive report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get meal plan revenue summary
router.get('/meal-plan-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const end = endDate || today;

        // Get all bookings with meal plans in date range
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('meal_plan, meal_plan_cost, number_of_guests, check_in, check_out')
            .gte('check_in', start)
            .lte('check_out', end);

        if (error) throw error;

        // Calculate summary statistics
        const summary = {
            total_bookings: bookings.length,
            total_revenue: 0,
            by_plan_type: {
                EP: { count: 0, revenue: 0, guests: 0 },
                CP: { count: 0, revenue: 0, guests: 0 },
                MAP: { count: 0, revenue: 0, guests: 0 },
                AP: { count: 0, revenue: 0, guests: 0 }
            },
            average_meal_plan_cost: 0,
            total_guests: 0
        };

        bookings.forEach(booking => {
            const plan = booking.meal_plan || 'EP';
            const cost = Number(booking.meal_plan_cost) || 0;
            const guests = Number(booking.number_of_guests) || 1;

            summary.total_revenue += cost;
            summary.total_guests += guests;

            if (summary.by_plan_type[plan]) {
                summary.by_plan_type[plan].count++;
                summary.by_plan_type[plan].revenue += cost;
                summary.by_plan_type[plan].guests += guests;
            }
        });

        summary.average_meal_plan_cost = summary.total_bookings > 0
            ? Math.round((summary.total_revenue / summary.total_bookings) * 100) / 100
            : 0;

        // Calculate most popular plan
        let mostPopular = 'EP';
        let maxCount = 0;
        Object.keys(summary.by_plan_type).forEach(plan => {
            if (summary.by_plan_type[plan].count > maxCount) {
                maxCount = summary.by_plan_type[plan].count;
                mostPopular = plan;
            }
        });
        summary.most_popular_plan = mostPopular;

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching meal plan summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get meal entitlement utilization
router.get('/meal-utilization', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const end = endDate || today;

        // Get all entitlements in date range
        const { data: entitlements, error } = await supabase
            .from('meal_entitlements')
            .select('*')
            .gte('entitlement_date', start)
            .lte('entitlement_date', end);

        if (error) throw error;

        const stats = {
            total_entitlements: entitlements.length,
            total_possible_meals: entitlements.length * 3, // B, L, D
            breakfast_used: 0,
            lunch_used: 0,
            dinner_used: 0,
            total_meals_used: 0,
            utilization_rate: 0,
            wastage_count: 0
        };

        entitlements.forEach(ent => {
            if (ent.breakfast_used) stats.breakfast_used++;
            if (ent.lunch_used) stats.lunch_used++;
            if (ent.dinner_used) stats.dinner_used++;
        });

        stats.total_meals_used = stats.breakfast_used + stats.lunch_used + stats.dinner_used;
        stats.utilization_rate = stats.total_possible_meals > 0
            ? Math.round((stats.total_meals_used / stats.total_possible_meals) * 10000) / 100
            : 0;
        stats.wastage_count = stats.total_possible_meals - stats.total_meals_used;

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching meal utilization:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get meal plan trends (daily breakdown)
router.get('/meal-plan-trends', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const end = endDate || today;

        // Get bookings grouped by date and meal plan
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('meal_plan, meal_plan_cost, check_in')
            .gte('check_in', start)
            .lte('check_in', end)
            .order('check_in');

        if (error) throw error;

        // Group by date
        const trends = {};
        bookings.forEach(booking => {
            const date = booking.check_in.split('T')[0];
            if (!trends[date]) {
                trends[date] = {
                    date,
                    EP: 0, CP: 0, MAP: 0, AP: 0,
                    total_bookings: 0,
                    total_revenue: 0
                };
            }

            const plan = booking.meal_plan || 'EP';
            trends[date][plan]++;
            trends[date].total_bookings++;
            trends[date].total_revenue += Number(booking.meal_plan_cost) || 0;
        });

        const trendsArray = Object.values(trends).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json({ success: true, data: trendsArray });
    } catch (error) {
        console.error('Error fetching meal plan trends:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
