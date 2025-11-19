-- Migration: Add income tracking and recurring budget items
-- Run this in your Supabase SQL Editor

-- Add income field to budget_items (NULL = expense, NOT NULL = income)
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'yearly', 'biweekly')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS payday_date DATE,
ADD COLUMN IF NOT EXISTS pay_frequency TEXT CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly'));

-- Create index for income filtering
CREATE INDEX IF NOT EXISTS idx_budget_items_is_income ON budget_items(is_income);

-- Add SMS notification fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_days_before INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;

