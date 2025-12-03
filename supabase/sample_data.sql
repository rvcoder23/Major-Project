-- =========================
-- SAMPLE DATA FOR DASHBOARD CHARTS
-- =========================

-- Add sample bookings for the last 30 days
INSERT INTO public.bookings (guest_name, room_id, check_in, check_out, total_amount, payment_status, booking_status) VALUES
('John Smith', 1, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '23 days', 5000.00, 'Paid', 'Completed'),
('Sarah Johnson', 2, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '18 days', 3600.00, 'Paid', 'Completed'),
('Mike Wilson', 3, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '13 days', 9000.00, 'Paid', 'Completed'),
('Emily Davis', 1, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '10 days', 5000.00, 'Paid', 'Completed'),
('David Brown', 2, CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '6 days', 3600.00, 'Paid', 'Completed'),
('Lisa Anderson', 3, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 9000.00, 'Paid', 'Completed'),
('Tom Miller', 1, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, 2500.00, 'Paid', 'Active'),
('Anna Garcia', 2, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 3600.00, 'Pending', 'Active'),
('Chris Lee', 3, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 9000.00, 'Pending', 'Active'),
('Maria Rodriguez', 1, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 5000.00, 'Pending', 'Active');

-- Add sample accounts (income) for the last 30 days
INSERT INTO public.accounts (description, amount, type, created_at) VALUES
('Room Revenue - John Smith', 5000.00, 'Income', CURRENT_DATE - INTERVAL '25 days'),
('Room Revenue - Sarah Johnson', 3600.00, 'Income', CURRENT_DATE - INTERVAL '20 days'),
('Room Revenue - Mike Wilson', 9000.00, 'Income', CURRENT_DATE - INTERVAL '15 days'),
('Room Revenue - Emily Davis', 5000.00, 'Income', CURRENT_DATE - INTERVAL '12 days'),
('Room Revenue - David Brown', 3600.00, 'Income', CURRENT_DATE - INTERVAL '8 days'),
('Room Revenue - Lisa Anderson', 9000.00, 'Income', CURRENT_DATE - INTERVAL '5 days'),
('Room Revenue - Tom Miller', 2500.00, 'Income', CURRENT_DATE - INTERVAL '2 days'),
('Room Revenue - Anna Garcia', 3600.00, 'Income', CURRENT_DATE),
('Food Court Revenue', 2500.00, 'Income', CURRENT_DATE - INTERVAL '1 day'),
('Food Court Revenue', 1800.00, 'Income', CURRENT_DATE - INTERVAL '3 days'),
('Food Court Revenue', 3200.00, 'Income', CURRENT_DATE - INTERVAL '7 days'),
('Food Court Revenue', 2100.00, 'Income', CURRENT_DATE - INTERVAL '10 days'),
('Food Court Revenue', 2800.00, 'Income', CURRENT_DATE - INTERVAL '14 days'),
('Food Court Revenue', 1900.00, 'Income', CURRENT_DATE - INTERVAL '18 days'),
('Food Court Revenue', 3500.00, 'Income', CURRENT_DATE - INTERVAL '22 days'),
('Food Court Revenue', 2400.00, 'Income', CURRENT_DATE - INTERVAL '26 days'),
('Banquet Revenue', 15000.00, 'Income', CURRENT_DATE - INTERVAL '5 days'),
('Banquet Revenue', 12000.00, 'Income', CURRENT_DATE - INTERVAL '12 days'),
('Banquet Revenue', 18000.00, 'Income', CURRENT_DATE - INTERVAL '20 days'),
('Banquet Revenue', 14000.00, 'Income', CURRENT_DATE - INTERVAL '28 days');

-- Add sample expenses
INSERT INTO public.accounts (description, amount, type, created_at) VALUES
('Staff Salaries', 25000.00, 'Expense', CURRENT_DATE - INTERVAL '1 day'),
('Electricity Bill', 5000.00, 'Expense', CURRENT_DATE - INTERVAL '2 days'),
('Water Bill', 2000.00, 'Expense', CURRENT_DATE - INTERVAL '3 days'),
('Internet Bill', 1500.00, 'Expense', CURRENT_DATE - INTERVAL '4 days'),
('Cleaning Supplies', 3000.00, 'Expense', CURRENT_DATE - INTERVAL '5 days'),
('Food Ingredients', 8000.00, 'Expense', CURRENT_DATE - INTERVAL '6 days'),
('Maintenance', 4000.00, 'Expense', CURRENT_DATE - INTERVAL '7 days'),
('Marketing', 5000.00, 'Expense', CURRENT_DATE - INTERVAL '10 days'),
('Insurance', 3000.00, 'Expense', CURRENT_DATE - INTERVAL '15 days'),
('Property Tax', 10000.00, 'Expense', CURRENT_DATE - INTERVAL '20 days');

-- Add sample housekeeping tasks
INSERT INTO public.housekeeping (room_id, staff_name, status, cleaning_date) VALUES
(1, 'Alice Cleaner', 'Completed', CURRENT_DATE - INTERVAL '1 day'),
(2, 'Bob Cleaner', 'Completed', CURRENT_DATE - INTERVAL '1 day'),
(3, 'Carol Cleaner', 'Completed', CURRENT_DATE - INTERVAL '1 day'),
(4, 'Alice Cleaner', 'Completed', CURRENT_DATE - INTERVAL '2 days'),
(5, 'Bob Cleaner', 'Completed', CURRENT_DATE - INTERVAL '2 days'),
(1, 'Carol Cleaner', 'Pending', CURRENT_DATE),
(2, 'Alice Cleaner', 'Pending', CURRENT_DATE),
(3, 'Bob Cleaner', 'In Progress', CURRENT_DATE);

-- Add sample food orders
INSERT INTO public.food_orders (order_number, item_id, quantity, total_amount, order_date, status) VALUES
('ORD-001', 1, 2, 700.00, CURRENT_DATE - INTERVAL '1 day', 'Completed'),
('ORD-002', 2, 1, 200.00, CURRENT_DATE - INTERVAL '1 day', 'Completed'),
('ORD-003', 3, 1, 400.00, CURRENT_DATE - INTERVAL '2 days', 'Completed'),
('ORD-004', 4, 4, 200.00, CURRENT_DATE - INTERVAL '2 days', 'Completed'),
('ORD-005', 5, 2, 160.00, CURRENT_DATE - INTERVAL '3 days', 'Completed'),
('ORD-006', 6, 3, 180.00, CURRENT_DATE - INTERVAL '3 days', 'Completed'),
('ORD-007', 7, 2, 60.00, CURRENT_DATE - INTERVAL '4 days', 'Completed'),
('ORD-008', 8, 2, 80.00, CURRENT_DATE - INTERVAL '4 days', 'Completed'),
('ORD-009', 1, 1, 350.00, CURRENT_DATE, 'Pending'),
('ORD-010', 2, 2, 400.00, CURRENT_DATE, 'Pending');

-- Add sample banquet bookings
INSERT INTO public.banquets (event_name, customer_name, date, total_cost, status) VALUES
('Wedding Reception', 'Mr. & Mrs. Sharma', CURRENT_DATE - INTERVAL '5 days', 15000.00, 'Completed'),
('Corporate Meeting', 'Tech Solutions Inc.', CURRENT_DATE - INTERVAL '12 days', 12000.00, 'Completed'),
('Birthday Party', 'Mrs. Gupta', CURRENT_DATE - INTERVAL '20 days', 18000.00, 'Completed'),
('Conference', 'Business Association', CURRENT_DATE - INTERVAL '28 days', 14000.00, 'Completed'),
('Anniversary', 'Mr. & Mrs. Kumar', CURRENT_DATE + INTERVAL '5 days', 16000.00, 'Booked'),
('Graduation Party', 'Ms. Patel', CURRENT_DATE + INTERVAL '10 days', 13000.00, 'Booked');

-- Add sample utilities
INSERT INTO public.utilities (type, usage_units, cost_per_unit, total_cost, date) VALUES
('Electricity', 1500.00, 8.50, 12750.00, CURRENT_DATE - INTERVAL '1 day'),
('Water', 800.00, 5.00, 4000.00, CURRENT_DATE - INTERVAL '1 day'),
('Internet', 1.00, 1500.00, 1500.00, CURRENT_DATE - INTERVAL '1 day'),
('Gas', 200.00, 12.00, 2400.00, CURRENT_DATE - INTERVAL '1 day'),
('Electricity', 1400.00, 8.50, 11900.00, CURRENT_DATE - INTERVAL '2 days'),
('Water', 750.00, 5.00, 3750.00, CURRENT_DATE - INTERVAL '2 days'),
('Internet', 1.00, 1500.00, 1500.00, CURRENT_DATE - INTERVAL '2 days'),
('Gas', 180.00, 12.00, 2160.00, CURRENT_DATE - INTERVAL '2 days');

-- Add sample purchases
INSERT INTO public.purchases (item_id, quantity, purchase_date, total_cost) VALUES
(1, 20, CURRENT_DATE - INTERVAL '5 days', 2000.00),
(2, 50, CURRENT_DATE - INTERVAL '5 days', 1500.00),
(3, 30, CURRENT_DATE - INTERVAL '5 days', 1800.00),
(4, 100, CURRENT_DATE - INTERVAL '5 days', 1200.00),
(5, 15, CURRENT_DATE - INTERVAL '5 days', 900.00),
(6, 25, CURRENT_DATE - INTERVAL '5 days', 750.00);

-- Update some rooms to different statuses for realistic data
UPDATE public.rooms SET status = 'Occupied' WHERE id IN (1, 2);
UPDATE public.rooms SET status = 'Maintenance' WHERE id = 3;
UPDATE public.rooms SET status = 'Cleaning' WHERE id = 4;
