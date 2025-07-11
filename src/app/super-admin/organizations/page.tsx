'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  licence_seats: number
  contact_email: string | null
  contact_phone: string | null
  address: any
  is_active: boolean
  created_at: string
  updated_at: string
  _count?: {
    seniors: number
    users: number
  }
  settings?: {
    subscription_plan: string
    license_limit: number
    org_type: string
  }
}

export default function OrganizationsPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchOrganizations()
    }
  }, [user])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      
      // Fetch organizations with their settings
      const { data: orgs, error: orgsError } = await supabase
        .from('organisations')
        .select(`
          *,
          organization_settings (
            subscription_plan,
            license_limit,
            org_type
          )
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Fetch senior counts for each organization
      const { data: seniorCounts, error: seniorsError } = await supabase
        .from('seniors')
        .select('org_id')

      if (seniorsError) throw seniorsError

      // Fetch user counts for each organization
      const { data: userCounts, error: usersError } = await supabase
        .from('user_roles')
        .select('org_id')
        .not('org_id', 'is', null)

      if (usersError) throw usersError

      // Calculate counts
      const seniorCountMap = seniorCounts?.reduce((acc, senior) => {
        acc[senior.org_id] = (acc[senior.org_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const userCountMap = userCounts?.reduce((acc, user) => {
        if (user.org_id) {
          acc[user.org_id] = (acc[user.org_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      // Combine data
      const organizationsWithCounts = orgs?.map(org => ({
        ...org,
        _count: {
          seniors: seniorCountMap[org.id] || 0,
          users: userCountMap[org.id] || 0,
        },
        settings: org.organization_settings?.[0] || null
      })) || []

      setOrganizations(organizationsWithCounts)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (orgId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({ is_active: !currentStatus })
        .eq('id', orgId)

      if (error) throw error

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === orgId 
            ? { ...org, is_active: !currentStatus }
            : org
        )
      )
    } catch (error) {
      console.error('Error updating organization status:', error)
    }
  }

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId))
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && org.is_active) ||
                         (filterStatus === 'inactive' && !org.is_active)

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getUtilizationStatus = (seniors: number, licenseLimit: number) => {
    const utilization = licenseLimit > 0 ? (seniors / licenseLimit) * 100 : 0
    
    if (utilization > 90) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
    if (utilization > 70) return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle }
    return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <Link 
          href="/super-admin/organizations/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seniors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrganizations.map((org) => {
                const licenseLimit = org.settings?.license_limit || org.licence_seats || 0
                const utilization = getUtilizationStatus(org._count?.seniors || 0, licenseLimit)
                const UtilizationIcon = utilization.icon

                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {org.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {org.contact_email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(org.is_active)}
                        <span className={`text-sm font-medium ${
                          org.is_active ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {org._count?.users || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {org._count?.seniors || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-12 rounded-full ${utilization.bg}`}>
                          <div 
                            className={`h-full rounded-full ${utilization.color.replace('text-', 'bg-')}`}
                            style={{ 
                              width: `${Math.min(((org._count?.seniors || 0) / Math.max(licenseLimit, 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${utilization.color}`}>
                          {org._count?.seniors || 0}/{licenseLimit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {org.settings?.subscription_plan || 'basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/super-admin/organizations/${org.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Manage
                        </Link>
                        <Link
                          href={`/super-admin/organizations/${org.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(org.id, org.is_active)}
                          className={`${org.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {org.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(org.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first organization.'
            }
          </p>
          <Link 
            href="/super-admin/organizations/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Link>
        </div>
      )}
    </div>
  )
}