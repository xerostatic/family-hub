-- Migration: Add income tracking and recurring budget items
-- Run this in your Supabase SQL Editor

-- Step 1: Drop old recurrence constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_items_recurrence_check'
    ) THEN
        ALTER TABLE budget_items DROP CONSTRAINT budget_items_recurrence_check;
    END IF;
END $$;

-- Step 2: Add new columns (if they don't exist)
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payday_date DATE,
ADD COLUMN IF NOT EXISTS pay_frequency TEXT CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly'));

-- Step 3: Update recurrence column if it exists, or add it with new constraint
DO $$ 
BEGIN
    -- If recurrence column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budget_items' AND column_name = 'recurrence'
    ) THEN
        ALTER TABLE budget_items 
        ADD COLUMN recurrence TEXT DEFAULT 'none';
    END IF;
    
    -- Add the new constraint with biweekly option
    ALTER TABLE budget_items 
    ADD CONSTRAINT budget_items_recurrence_check 
    CHECK (recurrence IN ('none', 'monthly', 'yearly', 'biweekly') OR recurrence IS NULL);
END $$;

-- Step 4: Create index for income filtering
CREATE INDEX IF NOT EXISTS idx_budget_items_is_income ON budget_items(is_income);

-- Step 5: Add SMS notification fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_days_before INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;

