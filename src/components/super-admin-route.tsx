'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SuperAdminRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuperAdminRoute({ children, fallback }: SuperAdminRouteProps) {
  const { user, loading, rolesLoading, canAccessSuperAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !rolesLoading && user) {
      // Now we can safely check super admin access
      if (!canAccessSuperAdmin()) {
        router.push('/dashboard')
        return
      }
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, rolesLoading, canAccessSuperAdmin, router])

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!user || !canAccessSuperAdmin()) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}