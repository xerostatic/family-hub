-- QUICK FIX: Run this if you're getting recurrence constraint errors
-- This fixes the constraint to allow 'biweekly'

-- Drop the old constraint
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_recurrence_check;

-- Add the new constraint with biweekly
ALTER TABLE budget_items 
ADD CONSTRAINT budget_items_recurrence_check 
CHECK (recurrence IN ('none', 'monthly', 'yearly', 'biweekly') OR recurrence IS NULL);

-- If columns don't exist yet, add them
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payday_date DATE,
ADD COLUMN IF NOT EXISTS pay_frequency TEXT CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly'));

