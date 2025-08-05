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
  lastActivity: string
}

interface InactiveUser {
  id: string
  name: string
  daysAgo: string
}

interface GenderDistribution {
  male: number
  female: number
  malePercentage: number
  femalePercentage: number
}

interface HealthStatusDistribution {
  excellent: number
  good: number
  fair: number
  poor: number
  excellentPercentage: number
  goodPercentage: number
  fairPercentage: number
  poorPercentage: number
}

export function useDashboard(orgId?: string) {
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
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution>({
    male: 0,
    female: 0,
    malePercentage: 0,
    femalePercentage: 0
  })
  const [healthStatusDistribution, setHealthStatusDistribution] = useState<HealthStatusDistribution>({
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    excellentPercentage: 0,
    goodPercentage: 0,
    fairPercentage: 0,
    poorPercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date ranges
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      // Simple approach: Just get seniors directly
      console.log('🔍 Dashboard fetching seniors for orgId:', orgId)
      
      let seniorsQuery = supabase
        .from('seniors')
        .select('*')

      if (orgId) {
        seniorsQuery = seniorsQuery.eq('org_id', orgId)
        console.log('🔍 Applied org filter for:', orgId)
      }

      console.log('🔍 About to execute seniors query...')
      const { data: seniors, error: seniorsError } = await seniorsQuery
      console.log('🔍 Seniors query completed:', { seniors, seniorsError })

      if (seniorsError) throw seniorsError

      // Debug: Log the actual data received
      console.log('🔍 Dashboard seniors data:', {
        count: seniors?.length || 0,
        seniors: seniors?.map((s: any) => ({ id: s.id, name: s.name })) || []
      })

      // Get organization data for license seats
      let orgsQuery = supabase
        .from('organisations')
        .select('licence_seats')

      if (orgId) {
        orgsQuery = orgsQuery.eq('id', orgId)
      } else {
        orgsQuery = orgsQuery.limit(1)
      }

      const { data: orgs, error: orgsError } = await orgsQuery

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
      const newUsersThisMonth = seniors?.filter((s: any) => {
        const createdDate = new Date(s.created_at)
        return createdDate >= startOfMonth
      }).length || 0

      // Calculate inactive users (all seniors who haven't been active recently)
      const inactiveSeniors = seniors?.filter((s: any) => !activeSeniorIds.has(s.id)) || []
      const inactiveUsersThisWeek = inactiveSeniors.length

      setKPI({
        totalUsers,
        activeToday,
        weeklyActive,
        newUsersThisMonth,
        inactiveUsersThisWeek,
        licenseSeatRemaining
      })

      // Build recent user progress data - get users with most recent training activity
      const seniorsWithLastActivity = seniors?.map((senior: any) => {
        // Find most recent activity for this senior
        const seniorResults = allResults.filter(r => r.senior_id === senior.id)
        const lastActivity = seniorResults.length > 0 
          ? Math.max(...seniorResults.map(r => new Date(r.created_at).getTime()))
          : new Date(senior.created_at).getTime()
          
        return {
          ...senior,
          lastActivityTime: lastActivity,
          recentActivityCount: seniorResults.length
        }
      })
      
      // Sort by most recent activity and take top 5
      const recentActiveUsers = seniorsWithLastActivity
        .sort((a: any, b: any) => b.lastActivityTime - a.lastActivityTime)
        .slice(0, 5)
      
      const progressData: UserProgress[] = recentActiveUsers.map((senior: any) => {
        // Simplified without schedule complexity
        const startDate = new Date(senior.created_at)
        const currentWeek = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        
        // Calculate days since last activity
        const daysSinceLastActivity = Math.floor((Date.now() - senior.lastActivityTime) / (24 * 60 * 60 * 1000))
        const lastActivityText = daysSinceLastActivity === 0 ? 'Today' : 
                               daysSinceLastActivity === 1 ? '1 day ago' : 
                               `${daysSinceLastActivity} days ago`
        
        // Simple session count this week
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        
        const thisWeekResults = allResults.filter(r => 
          r.senior_id === senior.id && new Date(r.created_at) >= weekStart
        )
        const completedThisWeek = thisWeekResults.length
        
        return {
          id: senior.id,
          name: senior.name,
          currentWeek: `Week ${Math.max(1, currentWeek)}`,
          progress: `${completedThisWeek} sessions`,
          status: daysSinceLastActivity <= 1 ? 'Active' : daysSinceLastActivity <= 3 ? 'Recent' : 'Inactive',
          lastActivity: lastActivityText
        }
      })

      setUserProgress(progressData)

      // Build inactive users data (3+ days no activity)
      const inactiveUsersData = seniors?.map((senior: any) => {
        // Find most recent activity for this senior
        const seniorResults = allResults.filter(r => r.senior_id === senior.id)
        const lastActivity = seniorResults.length > 0 
          ? Math.max(...seniorResults.map(r => new Date(r.created_at).getTime()))
          : new Date(senior.created_at).getTime()
          
        const daysSinceLastActivity = Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000))
        
        return {
          ...senior,
          lastActivityTime: lastActivity,
          daysSinceLastActivity
        }
      }).filter((senior: any) => senior.daysSinceLastActivity >= 3) // Only users inactive for 3+ days
      
      const inactiveData: InactiveUser[] = inactiveUsersData
        .sort((a: any, b: any) => b.daysSinceLastActivity - a.daysSinceLastActivity) // Sort by most inactive first
        .slice(0, 10)
        .map((senior: any) => ({
          id: senior.id,
          name: senior.name,
          daysAgo: `${senior.daysSinceLastActivity} day${senior.daysSinceLastActivity > 1 ? 's' : ''} ago`
        }))

      setInactiveUsers(inactiveData)

      // Calculate Gender Distribution
      const maleCount = seniors?.filter((s: any) => s.gender_enum === 'M').length || 0
      const femaleCount = seniors?.filter((s: any) => s.gender_enum === 'F').length || 0
      const totalGender = maleCount + femaleCount
      
      setGenderDistribution({
        male: maleCount,
        female: femaleCount,
        malePercentage: totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0,
        femalePercentage: totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0
      })

      // Calculate Health Status Distribution
      const excellentCount = seniors?.filter((s: any) => s.health_status === 'Excellent').length || 0
      const goodCount = seniors?.filter((s: any) => s.health_status === 'Good').length || 0
      const fairCount = seniors?.filter((s: any) => s.health_status === 'Fair').length || 0
      const poorCount = seniors?.filter((s: any) => s.health_status === 'Poor').length || 0
      const totalHealth = excellentCount + goodCount + fairCount + poorCount
      
      setHealthStatusDistribution({
        excellent: excellentCount,
        good: goodCount,
        fair: fairCount,
        poor: poorCount,
        excellentPercentage: totalHealth > 0 ? Math.round((excellentCount / totalHealth) * 100) : 0,
        goodPercentage: totalHealth > 0 ? Math.round((goodCount / totalHealth) * 100) : 0,
        fairPercentage: totalHealth > 0 ? Math.round((fairCount / totalHealth) * 100) : 0,
        poorPercentage: totalHealth > 0 ? Math.round((poorCount / totalHealth) * 100) : 0
      })

      console.log('🔍 Gender Distribution:', { maleCount, femaleCount })
      console.log('🔍 Health Status Distribution:', { excellentCount, goodCount, fairCount, poorCount })

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
  }, [user, orgId])

  return {
    kpi,
    userProgress,
    inactiveUsers,
    genderDistribution,
    healthStatusDistribution,
    loading,
    error,
    refetch: fetchDashboardData
  }
}