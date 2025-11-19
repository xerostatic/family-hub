-- Quick Migration: Add debt tracking fields
-- Run this in your Supabase SQL Editor

ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS is_debt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10, 2);

