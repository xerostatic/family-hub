import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export type Database = {
  public: {
    Tables: {
      family_members: {
        Row: {
          id: string
          name: string
          email: string
          avatar_color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          avatar_color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_color?: string
          created_at?: string
        }
      }
      budget_items: {
        Row: {
          id: string
          category: string
          description: string
          amount: number
          due_date: string
          paid: boolean
          family_member_id: string
          is_income: boolean
          recurrence: string | null
          payday_date: string | null
          pay_frequency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          description: string
          amount: number
          due_date: string
          paid?: boolean
          family_member_id: string
          is_income?: boolean
          recurrence?: string | null
          payday_date?: string | null
          pay_frequency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          description?: string
          amount?: number
          due_date?: string
          paid?: boolean
          family_member_id?: string
          is_income?: boolean
          recurrence?: string | null
          payday_date?: string | null
          pay_frequency?: string | null
          created_at?: string
        }
      }
      chores: {
        Row: {
          id: string
          title: string
          description: string
          assigned_to: string
          completed: boolean
          due_date: string
          recurrence: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          assigned_to: string
          completed?: boolean
          due_date: string
          recurrence?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          assigned_to?: string
          completed?: boolean
          due_date?: string
          recurrence?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          title: string
          description: string
          family_member_id: string
          appointment_date: string
          appointment_time: string
          location: string
          reminder_sent: boolean
          phone_number: string | null
          sms_days_before: number
          sms_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          family_member_id: string
          appointment_date: string
          appointment_time: string
          location?: string
          reminder_sent?: boolean
          phone_number?: string | null
          sms_days_before?: number
          sms_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          family_member_id?: string
          appointment_date?: string
          appointment_time?: string
          location?: string
          reminder_sent?: boolean
          phone_number?: string | null
          sms_days_before?: number
          sms_enabled?: boolean
          created_at?: string
        }
      }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
