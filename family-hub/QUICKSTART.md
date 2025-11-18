# Family Hub - Quick Start Guide

## 5-Minute Setup

### Step 1: Supabase Setup (2 minutes)
1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Name it "family-hub" and create a strong password
4. Wait 2 minutes for database to provision
5. Click "SQL Editor" in left sidebar
6. Copy/paste ALL of `supabase-schema.sql` contents
7. Click "Run" - you should see "Success. No rows returned"

### Step 2: Get Your Keys (1 minute)
1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. Find "Project URL" - copy it
4. Find "anon public" key under "Project API keys" - copy it
5. Keep this browser tab open!

### Step 3: Local Setup (2 minutes)
```bash
# In your terminal:
cd family-hub
npm install
cp .env.local.example .env.local
code .env.local   # or open with any text editor
```

Paste your Supabase URL and key into .env.local:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-key-here
```

Save the file, then:
```bash
npm run dev
```

Open http://localhost:3000 - you're done! 🎉

## Vercel Deployment (Optional - 3 minutes)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to https://vercel.com
3. Click "Import Project" → Import your GitHub repo
4. Add environment variables (same as .env.local)
5. Click "Deploy"

Your app will be live at https://your-app.vercel.app!

## Quick Tips

### Adding Your Family
In Supabase dashboard:
1. Click "Table Editor" → "family_members"
2. Click "Insert row"
3. Add each family member with name and email
4. Pick a color code like #10B981 (green) or #3B82F6 (blue)

### First Budget Item
1. Click "Budget" tab
2. Click "Add Item"
3. Try: Category: Bills, Description: Electric, Amount: 150, Due Date: end of month

### First Chore
1. Click "Chores" tab
2. Click "Add Chore"
3. Try: Title: Take out trash, Assigned to: [pick someone], Due Date: tomorrow

### First Appointment
1. Click "Appointments" tab
2. Click "Add Appointment"
3. Try: Type: Doctor Visit, Member: [pick someone], Date/Time: next week

## Troubleshooting

**"Cannot connect to Supabase"**
- Double-check your .env.local has correct URL and key
- Make sure there are no spaces or quotes
- Restart dev server: Stop it (Ctrl+C) and run `npm run dev` again

**"No data showing"**
- Go to Supabase → Table Editor
- Check if tables exist: family_members, budget_items, chores, appointments
- If empty, re-run the SQL schema

**Need to reset data?**
In Supabase SQL Editor:
```sql
DELETE FROM budget_items;
DELETE FROM chores;
DELETE FROM appointments;
-- This keeps family members but clears all data
```

## Next Steps

1. Add all your family members to Supabase
2. Start adding your real budget items
3. Assign chores to family members
4. Schedule upcoming appointments
5. Share the Vercel URL with your family!

Questions? Check the full README.md for more details.
