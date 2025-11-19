# Database Migration Instructions

## Quick Fix for "Failed to create budget item" Error

The 400 error you're seeing means the database columns don't exist yet. Here's how to fix it:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Run the Migration

Copy and paste the ENTIRE contents of `database-migrations.sql` into the SQL Editor, then click "Run" (or press Ctrl+Enter).

The migration will:
- Add `is_income` column to `budget_items`
- Add `recurrence` column with bi-weekly option
- Add `payday_date` and `pay_frequency` columns
- Add SMS fields to `appointments` table

### Step 3: Verify It Worked

After running, you should see "Success. No rows returned" or similar.

To verify the columns were added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'budget_items' 
AND column_name IN ('is_income', 'payday_date', 'pay_frequency');
```

You should see all three columns listed.

### Step 4: Try Adding Your Budget Item Again

Now go back to your app and try adding the income item again. It should work!

## Troubleshooting

**If you get an error about columns already existing:**
- That's fine! The `IF NOT EXISTS` clause means it's safe to run multiple times
- Just continue - the columns are already there

**If you get a permission error:**
- Make sure you're using the SQL Editor (not the Table Editor)
- You need admin access to run migrations

**If it still doesn't work:**
- Check the browser console for the exact error message
- Make sure all columns were added successfully
- Try refreshing the page

