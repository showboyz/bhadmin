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
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const checkSuperAdminAccess = () => {
      if (loading || rolesLoading) {
        console.log('SuperAdminRoute: Still loading auth or roles...')
        return
      }

      if (!user) {
        console.log('SuperAdminRoute: No user found, redirecting to login')
        router.push('/login')
        return
      }

      // If user exists but canAccessSuperAdmin returns false, it might be because roles haven't loaded yet
      if (!canAccessSuperAdmin() && retryCount < 10) {
        console.log(`SuperAdminRoute: Roles not loaded yet, retrying... (attempt ${retryCount + 1}/10)`)
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          checkSuperAdminAccess()
        }, 1500)
        return
      }

      // After max retries, if still no super admin access, redirect to login
      if (!canAccessSuperAdmin() && retryCount >= 10) {
        console.log('SuperAdminRoute: Max retries reached, no super admin access, redirecting to login')
        router.push('/login')
        return
      }

      // If we have super admin access, we're good to go
      if (canAccessSuperAdmin()) {
        console.log('SuperAdminRoute: Super admin access confirmed')
      }
    }

    checkSuperAdminAccess()
  }, [user, loading, rolesLoading, canAccessSuperAdmin, router, retryCount])

  // Show loading while auth is loading or during retries
  if (loading || rolesLoading || (user && !canAccessSuperAdmin() && retryCount < 10)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loading ? 'Loading...' : 
             rolesLoading ? 'Loading roles...' : 
             `Checking permissions... (${retryCount}/10)`}
          </p>
        </div>
      </div>
    )
  }

  // If we reach here and still no access, show access denied
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