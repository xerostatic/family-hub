-- Migration: Add homeschool tracking table
-- Run this in your Supabase SQL Editor

-- Create homeschool_activities table
CREATE TABLE IF NOT EXISTS homeschool_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    activity_date DATE NOT NULL,
    hours_spent DECIMAL(4, 2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create homeschool_subjects table for tracking subject progress
CREATE TABLE IF NOT EXISTS homeschool_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    grade_level TEXT,
    curriculum TEXT,
    hours_per_week DECIMAL(4, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_homeschool_activities_student ON homeschool_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_homeschool_activities_date ON homeschool_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_homeschool_subjects_student ON homeschool_subjects(student_id);

-- Enable Row Level Security
ALTER TABLE homeschool_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeschool_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on homeschool_activities" ON homeschool_activities FOR ALL USING (true);
CREATE POLICY "Allow all operations on homeschool_subjects" ON homeschool_subjects FOR ALL USING (true);

