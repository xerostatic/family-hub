-- Family Hub Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Family Members Table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Items Table
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chores Table
CREATE TABLE chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES family_members(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE NOT NULL,
    recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    location TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_budget_items_due_date ON budget_items(due_date);
CREATE INDEX idx_budget_items_family_member ON budget_items(family_member_id);
CREATE INDEX idx_chores_assigned_to ON chores(assigned_to);
CREATE INDEX idx_chores_due_date ON chores(due_date);
CREATE INDEX idx_appointments_family_member ON appointments(family_member_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later)
CREATE POLICY "Allow all operations on family_members" ON family_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on budget_items" ON budget_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on chores" ON chores FOR ALL USING (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true);

-- Insert sample data (optional)
INSERT INTO family_members (name, email, avatar_color) VALUES
    ('Chris', 'chris@example.com', '#10B981'),
    ('Kyle', 'kyle@example.com', '#3B82F6');
