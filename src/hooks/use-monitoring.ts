'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface MissedSession {
  senior_id: string
  senior_name: string
  phone: string | null
  guardian_phone: string | null
  last_session_date: string | null
  days_since_last: number
  scheduled_sessions_per_week: number
  expected_sessions_this_week: number
  completed_sessions_this_week: number
  missed_sessions: number
  schedule_status: 'Active' | 'Completed' | 'Cancelled'
}

interface MonitoringStats {
  total_active_seniors: number
  seniors_with_missed_sessions: number
  total_missed_sessions: number
  avg_completion_rate: number
}

export function useMonitoring() {
  const [missedSessions, setMissedSessions] = useState<MissedSession[]>([])
  const [stats, setStats] = useState<MonitoringStats>({
    total_active_seniors: 0,
    seniors_with_missed_sessions: 0,
    total_missed_sessions: 0,
    avg_completion_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date and week boundaries
      const now = new Date()
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      // Fetch active seniors with their schedules
      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .select(`
          id,
          name,
          phone,
          guardian_phone,
          schedules!inner (
            id,
            sessions_per_week,
            status,
            start_date,
            end_date
          )
        `)
        .eq('schedules.status', 'Active')

      if (seniorsError) throw seniorsError

      // Fetch this week's training results
      const { data: motorResults, error: motorError } = await supabase
        .from('motor_results')
        .select('senior_id, created_at')
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString())

      const { data: cognitiveResults, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at')
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString())

      if (motorError) throw motorError
      if (cognitiveError) throw cognitiveError

      // Fetch last session data for each senior
      const seniorIds = seniors?.map(s => s.id) || []
      const lastSessionPromises = seniorIds.map(async (seniorId) => {
        const [motorLast, cognitiveLast] = await Promise.all([
          supabase
            .from('motor_results')
            .select('created_at')
            .eq('senior_id', seniorId)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('cognitive_results')
            .select('created_at')
            .eq('senior_id', seniorId)
            .order('created_at', { ascending: false })
            .limit(1)
        ])

        const allSessions = [
          ...(motorLast.data || []),
          ...(cognitiveLast.data || [])
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return {
          senior_id: seniorId,
          last_session: allSessions[0]?.created_at || null
        }
      })

      const lastSessions = await Promise.all(lastSessionPromises)

      // Combine all results for this week's activity
      const allThisWeekResults = [
        ...(motorResults || []),
        ...(cognitiveResults || [])
      ]

      // Calculate missed sessions for each senior
      const missedSessionsData: MissedSession[] = (seniors || []).map((senior: any) => {
        const schedule = senior.schedules[0] // Assuming one active schedule per senior
        const sessionsPerWeek = schedule?.sessions_per_week || 0
        
        // Count completed sessions this week for this senior
        const completedThisWeek = allThisWeekResults.filter(
          result => result.senior_id === senior.id
        ).length

        // Calculate missed sessions
        const expectedSessions = sessionsPerWeek
        const missedSessions = Math.max(0, expectedSessions - completedThisWeek)

        // Get last session date
        const lastSessionData = lastSessions.find(ls => ls.senior_id === senior.id)
        const lastSessionDate = lastSessionData?.last_session || null
        
        // Calculate days since last session
        const daysSinceLast = lastSessionDate 
          ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999 // High number if no sessions found

        return {
          senior_id: senior.id,
          senior_name: senior.name,
          phone: senior.phone,
          guardian_phone: senior.guardian_phone,
          last_session_date: lastSessionDate,
          days_since_last: daysSinceLast,
          scheduled_sessions_per_week: sessionsPerWeek,
          expected_sessions_this_week: expectedSessions,
          completed_sessions_this_week: completedThisWeek,
          missed_sessions: missedSessions,
          schedule_status: schedule?.status || 'Active'
        }
      })

      // Filter to only show seniors with missed sessions or long inactivity
      const filteredMissedSessions = missedSessionsData.filter(
        session => session.missed_sessions > 0 || session.days_since_last > 3
      )

      // Calculate statistics
      const totalActiveSeniors = seniors?.length || 0
      const seniorsWithMissedSessions = filteredMissedSessions.length
      const totalMissedSessions = filteredMissedSessions.reduce(
        (sum, session) => sum + session.missed_sessions, 0
      )
      const totalCompletedSessions = missedSessionsData.reduce(
        (sum, session) => sum + session.completed_sessions_this_week, 0
      )
      const totalExpectedSessions = missedSessionsData.reduce(
        (sum, session) => sum + session.expected_sessions_this_week, 0
      )
      const avgCompletionRate = totalExpectedSessions > 0 
        ? (totalCompletedSessions / totalExpectedSessions) * 100 
        : 0

      setMissedSessions(filteredMissedSessions)
      setStats({
        total_active_seniors: totalActiveSeniors,
        seniors_with_missed_sessions: seniorsWithMissedSessions,
        total_missed_sessions: totalMissedSessions,
        avg_completion_rate: Math.round(avgCompletionRate)
      })

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMonitoringData()
    }
  }, [user])

  return {
    missedSessions,
    stats,
    loading,
    error,
    refetch: fetchMonitoringData
  }
}