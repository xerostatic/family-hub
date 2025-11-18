-- Family Hub Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES family_members(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE NOT NULL,
  recurrence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some sample family members (optional - you can skip this)
INSERT INTO family_members (name, email, avatar_color) VALUES
  ('John Doe', 'john@example.com', '#3B82F6'),
  ('Jane Doe', 'jane@example.com', '#EC4899'),
  ('Kid 1', 'kid1@example.com', '#10B981'),
  ('Kid 2', 'kid2@example.com', '#F59E0B')
ON CONFLICT DO NOTHING;
