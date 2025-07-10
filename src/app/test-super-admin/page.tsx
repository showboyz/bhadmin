'use client'

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function TestSuperAdminPage() {
  const { user, userRoles, isSuperAdmin, canAccessSuperAdmin } = useAuth()
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      // Check if user_roles table exists
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('Error checking user_roles:', error)
      } else {
        console.log('user_roles table accessible:', data)
      }
      
      // Try to get current user info
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
      } else {
        console.log('Current user:', currentUser)
      }
      
    } catch (err) {
      console.error('Database check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSuperAdmin = async () => {
    if (!user) {
      alert('Please log in first')
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          role: 'super_admin',
          org_id: null
        }])
        .select()

      if (error) {
        console.error('Error creating super admin:', error)
        alert('Error: ' + error.message)
      } else {
        console.log('Super admin created:', data)
        alert('Super admin role created successfully!')
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to create super admin:', err)
      alert('Failed to create super admin role')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Super Admin Test Page</h1>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Can Access Super Admin:</strong> {canAccessSuperAdmin() ? 'Yes' : 'No'}</p>
                <p><strong>User Roles:</strong> {JSON.stringify(userRoles, null, 2)}</p>
              </div>
            ) : (
              <p>Not logged in</p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              {user && !isSuperAdmin && (
                <button
                  onClick={createSuperAdmin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Super Admin Role
                </button>
              )}
              
              {isSuperAdmin && (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">✓ You have super admin privileges!</p>
                  <a 
                    href="/super-admin"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Go to Super Admin Portal
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Database Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            {loading ? (
              <p>Checking database...</p>
            ) : (
              <div className="space-y-2">
                <p>Database connection: <span className="text-green-600">✓ Working</span></p>
                <button
                  onClick={checkDatabase}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Recheck Database
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Navigation</h2>
            <div className="space-y-2">
              <a href="/login" className="block text-blue-600 hover:underline">Login Page</a>
              <a href="/dashboard" className="block text-blue-600 hover:underline">Main Dashboard</a>
              <a href="/setup-super-admin" className="block text-blue-600 hover:underline">Setup Super Admin</a>
              <a href="/super-admin" className="block text-blue-600 hover:underline">Super Admin Portal</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}