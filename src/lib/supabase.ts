import { createClient } from '@supabase/supabase-js'
import { createMockSupabase } from './mock-supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// TEMPORARY: Force demo mode to prevent infinite loops
const isDemoMode = false // Force demo mode temporarily to fix infinite loop issue
// const isDemoMode = supabaseUrl.includes('demo.supabase.co') || supabaseAnonKey === 'demo-anon-key'

// Additional check for potentially invalid URLs
const isInvalidUrl = !supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl.length < 20

if (isDemoMode) {
  console.warn('🚨 Running in demo mode - Supabase functionality will be mocked')
} else if (isInvalidUrl) {
  console.error('⚠️ Invalid Supabase URL detected. Check your environment variables.')
}

export const supabase = isDemoMode 
  ? createMockSupabase() as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'brain-health-admin-auth-token',
        detectSessionInUrl: true
      }
    })

export type Database = {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string
          name: string
          licence_seats: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          licence_seats: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          licence_seats?: number
          created_at?: string
          updated_at?: string
        }
      }
      seniors: {
        Row: {
          id: string
          org_id: string
          name: string
          gender_enum: 'M' | 'F'
          birth: string
          eduyear: 'none' | 'elementary' | 'middle' | 'high' | 'college' | null
          phone: string | null
          guardian_phone: string | null
          address: any | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          gender_enum: 'M' | 'F'
          birth: string
          eduyear?: 'none' | 'elementary' | 'middle' | 'high' | 'college' | null
          phone?: string | null
          guardian_phone?: string | null
          address?: any | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          gender_enum?: 'M' | 'F'
          birth?: string
          eduyear?: 'none' | 'elementary' | 'middle' | 'high' | 'college' | null
          phone?: string | null
          guardian_phone?: string | null
          address?: any | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          senior_id: string
          start_date: string
          end_date: string
          sessions_per_week: number
          status: 'Active' | 'Completed' | 'Cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          senior_id: string
          start_date: string
          end_date: string
          sessions_per_week: number
          status?: 'Active' | 'Completed' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          senior_id?: string
          start_date?: string
          end_date?: string
          sessions_per_week?: number
          status?: 'Active' | 'Completed' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      motor_results: {
        Row: {
          id: string
          senior_id: string
          raw: any
          video_key: string
          bpm: number | null
          created_at: string
        }
        Insert: {
          id?: string
          senior_id: string
          raw: any
          video_key: string
          bpm?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          senior_id?: string
          raw?: any
          video_key?: string
          bpm?: number | null
          created_at?: string
        }
      }
      cognitive_results: {
        Row: {
          id: string
          senior_id: string
          raw: any
          video_key: string
          created_at: string
        }
        Insert: {
          id?: string
          senior_id: string
          raw: any
          video_key: string
          created_at?: string
        }
        Update: {
          id?: string
          senior_id?: string
          raw?: any
          video_key?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          session_id: string
          type: 'PDF' | 'HTML'
          pdf_url: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          type: 'PDF' | 'HTML'
          pdf_url: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          type?: 'PDF' | 'HTML'
          pdf_url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}