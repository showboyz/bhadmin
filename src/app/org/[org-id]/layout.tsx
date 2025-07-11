'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface OrganizationData {
  id: string
  name: string
  org_type: string
  is_active: boolean
}

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, userRoles } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orgId = params['org-id'] as string

  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has access to this organization
      const hasOrgAccess = userRoles.some(role => 
        (role.role === 'org_admin' || role.role === 'staff' || role.role === 'viewer') && 
        role.org_id === orgId
      ) || userRoles.some(role => role.role === 'super_admin')

      if (!hasOrgAccess) {
        router.push('/dashboard')
        return
      }

      // Fetch organization data
      try {
        const { data: org, error } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', orgId)
          .single()

        if (error || !org) {
          router.push('/dashboard')
          return
        }

        setOrganization(org)
        setHasAccess(true)
      } catch (error) {
        console.error('Error fetching organization:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [user, loading, userRoles, orgId, router])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!hasAccess || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this organization.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Organization Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-sm text-gray-600">{organization.org_type} • Organization Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Welcome, {user.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href={`/org/${orgId}/dashboard`}
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Dashboard
            </a>
            <a
              href={`/org/${orgId}/users`}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Users
            </a>
            <a
              href={`/org/${orgId}/reports`}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Reports
            </a>
            <a
              href={`/org/${orgId}/settings`}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Settings
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}