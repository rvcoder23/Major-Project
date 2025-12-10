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

module.exports = router;
