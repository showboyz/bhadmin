'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Users, FileText, Calendar, AlertTriangle, LogOut } from 'lucide-react'

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
  const { user, loading, userRoles, rolesLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const orgId = params['org-id'] as string

  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (loading || rolesLoading) {
        console.log('Still loading user or roles...')
        return
      }

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has access to this organization
      const isSuperAdmin = userRoles.some(role => role.role === 'super_admin')
      const hasOrgSpecificAccess = userRoles.some(role => 
        (role.role === 'org_admin' || role.role === 'staff' || role.role === 'viewer') && 
        role.org_id === orgId
      )
      
      const hasOrgAccess = isSuperAdmin || hasOrgSpecificAccess

      console.log('Organization access check:', {
        orgId,
        userRoles,
        isSuperAdmin,
        hasOrgSpecificAccess,
        hasOrgAccess
      })

      if (!hasOrgAccess) {
        console.log('Access denied, redirecting to dashboard')
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
  }, [user, loading, rolesLoading, userRoles, orgId, router])

  if (loading || rolesLoading || isLoading) {
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
    <div className="flex">
      {/* Left Sidebar - 기존 Navigation 컴포넌트와 동일한 스타일 */}
      <nav className="bg-white text-gray-800 h-screen w-64 fixed left-0 top-0 border-r border-gray-200">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src="https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true" 
              alt="Brain Health Playground" 
              className="h-16 w-auto"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 py-6">
          <div className="space-y-1">
            {[
              { href: `/org/${orgId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
              { href: `/org/${orgId}/users`, label: 'User', icon: Users },
              { href: `/org/${orgId}/reports`, label: 'Report', icon: FileText },
              { href: `/org/${orgId}/schedules`, label: 'Schedules', icon: Calendar },
              { href: `/org/${orgId}/monitoring`, label: 'Monitoring', icon: AlertTriangle },
            ].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gray-100 text-gray-900 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          {user && (
            <div className="mb-3 px-3">
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          )}
          <button 
            className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Organization Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600">{organization.org_type} • Organization Dashboard</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Welcome to {organization.name}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}