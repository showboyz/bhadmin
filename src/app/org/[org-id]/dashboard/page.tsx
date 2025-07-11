'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Calendar, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrganizationStats {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  avgSessionDuration: number
}

export default function OrgDashboardPage() {
  const params = useParams()
  const orgId = params['org-id'] as string
  
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    avgSessionDuration: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch organization-specific user count
        const { data: orgUsers, error: usersError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('org_id', orgId)
          .neq('role', 'super_admin')

        if (usersError) {
          console.error('Error fetching users:', usersError)
        }

        // For now, use mock data for other stats
        // In a real app, you'd fetch this from your analytics tables
        setStats({
          totalUsers: orgUsers?.length || 0,
          activeUsers: Math.floor((orgUsers?.length || 0) * 0.8), // 80% active assumption
          totalSessions: (orgUsers?.length || 0) * 5, // Mock: 5 sessions per user
          avgSessionDuration: 25 // Mock: 25 minutes average
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchStats()
    }
  }, [orgId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization Dashboard</h2>
        <p className="text-gray-600">Overview of your organization's activity and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered organization members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active in the last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSessionDuration}min</div>
            <p className="text-xs text-muted-foreground">
              Average duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">New user registration</p>
                <p className="text-sm text-gray-600">john.doe@example.com joined the organization</p>
              </div>
              <Badge variant="outline">2 hours ago</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Exercise session completed</p>
                <p className="text-sm text-gray-600">15 members completed their daily exercises</p>
              </div>
              <Badge variant="outline">4 hours ago</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Weekly report generated</p>
                <p className="text-sm text-gray-600">Organization performance summary available</p>
              </div>
              <Badge variant="outline">1 day ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}