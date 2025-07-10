'use client'

import { usePathname } from 'next/navigation'
import Navigation from './navigation'
import ProtectedRoute from './protected-route'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isSuperAdminPage = pathname.startsWith('/super-admin')
  const isSetupPage = pathname === '/setup-super-admin' || pathname === '/test-super-admin'

  // Pages that don't need any layout
  if (isLoginPage || isSuperAdminPage || isSetupPage) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <div className="flex">
        <Navigation />
        <main className="ml-64 flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}