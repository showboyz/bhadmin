'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface DashboardKPI {
  totalUsers: number
  activeToday: number
  weeklyActive: number
  newUsersThisMonth: number
  inactiveUsersThisWeek: number
  licenseSeatRemaining: number
}

interface UserProgress {
  id: string
  name: string
  currentWeek: string
  progress: string
  status: string
}

interface InactiveUser {
  id: string
  name: string
  daysAgo: string
}

export function useDashboard() {
  const [kpi, setKPI] = useState<DashboardKPI>({
    totalUsers: 0,
    activeToday: 0,
    weeklyActive: 0,
    newUsersThisMonth: 0,
    inactiveUsersThisWeek: 0,
    licenseSeatRemaining: 0
  })
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date ranges
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      // Fetch seniors data
      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .select(`
          *,
          schedules!inner (
            id,
            start_date,
            end_date,
            status,
            sessions_per_week
          )
        `)

      if (seniorsError) throw seniorsError

      // Fetch organization data for license seats
      const { data: orgs, error: orgsError } = await supabase
        .from('organisations')
        .select('licence_seats')
        .limit(1)

      if (orgsError) throw orgsError

      // Fetch recent training results for activity tracking
      const { data: motorResults, error: motorError } = await supabase
        .from('motor_results')
        .select('senior_id, created_at')
        .gte('created_at', weekAgo.toISOString())

      const { data: cognitiveResults, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at')
        .gte('created_at', weekAgo.toISOString())

      if (motorError) throw motorError
      if (cognitiveError) throw cognitiveError

      // Calculate KPI metrics
      const totalUsers = seniors?.length || 0
      const licenseSeats = orgs?.[0]?.licence_seats || 100
      const licenseSeatRemaining = licenseSeats - totalUsers

      // Combine all training results for activity analysis
      const allResults = [
        ...(motorResults || []),
        ...(cognitiveResults || [])
      ]

      // Get unique senior IDs who were active this week
      const activeSeniorIds = new Set(allResults.map(r => r.senior_id))
      const weeklyActive = activeSeniorIds.size

      // Get seniors active today
      const todayResults = allResults.filter(r => {
        const resultDate = new Date(r.created_at)
        const today = new Date()
        return resultDate.toDateString() === today.toDateString()
      })
      const activeTodayIds = new Set(todayResults.map(r => r.senior_id))
      const activeToday = activeTodayIds.size

      // Get new users this month
      const newUsersThisMonth = seniors?.filter(s => {
        const createdDate = new Date(s.created_at)
        return createdDate >= startOfMonth
      }).length || 0

      // Calculate inactive users (seniors with active schedules but no recent activity)
      const activeSeniors = seniors?.filter(s => 
        s.schedules.some((schedule: any) => schedule.status === 'Active')
      ) || []
      
      const inactiveSeniors = activeSeniors.filter(s => !activeSeniorIds.has(s.id))
      const inactiveUsersThisWeek = inactiveSeniors.length

      setKPI({
        totalUsers,
        activeToday,
        weeklyActive,
        newUsersThisMonth,
        inactiveUsersThisWeek,
        licenseSeatRemaining
      })

      // Build user progress data
      const progressData: UserProgress[] = activeSeniors.slice(0, 10).map((senior: any) => {
        const activeSchedule = senior.schedules.find((s: any) => s.status === 'Active')
        const startDate = new Date(activeSchedule?.start_date || senior.created_at)
        const currentWeek = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        
        // Calculate progress (mock for now - would need actual session completion data)
        const sessionsPerWeek = activeSchedule?.sessions_per_week || 3
        const isActive = activeSeniorIds.has(senior.id)
        const mockProgress = isActive ? `${Math.min(sessionsPerWeek, 5)}/${sessionsPerWeek}` : `0/${sessionsPerWeek}`

        return {
          id: senior.id,
          name: senior.name,
          currentWeek: `Week ${currentWeek}`,
          progress: mockProgress,
          status: isActive ? 'Active' : 'Inactive'
        }
      })

      setUserProgress(progressData)

      // Build inactive users data
      const inactiveData: InactiveUser[] = inactiveSeniors.slice(0, 10).map((senior: any) => {
        // Find last activity (mock calculation)
        const daysAgo = Math.floor(Math.random() * 7) + 1 // Mock: 1-7 days
        return {
          id: senior.id,
          name: senior.name,
          daysAgo: `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
        }
      })

      setInactiveUsers(inactiveData)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  return {
    kpi,
    userProgress,
    inactiveUsers,
    loading,
    error,
    refetch: fetchDashboardData
  }
}