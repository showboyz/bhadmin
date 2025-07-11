'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Activity, Heart, Brain } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrganizationInfo {
  id: string
  name: string
  org_type: string
  is_active: boolean
}

export default function OrgMonitoringPage() {
  const params = useParams()
  const orgId = params['org-id'] as string
  
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
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
            Monitoring
          </h1>
          <p className="text-gray-600">
            Real-time health and activity monitoring for {organization?.name}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">24</div>
            <p className="text-xs text-gray-500 mt-1">Users currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-gray-500 mt-1">Attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-gray-500 mt-1">No critical issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">User login activity</span>
                <span className="text-sm text-green-600">Normal</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Training session completion</span>
                <span className="text-sm text-green-600">Normal</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Data synchronization</span>
                <span className="text-sm text-green-600">Normal</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">System performance</span>
                <span className="text-sm text-green-600">Optimal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-2 border-b">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low engagement detected</p>
                  <p className="text-xs text-gray-500">3 users haven't logged in for 7+ days</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-b">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Scheduled maintenance reminder</p>
                  <p className="text-xs text-gray-500">System maintenance scheduled for tomorrow</p>
                  <p className="text-xs text-gray-400">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Backup completed successfully</p>
                  <p className="text-xs text-gray-500">Daily data backup completed</p>
                  <p className="text-xs text-gray-400">8 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}