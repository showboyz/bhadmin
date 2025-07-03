'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

export function useSchedules() {
  const [schedules, setSchedules] = useState<(Schedule & {
    seniors: {
      id: string
      name: string
    }
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          seniors (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (scheduleData: ScheduleInsert) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select(`
          *,
          seniors (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      
      // Refresh the list
      await fetchSchedules()
      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create schedule' 
      }
    }
  }

  const updateSchedule = async (id: string, updates: ScheduleUpdate) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          seniors (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      
      // Refresh the list
      await fetchSchedules()
      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update schedule' 
      }
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Refresh the list
      await fetchSchedules()
      return { error: null }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Failed to delete schedule' 
      }
    }
  }

  const getSchedulesByDateRange = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          seniors (
            id,
            name
          )
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .eq('status', 'Active')

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch schedules' 
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchSchedules()
    }
  }, [user])

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByDateRange,
    refetch: fetchSchedules
  }
}