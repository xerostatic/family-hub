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

-- Step 5: Add debt tracking to budget_items
ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS is_debt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10, 2);

-- Step 6: Add SMS notification fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_days_before INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;

-- Step 7: Make email optional in family_members table
DO $$
BEGIN
    -- Drop NOT NULL constraint if it exists
    ALTER TABLE family_members ALTER COLUMN email DROP NOT NULL;
    
    -- Drop UNIQUE constraint if it exists (since we're making it nullable)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'family_members' 
        AND constraint_name LIKE '%email%unique%'
    ) THEN
        ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_email_key;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint doesn't exist, that's fine
        NULL;
END $$;

-- Step 8: Make due_date optional in chores table (for recurring chores)
DO $$
BEGIN
    -- Drop NOT NULL constraint if it exists
    ALTER TABLE chores ALTER COLUMN due_date DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint doesn't exist, that's fine
        NULL;
END $$;

-- Step 9: Create daily_chore_status table for tracking daily chore completion
CREATE TABLE IF NOT EXISTS daily_chore_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chore_id UUID REFERENCES chores(id) ON DELETE CASCADE,
    status_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chore_id, status_date)
);

-- Create index for efficient daily queries
CREATE INDEX IF NOT EXISTS idx_daily_chore_status_date ON daily_chore_status(status_date);
CREATE INDEX IF NOT EXISTS idx_daily_chore_status_chore ON daily_chore_status(chore_id);
CREATE INDEX IF NOT EXISTS idx_daily_chore_status_composite ON daily_chore_status(chore_id, status_date);

-- Step 10: Make assigned_to nullable in chores table (for "Everyone" chores)
DO $$
BEGIN
    -- Drop NOT NULL constraint if it exists
    ALTER TABLE chores ALTER COLUMN assigned_to DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint doesn't exist, that's fine
        NULL;
END $$;

-- Step 11: Make family_member_id nullable in budget_items table (no longer assigning to specific members)
DO $$
BEGIN
    -- Drop NOT NULL constraint if it exists
    ALTER TABLE budget_items ALTER COLUMN family_member_id DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint doesn't exist, that's fine
        NULL;
END $$;

-- Step 12: Add debt snowball tracking fields to budget_items table
ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS include_in_snowball BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS payment_term_months INTEGER;

