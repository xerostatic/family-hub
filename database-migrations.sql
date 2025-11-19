-- Migration: Add income tracking and recurring budget items
-- Run this in your Supabase SQL Editor

-- Add income field to budget_items (NULL = expense, NOT NULL = income)
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'yearly')) DEFAULT 'none';

-- Create index for income filtering
CREATE INDEX IF NOT EXISTS idx_budget_items_is_income ON budget_items(is_income);

