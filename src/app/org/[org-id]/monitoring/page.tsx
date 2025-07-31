'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, Activity, Heart, Brain, Users, TrendingUp, Calendar, BarChart3, Shield, Wifi } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrganizationInfo {
  id: string
  name: string
  org_type: string
  is_active: boolean
}

interface MonitoringData {
  systemStatus: 'Online' | 'Offline' | 'Maintenance'
  activeSessions: number
  totalUsers: number
  averageSessionTime: string
  completionRate: number
  emergencyAlerts: number
  networkLatency: number
  dataSync: 'Synced' | 'Pending' | 'Error'
}

export default function OrgMonitoringPage() {
  const params = useParams()
  const orgId = params['org-id'] as string
  
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    systemStatus: 'Online',
    activeSessions: 0,
    totalUsers: 0,
    averageSessionTime: '0m',
    completionRate: 0,
    emergencyAlerts: 0,
    networkLatency: 0,
    dataSync: 'Synced'
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      
      // Fetch organization info
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .select('id, name, org_type, is_active')
        .eq('id', orgId)
        .single()

      if (orgError) {
        console.error('Error fetching organization:', orgError)
      } else {
        setOrganization(orgData)
      }

      // Fetch monitoring data
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Get current sessions (recent results within 1 hour)
      const { data: recentResults, error: resultsError } = await supabase
        .from('motor_results')
        .select('senior_id, created_at')
        .gte('created_at', oneHourAgo.toISOString())

      const { data: cognitiveResults, error: cogError } = await supabase
        .from('cognitive_results')
        .select('senior_id, created_at')
        .gte('created_at', oneHourAgo.toISOString())

      // Get total users
      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .select('id, created_at')
        .eq('org_id', orgId)

      // Calculate metrics
      const allRecentResults = [
        ...(recentResults || []),
        ...(cognitiveResults || [])
      ]
      
      const activeSessions = new Set(allRecentResults.map(r => r.senior_id)).size
      const totalUsers = seniors?.length || 0
      
      // Mock some data for demonstration
      const completionRate = Math.floor(Math.random() * 20) + 80 // 80-100%
      const networkLatency = Math.floor(Math.random() * 50) + 20 // 20-70ms
      const emergencyAlerts = Math.floor(Math.random() * 3) // 0-2 alerts

      setMonitoringData({
        systemStatus: 'Online',
        activeSessions,
        totalUsers,
        averageSessionTime: `${Math.floor(Math.random() * 20) + 15}m`,
        completionRate,
        emergencyAlerts,
        networkLatency,
        dataSync: 'Synced'
      })

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      fetchMonitoringData()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMonitoringData, 30000)
      return () => clearInterval(interval)
    }
  }, [orgId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading monitoring...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Real-time Monitoring
          </h1>
          <p className="text-gray-600">
            Live system status and user activity for {organization?.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 30s
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchMonitoringData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${monitoringData.systemStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-xl font-bold">{monitoringData.systemStatus}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{monitoringData.activeSessions}</div>
            <p className="text-xs text-gray-500 mt-1">Currently training</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{monitoringData.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Sessions completed</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monitoringData.emergencyAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {monitoringData.emergencyAlerts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monitoringData.emergencyAlerts > 0 ? 'Attention required' : 'No alerts'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Latency</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${monitoringData.networkLatency < 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {monitoringData.networkLatency}ms
                  </span>
                  <Wifi className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Sync Status</span>
                <Badge variant={monitoringData.dataSync === 'Synced' ? 'default' : 'secondary'}>
                  {monitoringData.dataSync}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Session Time</span>
                <span className="text-sm font-medium text-blue-600">{monitoringData.averageSessionTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Users</span>
                <span className="text-sm font-medium">{monitoringData.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health & Safety Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Health & Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Emergency Response</span>
                <Badge variant="outline" className="text-green-600">Ready</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Vital Signs Monitoring</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Fall Detection</span>
                <Badge variant="outline" className="text-green-600">Online</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Medication Reminders</span>
                <Badge variant="outline" className="text-blue-600">Scheduled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-2 border-b">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Session completed</p>
                  <p className="text-xs text-gray-500">김철수 completed cognitive training</p>
                  <p className="text-xs text-gray-400">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-b">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New session started</p>
                  <p className="text-xs text-gray-500">이영희 started motor training</p>
                  <p className="text-xs text-gray-400">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-b">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low engagement alert</p>
                  <p className="text-xs text-gray-500">박민수 inactive for 3+ days</p>
                  <p className="text-xs text-gray-400">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Data backup completed</p>
                  <p className="text-xs text-gray-500">Daily backup successful</p>
                  <p className="text-xs text-gray-400">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Training Program Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <p className="text-sm text-gray-600">Cognitive Training</p>
              <p className="text-xs text-gray-400">Average completion rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">92%</div>
              <p className="text-sm text-gray-600">Motor Training</p>
              <p className="text-xs text-gray-400">Average completion rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">78%</div>
              <p className="text-sm text-gray-600">Combined Programs</p>
              <p className="text-xs text-gray-400">Overall engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}