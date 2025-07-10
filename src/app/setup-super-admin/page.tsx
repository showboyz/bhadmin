'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Shield, User, CheckCircle, AlertCircle } from 'lucide-react'

export default function SetupSuperAdminPage() {
  const { user, refreshUserRoles } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleCreateSuperAdmin = async () => {
    if (!user) {
      setError('Please log in first')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Check if user already has super admin role
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingRole) {
        setMessage('You already have super admin privileges!')
        await refreshUserRoles()
        return
      }

      // Create super admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          role: 'super_admin',
          org_id: null // Super admin doesn't belong to any specific org
        }])

      if (insertError) {
        throw insertError
      }

      setMessage('Super admin role created successfully! You can now access the super admin portal.')
      await refreshUserRoles()
      
      // Redirect to super admin dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/super-admin'
      }, 2000)
      
    } catch (err) {
      console.error('Error creating super admin role:', err)
      setError('Failed to create super admin role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckExistingRole = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      if (roles && roles.length > 0) {
        setMessage(`Current roles: ${roles.map(r => r.role).join(', ')}`)
        await refreshUserRoles()
      } else {
        setMessage('No roles found for this user')
      }
    } catch (err) {
      console.error('Error checking roles:', err)
      setError('Failed to check existing roles')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Setup</h1>
          <p className="text-gray-600">Set up super admin privileges for your account</p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Current User</span>
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">ID: {user.id}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckExistingRole}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Checking...' : 'Check Current Roles'}
              </button>

              <button
                onClick={handleCreateSuperAdmin}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Super Admin Role'}
              </button>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="text-center">
              <a
                href="/super-admin"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Go to Super Admin Portal →
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to set up super admin privileges</p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <User className="h-4 w-4" />
              Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}