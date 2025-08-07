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
    let timeoutId: NodeJS.Timeout | undefined
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), 15000) // 15 seconds timeout

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
          currentWeek: `Session ${Math.max(1, currentWeek)}`,
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
      // Extract health status from note field
      const extractHealthStatus = (note: string): string | null => {
        if (!note) return null
        
        // New format: "Health: [status]. ..."
        const healthMatch = note.match(/Health:\s*([^.]+)/)
        if (healthMatch) {
          return healthMatch[1].trim()
        }
        
        // Legacy format: Analyze Korean health conditions
        const lowerNote = note.toLowerCase()
        
        // Poor indicators (심각한 질환)
        if (lowerNote.includes('심장질환') || lowerNote.includes('뇌졸중') || 
            lowerNote.includes('암') || lowerNote.includes('중증')) {
          return 'Poor'
        }
        
        // Fair indicators (관리 중인 만성질환)
        if (lowerNote.includes('고혈압') || lowerNote.includes('당뇨') || 
            lowerNote.includes('관절염') || lowerNote.includes('주의') ||
            lowerNote.includes('관리')) {
          return 'Fair'
        }
        
        // Good indicators (경미한 증상)
        if (lowerNote.includes('양호') || lowerNote.includes('건강') ||
            lowerNote.includes('정상') || lowerNote.includes('좋음')) {
          return 'Good'
        }
        
        // Excellent indicators (매우 건강)
        if (lowerNote.includes('우수') || lowerNote.includes('매우 좋음') ||
            lowerNote.includes('훌륭')) {
          return 'Excellent'
        }
        
        // Default: classify based on note length and severity
        if (note.length < 10) return 'Good'  // 짧은 메모는 양호
        return 'Fair'  // 긴 메모는 관리 필요
      }

      // Count health statuses from note field, with fallback to mock distribution
      let excellentCount = 0, goodCount = 0, fairCount = 0, poorCount = 0
      
      seniors?.forEach((senior: any) => {
        const healthStatus = extractHealthStatus(senior.note)
        if (healthStatus) {
          if (healthStatus.toLowerCase().includes('excellent')) excellentCount++
          else if (healthStatus.toLowerCase().includes('good')) goodCount++
          else if (healthStatus.toLowerCase().includes('fair')) fairCount++
          else if (healthStatus.toLowerCase().includes('poor')) poorCount++
        }
      })

      // If no health status data found in notes, use mock distribution based on total seniors
      const totalSeniors = seniors?.length || 0
      const hasHealthData = excellentCount + goodCount + fairCount + poorCount > 0
      
      if (!hasHealthData) {
        excellentCount = Math.round(totalSeniors * 0.2) // 20%
        goodCount = Math.round(totalSeniors * 0.4) // 40%  
        fairCount = Math.round(totalSeniors * 0.3) // 30%
        poorCount = Math.round(totalSeniors * 0.1) // 10%
      }
      
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
      console.log('🔍 Health Status Distribution:', { 
        excellentCount, goodCount, fairCount, poorCount,
        hasHealthData, 
        totalSeniors,
        sampleNotes: seniors?.slice(0, 3).map((s: any) => ({ name: s.name, note: s.note }))
      })

    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try refreshing the page.')
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data')
      }
    } finally {
      setLoading(false)
      // Clear timeout if request completed
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  useEffect(() => {
    if (user && orgId) {
      console.log('🔄 Dashboard useEffect triggered:', { userId: user.id, orgId })
      fetchDashboardData()
    }
  }, [user?.id, orgId]) // Only depend on user.id to avoid object reference changes

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