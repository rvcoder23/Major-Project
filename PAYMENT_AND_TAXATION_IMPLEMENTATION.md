# Payment Methods and Taxation Implementation

## Overview
Complete payment method integration with GST taxation system following Indian tax regulations.

## GST Tax Rates

The system applies GST based on the **base amount** (total before tax):

- **12% GST** for ₹0 - ₹5,499
- **18% GST** for ₹5,500 - ₹7,499
- **28% GST** for ₹7,500 and above

## Database Schema

### New Columns in `bookings` Table:
- `payment_method` VARCHAR(50) - Payment method used (Cash, Credit Card, etc.)
- `base_amount` DECIMAL(10,2) - Amount before GST
- `gst_rate` DECIMAL(5,2) - GST rate as percentage (12, 18, 28)
- `gst_amount` DECIMAL(10,2) - Calculated GST amount

### New Table: `payment_methods`
Reference table for available payment methods:
- Cash
- Credit Card
- Debit Card
- UPI
- Net Banking
- Cheque
- Bank Transfer

## Setup Instructions

### 1. Run Database Migration

Open Supabase SQL Editor and run:
```sql
-- File: supabase/payment_methods_schema.sql
```

This will:
- Add `payment_method` column to bookings
- Add GST-related columns (base_amount, gst_rate, gst_amount)
- Create `payment_methods` table
- Insert default payment methods
- Create indexes for performance

### 2. Backend Updates

The backend has been updated with:
- ✅ Correct GST calculation based on base amount
- ✅ Payment method validation
- ✅ API endpoint to fetch payment methods: `GET /api/bookings/payment-methods`

### 3. Frontend Updates

The frontend now includes:
- ✅ Payment method dropdown in booking form
- ✅ Real-time tax calculation display
- ✅ Amount breakdown showing:
  - Base amount (room rate × nights)
  - GST rate and amount
  - Total amount (base + GST)
- ✅ Payment method column in bookings table
- ✅ Payment method and tax breakdown in booking details modal

## Features

### Booking Form
- **Payment Method Selection**: Choose from 7 payment methods
- **Real-time Calculation**: Tax automatically calculates when room and dates are selected
- **Amount Breakdown Display**:
  ```
  Room Rate (2 nights): ₹5,000.00
  GST (12%): ₹600.00
  Total Amount: ₹5,600.00
  ```

### Booking Details
- Shows complete breakdown:
  - Base Amount
  - GST Rate (%)
  - GST Amount
  - Total Amount
  - Payment Method
  - Payment Status

### Booking List Table
- Added "Payment Method" column
- Shows payment method for each booking

## Calculation Examples

### Example 1: ₹3,000 base amount
- Base: ₹3,000
- GST Rate: 12% (0-5499 range)
- GST Amount: ₹360
- Total: ₹3,360

### Example 2: ₹6,500 base amount
- Base: ₹6,500
- GST Rate: 18% (5500-7499 range)
- GST Amount: ₹1,170
- Total: ₹7,670

### Example 3: ₹8,500 base amount
- Base: ₹8,500
- GST Rate: 28% (7500+ range)
- GST Amount: ₹2,380
- Total: ₹10,880

## API Endpoints

### Get Payment Methods
```
GET /api/bookings/payment-methods
Response: ["Cash", "Credit Card", "Debit Card", ...]
```

### Create Booking (with payment method)
```
POST /api/bookings
Body: {
  ...bookingData,
  payment_method: "Cash" | "Credit Card" | ...
}
```

## Usage Flow

1. **Create Booking**:
   - Select room, dates
   - Tax automatically calculates
   - Select payment method
   - View amount breakdown
   - Submit booking

2. **View Booking**:
   - See payment method in table
   - Click to view full details with tax breakdown

3. **Payment Tracking**:
   - Payment status: Pending/Paid/Failed
   - Payment method: How payment was/will be made

## Notes

- GST is calculated on the **total base amount** (nights × rate_per_night)
- Amounts are rounded to 2 decimal places
- Default payment method is "Cash" if not specified
- Payment method is stored with each booking for record-keeping
- All calculations follow the exact GST rate requirements



