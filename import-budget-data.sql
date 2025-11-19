-- Budget Import from CSV
-- Run this in your Supabase SQL Editor after running the database migration
-- Make sure you have a family member named "Rebecca" or update the family_member_id

-- Income Items
INSERT INTO budget_items (category, description, amount, due_date, is_income, recurrence, pay_frequency, payday_date, family_member_id, paid) 
VALUES ('Salary', 'Rebecca Pay', 3663, '2024-10-24', true, 'biweekly', 'biweekly', '2024-10-24', (SELECT id FROM family_members WHERE name ILIKE '%rebecca%' LIMIT 1), false);

-- Expense Items
INSERT INTO budget_items (category, description, amount, due_date, is_income, recurrence, family_member_id, paid) 
VALUES 
('Bills', 'House', 1749, '2024-11-07', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Entertainment', 'Church', 540, '2024-10-24', false, 'biweekly', (SELECT id FROM family_members LIMIT 1), false),
('Healthcare', 'Student Loans', 202, '2024-11-07', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'HendricksPwr', 350, '2024-11-21', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Spectrum', 80, '2024-11-07', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Suburban', 475, '2024-11-07', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Groceries', 'Food', 500, '2024-10-24', false, 'biweekly', (SELECT id FROM family_members LIMIT 1), false),
('Gas', 'Gas', 100, '2024-10-24', false, 'biweekly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Geico', 65, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Fi', 130, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'LafCred', 646, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'AllData', 230, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Entertainment', 'Netflix', 16, '2024-11-07', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Trash', 70, '2024-12-05', false, NULL, (SELECT id FROM family_members LIMIT 1), false),
('Healthcare', 'Homeschool', 75, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Bills', 'Drive', 10, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false),
('Entertainment', 'YT Premium', 14, '2024-10-24', false, 'monthly', (SELECT id FROM family_members LIMIT 1), false);

