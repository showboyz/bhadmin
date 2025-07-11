'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'super_admin' | 'org_admin' | 'staff' | 'viewer'

export interface UserRoleData {
  id: string
  user_id: string
  org_id: string | null
  role: UserRole
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface OrganizationData {
  id: string
  name: string
  licence_seats: number
  contact_email: string | null
  contact_phone: string | null
  address: any
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CurrentOrganization {
  id: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  userRoles: UserRoleData[]
  currentOrg: OrganizationData | null
  currentOrgContext: CurrentOrganization | null
  loading: boolean
  rolesLoading: boolean
  isSuperAdmin: boolean
  isOrgAdmin: boolean
  signIn: (email: string, password: string) => Promise<any>
  signInWithOtp: (email: string) => Promise<any>
  verifyOtp: (email: string, token: string, type: 'email' | 'magiclink') => Promise<any>
  signOut: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
  hasRole: (role: UserRole, orgId?: string) => boolean
  canAccessSuperAdmin: () => boolean
  refreshUserRoles: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationData | null>(null)
  const [currentOrgContext, setCurrentOrgContext] = useState<CurrentOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(false)

  // Computed properties
  const isSuperAdmin = userRoles.some(role => role.role === 'super_admin')
  const isOrgAdmin = userRoles.some(role => role.role === 'org_admin')

  // Fetch user roles from database
  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user roles:', error)
        return []
      }

      return data as UserRoleData[]
    } catch (error) {
      console.error('Error fetching user roles:', error)
      return []
    }
  }

  // Fetch organization data
  const fetchOrganization = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return null
      }

      return data as OrganizationData
    } catch (error) {
      console.error('Error fetching organization:', error)
      return null
    }
  }

  // Refresh user roles
  const refreshUserRoles = async () => {
    if (!user) return
    
    setRolesLoading(true)
    try {
      const roles = await fetchUserRoles(user.id)
      setUserRoles(roles)

      // Set current organization (first non-super-admin role's org, or null for super admin)
      const firstOrgRole = roles.find(role => role.role !== 'super_admin' && role.org_id)
      if (firstOrgRole?.org_id) {
        const org = await fetchOrganization(firstOrgRole.org_id)
        setCurrentOrg(org)
      } else {
        setCurrentOrg(null)
      }
    } finally {
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    // Load current organization context from localStorage
    const loadOrgContext = () => {
      const stored = localStorage.getItem('currentOrganization')
      if (stored) {
        try {
          setCurrentOrgContext(JSON.parse(stored))
        } catch (error) {
          console.error('Error parsing stored organization context:', error)
          localStorage.removeItem('currentOrganization')
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        loadOrgContext()
        await refreshUserRoles()
      } else {
        setUserRoles([])
        setCurrentOrg(null)
        setCurrentOrgContext(null)
        localStorage.removeItem('currentOrganization')
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        loadOrgContext()
        await refreshUserRoles()
      } else {
        setUserRoles([])
        setCurrentOrg(null)
        setCurrentOrgContext(null)
        localStorage.removeItem('currentOrganization')
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signInWithOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    return { data, error }
  }

  const verifyOtp = async (email: string, token: string, type: 'email' | 'magiclink') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Switch organization context
  const switchOrganization = async (orgId: string) => {
    const org = await fetchOrganization(orgId)
    setCurrentOrg(org)
  }

  // Check if user has a specific role
  const hasRole = (role: UserRole, orgId?: string) => {
    if (role === 'super_admin') {
      return isSuperAdmin
    }
    
    if (orgId) {
      return userRoles.some(r => r.role === role && r.org_id === orgId)
    }
    
    return userRoles.some(r => r.role === role)
  }

  // Check if user can access super admin features
  const canAccessSuperAdmin = () => {
    return isSuperAdmin
  }

  const value = {
    user,
    userRoles,
    currentOrg,
    currentOrgContext,
    loading,
    rolesLoading,
    isSuperAdmin,
    isOrgAdmin,
    signIn,
    signInWithOtp,
    verifyOtp,
    signOut,
    switchOrganization,
    hasRole,
    canAccessSuperAdmin,
    refreshUserRoles,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}