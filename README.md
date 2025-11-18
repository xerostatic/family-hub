# Family Hub - Budget, Chores & Appointments Manager

A comprehensive family management application built with Next.js, Supabase, and Tailwind CSS. Perfect for managing your family's budget, assigning chores, and tracking doctor appointments all in one place.

## Features

### 💰 Budget Tracker
- Add and categorize expenses (Bills, Groceries, Gas, Entertainment, Healthcare, etc.)
- Track payment status with visual indicators
- See total, paid, and unpaid amounts at a glance
- Assign expenses to family members
- Set due dates for bills and expenses

### 🧹 Chore Management
- Create and assign chores to family members
- Set due dates and recurring schedules (daily, weekly, monthly)
- Track completion status with progress bar
- Visual indicators for overdue chores
- Add detailed descriptions for each chore

### 📅 Appointment Tracking
- Schedule doctor, dentist, and other medical appointments
- Track appointments for each family member
- Add location and notes for each appointment
- Visual reminders for today's appointments
- Mark appointments with reminder status

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and React
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great!)
- Git for version control

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your database to be provisioned
3. Go to the SQL Editor in your Supabase dashboard
4. Copy and paste the contents of `supabase-schema.sql` and run it
5. This will create all necessary tables and sample data

### 2. Get Your Supabase Credentials

1. In your Supabase project, go to Settings → API
2. Copy your `Project URL` (looks like: https://xxxxx.supabase.co)
3. Copy your `anon/public` API key (long string starting with "eyJ...")

### 3. Set Up the Project Locally

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### 4. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Database Schema

### Tables

- **family_members**: Store family member information
- **budget_items**: Track expenses and bills
- **chores**: Manage household chores
- **appointments**: Schedule and track appointments

All tables include Row Level Security (RLS) policies for data protection.

## Customization

### Adding Family Members

You can add family members directly in Supabase:

1. Go to Table Editor → family_members
2. Click "Insert row"
3. Add name, email, and choose an avatar color

Or modify the SQL file to add more sample data during setup.

### Changing Categories

Budget categories and appointment types can be customized in the component files:
- Budget categories: `src/components/BudgetSection.tsx`
- Appointment types: `src/components/AppointmentsSection.tsx`

### Styling

The app uses Tailwind CSS. You can customize colors and styles in:
- `tailwind.config.js` - Theme configuration
- Component files - Individual component styling

## Project Structure

```
family-hub/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard
│   ├── components/
│   │   ├── BudgetSection.tsx
│   │   ├── ChoresSection.tsx
│   │   └── AppointmentsSection.tsx
│   └── lib/
│       └── supabase.ts       # Supabase client & types
├── supabase-schema.sql       # Database setup
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Future Enhancements

Ideas for expanding the app:
- Email/SMS reminders for appointments and overdue chores
- Calendar view for appointments
- Budget reports and analytics
- File uploads for receipts
- Mobile app version
- Family member authentication
- Shared shopping lists
- Meal planning integration

## Tips for Your Shop

Since you're building this for your family and you have Speedish Automotive experience, you could easily extend this to:
- Track shop expenses vs. personal budget
- Manage shop maintenance tasks as "chores"
- Schedule vehicle service appointments
- Track parts orders and deliveries

## Support

For Next.js questions: [Next.js Documentation](https://nextjs.org/docs)
For Supabase questions: [Supabase Documentation](https://supabase.com/docs)

## License

MIT License - Feel free to use and modify for your family!

---

Built with ❤️ for family organization

