'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Users, Activity, TrendingUp, AlertTriangle, CheckCircle, Database } from 'lucide-react'
import Link from 'next/link'

interface SystemStats {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalSeniors: number
  totalSessions: number
  licenseUtilization: number
}

interface OrganizationOverview {
  id: string
  name: string
  totalSeniors: number
  licenseLimit: number
  utilization: number
  subscriptionPlan: string
  isActive: boolean
  lastActivity: string
}

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SystemStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalSeniors: 0,
    totalSessions: 0,
    licenseUtilization: 0,
  })
  const [orgOverview, setOrgOverview] = useState<OrganizationOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchSystemStats()
      fetchRecentActivity()
      fetchOrganizationOverview()
      fetchSystemAlerts()
    }
  }, [user])

  const fetchSystemStats = async () => {
    try {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organisations')
        .select('id, is_active, licence_seats')

      if (orgsError) throw orgsError

      // Fetch seniors
      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .select('id, org_id')

      if (seniorsError) throw seniorsError

      // Fetch user roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')

      if (userRolesError) throw userRolesError

      // Fetch motor and cognitive results
      const { data: motorResults, error: motorError } = await supabase
        .from('motor_results')
        .select('id')

      const { data: cognitiveResults, error: cognitiveError } = await supabase
        .from('cognitive_results')
        .select('id')

      if (motorError || cognitiveError) {
        console.error('Error fetching results:', motorError || cognitiveError)
      }

      // Calculate stats
      const totalOrganizations = orgs?.length || 0
      const activeOrganizations = orgs?.filter(org => org.is_active)?.length || 0
      const totalUsers = new Set(userRoles?.map(role => role.user_id))?.size || 0
      const totalSeniors = seniors?.length || 0
      const totalSessions = (motorResults?.length || 0) + (cognitiveResults?.length || 0)
      
      // Calculate license utilization
      const totalLicenseSeats = orgs?.reduce((sum, org) => sum + (org.licence_seats || 0), 0) || 0
      const licenseUtilization = totalLicenseSeats > 0 ? (totalSeniors / totalLicenseSeats) * 100 : 0

      setStats({
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalSeniors,
        totalSessions,
        licenseUtilization,
      })
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizationOverview = async () => {
    try {
      // Fetch organizations with their stats
      const { data: orgs, error: orgsError } = await supabase
        .from('organisations')
        .select(`
          id,
          name,
          licence_seats,
          is_active,
          created_at,
          organization_settings (
            subscription_plan,
            license_limit
          )
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Fetch senior counts for each org
      const { data: seniors, error: seniorsError } = await supabase
        .from('seniors')
        .select('org_id, created_at')

      if (seniorsError) throw seniorsError

      // Calculate overview data
      const overview = orgs?.map(org => {
        const seniorCount = seniors?.filter(s => s.org_id === org.id).length || 0
        const licenseLimit = org.organization_settings?.[0]?.license_limit || org.licence_seats || 0
        const utilization = licenseLimit > 0 ? (seniorCount / licenseLimit) * 100 : 0
        
        // Get most recent senior activity
        const orgSeniors = seniors?.filter(s => s.org_id === org.id)
        const lastActivity = orgSeniors?.length > 0 
          ? new Date(Math.max(...orgSeniors.map(s => new Date(s.created_at).getTime()))).toISOString()
          : org.created_at

        return {
          id: org.id,
          name: org.name,
          totalSeniors: seniorCount,
          licenseLimit,
          utilization,
          subscriptionPlan: org.organization_settings?.[0]?.subscription_plan || 'basic',
          isActive: org.is_active,
          lastActivity
        }
      }) || []

      setOrgOverview(overview)
    } catch (error) {
      console.error('Error fetching organization overview:', error)
    }
  }

  const fetchSystemAlerts = async () => {
    try {
      const alerts = []
      
      // Check for high license utilization
      orgOverview.forEach(org => {
        if (org.utilization > 90) {
          alerts.push({
            id: `license-${org.id}`,
            type: 'warning',
            title: 'License Limit Exceeded',
            message: `${org.name} is at ${org.utilization.toFixed(1)}% capacity`,
            action: `/super-admin/organizations/${org.id}`
          })
        }
      })

      // Check for inactive organizations
      const inactiveOrgs = orgOverview.filter(org => !org.isActive)
      if (inactiveOrgs.length > 0) {
        alerts.push({
          id: 'inactive-orgs',
          type: 'info',
          title: 'Inactive Organizations',
          message: `${inactiveOrgs.length} organizations are currently inactive`,
          action: '/super-admin/organizations'
        })
      }

      setSystemAlerts(alerts)
    } catch (error) {
      console.error('Error generating system alerts:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent activity from multiple sources
      const activities = []

      // Recent organizations
      const { data: recentOrgs, error: orgsError } = await supabase
        .from('organisations')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      if (!orgsError && recentOrgs) {
        recentOrgs.forEach(org => {
          activities.push({
            id: `org-${org.id}`,
            type: 'organization',
            title: 'New Organization Created',
            description: org.name,
            timestamp: org.created_at
          })
        })
      }

      // Recent seniors
      const { data: recentSeniors, error: seniorsError } = await supabase
        .from('seniors')
        .select(`
          id,
          name,
          created_at,
          organisations (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!seniorsError && recentSeniors) {
        recentSeniors.forEach(senior => {
          activities.push({
            id: `senior-${senior.id}`,
            type: 'senior',
            title: 'New Senior Enrolled',
            description: `${senior.name} at ${senior.organisations?.name}`,
            timestamp: senior.created_at
          })
        })
      }

      // Sort by timestamp and take most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, Super Admin! 👨‍💼
            </h1>
            <p className="text-gray-600 mt-1">
              Hello {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Administrator'}, 
              manage all organizations and system settings from your control center
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              🔒 System Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600">Monitor all organizations and platform metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            All Systems Operational
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/super-admin/sync"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Database className="h-4 w-4" />
              DynamoDB Sync
            </Link>
            <Link 
              href="/super-admin/organizations/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Building2 className="h-4 w-4" />
              New Organization
            </Link>
          </div>
        </div>
      </div>

      {/* System-wide Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Organizations</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalOrganizations}</p>
              <p className="text-sm text-blue-600">
                {stats.activeOrganizations} active • {stats.totalOrganizations - stats.activeOrganizations} inactive
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">System Users</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600">Across all organizations</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Seniors</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalSeniors}</p>
              <p className="text-sm text-purple-600">Platform-wide enrollment</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-lg p-6 border ${
          stats.licenseUtilization > 80 
            ? 'from-red-50 to-red-100 border-red-200' 
            : stats.licenseUtilization > 60 
              ? 'from-yellow-50 to-yellow-100 border-yellow-200' 
              : 'from-green-50 to-green-100 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                stats.licenseUtilization > 80 ? 'text-red-700' : 
                stats.licenseUtilization > 60 ? 'text-yellow-700' : 'text-green-700'
              }`}>Global License Usage</p>
              <p className={`text-3xl font-bold ${
                stats.licenseUtilization > 80 ? 'text-red-900' : 
                stats.licenseUtilization > 60 ? 'text-yellow-900' : 'text-green-900'
              }`}>{stats.licenseUtilization.toFixed(1)}%</p>
              <p className={`text-sm ${
                stats.licenseUtilization > 80 ? 'text-red-600' : 
                stats.licenseUtilization > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>{stats.totalSessions} training sessions</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              stats.licenseUtilization > 80 ? 'bg-red-200' : 
              stats.licenseUtilization > 60 ? 'bg-yellow-200' : 'bg-green-200'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                stats.licenseUtilization > 80 ? 'text-red-700' : 
                stats.licenseUtilization > 60 ? 'text-yellow-700' : 'text-green-700'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Overview */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Organizations Overview</h3>
          <Link 
            href="/super-admin/organizations"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seniors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orgOverview.slice(0, 5).map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-xs text-gray-500">ID: {org.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      org.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {org.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {org.totalSeniors} / {org.licenseLimit}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            org.utilization > 90 ? 'bg-red-500' :
                            org.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(org.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{org.utilization.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {org.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/super-admin/organizations/${org.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Platform Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'organization' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'organization' ? (
                        <Building2 className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Users className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
          </div>
          <div className="p-6">
            {systemAlerts.length > 0 ? (
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-lg ${
                    alert.type === 'warning' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'warning' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.type === 'warning' ? 'text-red-900' : 'text-blue-900'
                      }`}>{alert.title}</p>
                      <p className={`text-sm ${
                        alert.type === 'warning' ? 'text-red-700' : 'text-blue-700'
                      }`}>{alert.message}</p>
                      {alert.action && (
                        <Link 
                          href={alert.action}
                          className={`text-sm font-medium hover:underline ${
                            alert.type === 'warning' ? 'text-red-800' : 'text-blue-800'
                          }`}
                        >
                          Take Action →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">All systems running smoothly</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}