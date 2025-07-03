'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

type Senior = Database['public']['Tables']['seniors']['Row']
type SeniorInsert = Database['public']['Tables']['seniors']['Insert']
type SeniorUpdate = Database['public']['Tables']['seniors']['Update']

export function useSeniors() {
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchSeniors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('seniors')
        .select(`
          *,
          schedules (
            id,
            start_date,
            end_date,
            sessions_per_week,
            status
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSeniors(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createSenior = async (seniorData: SeniorInsert) => {
    try {
      const { data, error } = await supabase
        .from('seniors')
        .insert(seniorData)
        .select()
        .single()

      if (error) throw error
      
      // Refresh the list
      await fetchSeniors()
      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create senior' 
      }
    }
  }

  const updateSenior = async (id: string, updates: SeniorUpdate) => {
    try {
      const { data, error } = await supabase
        .from('seniors')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Refresh the list
      await fetchSeniors()
      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update senior' 
      }
    }
  }

  const deleteSenior = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seniors')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Refresh the list
      await fetchSeniors()
      return { error: null }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Failed to delete senior' 
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchSeniors()
    }
  }, [user])

  return {
    seniors,
    loading,
    error,
    createSenior,
    updateSenior,
    deleteSenior,
    refetch: fetchSeniors
  }
}