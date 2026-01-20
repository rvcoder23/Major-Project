# Meal Plan Migration Instructions

## Running the Database Migration

Since this project uses Supabase, you need to run the migration through the Supabase SQL Editor:

### Steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to: SQL Editor (in the left sidebar)
   - Or visit: https://nsqnuzzxgbuyxnvikflf.supabase.co/project/_/sql

2. **Execute the Migration**
   - Open the file: `supabase/migrations/add_meal_plan_feature.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify Migration Success**
   - Check that no errors appear in the output
   - Verify the following tables were created:
     - `meal_plan_config` (4 rows: EP, CP, MAP, AP)
     - `meal_entitlements`
   - Verify `bookings` table has new columns:
     - `meal_plan`
     - `number_of_guests`
     - `meal_plan_cost`
   - Verify `food_orders` table has new columns:
     - `booking_id`
     - `guest_number`
     - `is_meal_plan_included`
     - `meal_type`

4. **Restart the Backend Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## What the Migration Does

- **Creates `meal_plan_config` table**: Stores meal plan types and pricing
  - EP (European Plan): Room Only - ₹0
  - CP (Continental Plan): Breakfast - ₹300/person/day
  - MAP (Modified American Plan): Breakfast + 1 Meal - ₹700/person/day
  - AP (American Plan): All Meals - ₹1200/person/day

- **Creates `meal_entitlements` table**: Tracks daily meal usage per guest

- **Updates `bookings` table**: Adds meal plan fields

- **Updates `food_orders` table**: Adds meal plan integration fields

- **Creates helper functions**:
  - `generate_meal_entitlements()`: Auto-creates entitlements for bookings
  - `check_meal_eligibility()`: Checks if a meal is covered by plan

## Troubleshooting

If you encounter errors:

1. **Foreign Key Constraint Errors**: Make sure the `bookings` and `food_orders` tables exist
2. **Permission Errors**: Ensure you're using the service role key or have admin access
3. **Syntax Errors**: Make sure you copied the entire SQL file

## Alternative: Manual Execution via psql

If you have direct database access:

```bash
psql -h db.nsqnuzzxgbuyxnvikflf.supabase.co -U postgres -d postgres -f supabase/migrations/add_meal_plan_feature.sql
```

(You'll need the database password from your Supabase project settings)
