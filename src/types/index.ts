import { Database } from '@/lib/supabase'

export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type BudgetItem = Database['public']['Tables']['budget_items']['Row']
export type Chore = Database['public']['Tables']['chores']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']

