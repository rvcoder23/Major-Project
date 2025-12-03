# Database Update Instructions - Housekeeping Module

## Quick Steps to Update Your Database

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the SQL**
   - Open the file: `HOUSEKEEPING_MIGRATION.sql` (in project root)
   - OR copy from: `supabase/housekeeping_schema_fixed.sql`
   - Paste the entire SQL content into the query editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned" or similar message
   - Check the Tables section to see:
     - `housekeeping_staff` table
     - `housekeeping_checklist_template` table
     - Updated `housekeeping` table with new columns

### Option 2: Using the Migration Script

1. **Run the migration helper script:**
   ```bash
   cd Major-Project-main
   node backend/migrate-housekeeping.js
   ```

2. **Copy the SQL output** and paste it into Supabase SQL Editor

### What This Migration Does

✅ Creates `housekeeping_staff` table for staff management  
✅ Creates `housekeeping_checklist_template` table with 4 task types  
✅ Adds new columns to `housekeeping` table:
   - Task types (Regular, Deep, VIP, Maintenance)
   - Priority levels (Low, Medium, High, Urgent)
   - Staff assignment tracking
   - Checklist system
   - Inspection workflow
   - Time tracking
   - Notes and instructions

✅ Inserts 4 checklist templates (one for each task type)  
✅ Inserts 6 sample staff members  
✅ Creates performance indexes

### After Migration

1. **Restart your backend server** (if running):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test the Housekeeping Module:**
   - Navigate to Housekeeping page
   - Check if dashboard statistics load
   - Try creating a new task
   - Verify staff list appears

### Troubleshooting

**If you get "table already exists" errors:**
- This is safe! The migration uses `IF NOT EXISTS` and won't duplicate data

**If you get "column already exists" errors:**
- This is also safe! The migration uses `ADD COLUMN IF NOT EXISTS`

**If you need to run it again:**
- The migration is idempotent (safe to run multiple times)
- It won't duplicate data due to `ON CONFLICT DO NOTHING`

### Verification

After running the migration, verify these tables exist:
```sql
SELECT * FROM housekeeping_staff LIMIT 1;
SELECT * FROM housekeeping_checklist_template;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'housekeeping' 
AND column_name IN ('task_type', 'priority', 'checklist');
```

All should return results without errors.


