'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { supabaseQuery } from '@/lib/api-interceptor'

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

  // Fetch user roles from database with circuit breaker
  const fetchUserRoles = async (userId: string) => {
    try {
      console.log('🔍 Fetching user roles for userId:', userId)
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
      
      const fetchPromise = supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Error fetching user roles:', error)
        // Don't throw on role fetch errors to prevent infinite loops
        return []
      }

      console.log('✅ User roles found:', data)
      return data as UserRoleData[]
    } catch (error) {
      console.error('❌ Error fetching user roles (with timeout):', error)
      return []
    }
  }

  // Fetch organization data
  const fetchOrganization = async (orgId: string) => {
    try {
      // Direct supabase call without supabaseQuery to avoid infinite loop
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

  // Circuit breaker to prevent infinite loops
  let roleRefreshCount = 0
  let lastRoleRefreshTime = 0
  const ROLE_REFRESH_COOLDOWN = 2000 // 2 seconds
  const MAX_ROLE_REFRESH_PER_MINUTE = 5
  const CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute

  // Refresh user roles
  const refreshUserRoles = async () => {
    if (!user) return
    
    const now = Date.now()
    
    // Reset circuit breaker after 1 minute
    if (now - lastRoleRefreshTime > CIRCUIT_BREAKER_RESET_TIME) {
      roleRefreshCount = 0
    }
    
    // Circuit breaker - stop if too many requests
    if (roleRefreshCount >= MAX_ROLE_REFRESH_PER_MINUTE) {
      console.warn('🚫 Circuit breaker: Too many role refresh attempts, stopping to prevent infinite loop')
      return
    }
    
    // Rate limiting
    if (now - lastRoleRefreshTime < ROLE_REFRESH_COOLDOWN) {
      console.log('⏰ Role refresh skipped due to rate limiting')
      return
    }
    
    roleRefreshCount++
    lastRoleRefreshTime = now
    
    console.log('👤 Refreshing roles for user:', { 
      id: user.id, 
      email: user.email, 
      user_metadata: user.user_metadata 
    })
    
    setRolesLoading(true)
    try {
      const roles = await fetchUserRoles(user.id)
      setUserRoles(roles)
      console.log('🎭 Roles refreshed and set:', roles)

      // Set current organization (first non-super-admin role's org, or null for super admin)
      const firstOrgRole = roles.find(role => role.role !== 'super_admin' && role.org_id)
      if (firstOrgRole?.org_id) {
        const org = await fetchOrganization(firstOrgRole.org_id)
        setCurrentOrg(org)
        console.log('🏢 Current organization set:', org)
      } else {
        setCurrentOrg(null)
        console.log('🏢 No organization set (super admin)')
      }
    } catch (error) {
      console.error('❌ Error in refreshUserRoles:', error)
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

    // Check session validity periodically
    const checkSessionValidity = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          
          // Handle specific refresh token errors
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('refresh_token_not_found')) {
            console.log('Refresh token invalid during session check, clearing auth state and redirecting to login')
            setUser(null)
            setUserRoles([])
            setCurrentOrg(null)
            setCurrentOrgContext(null)
            localStorage.removeItem('currentOrganization')
            // Force redirect to login
            window.location.href = '/login'
            return false
          }
          
          // Handle network errors gracefully
          if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
            console.log('Network error detected, maintaining current session')
            return true // Don't clear session on network errors
          }
          console.log('Session invalid, clearing auth state')
          setUser(null)
          setUserRoles([])
          setCurrentOrg(null)
          setCurrentOrgContext(null)
          localStorage.removeItem('currentOrganization')
          return false
        }
        
        if (!session) {
          console.log('No session found, clearing auth state')
          setUser(null)
          setUserRoles([])
          setCurrentOrg(null)
          setCurrentOrgContext(null)
          localStorage.removeItem('currentOrganization')
          return false
        }
        
        // Check if token is expired or will expire soon (within 5 minutes)
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const fiveMinutes = 5 * 60
        
        if (expiresAt && expiresAt - now < fiveMinutes) {
          console.log('Token will expire soon, refreshing...')
          try {
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Failed to refresh session:', refreshError)
              
              // Handle specific refresh token errors
              if (refreshError.message.includes('Invalid Refresh Token') || 
                  refreshError.message.includes('Refresh Token Not Found') ||
                  refreshError.message.includes('refresh_token_not_found')) {
                console.log('Refresh token invalid, clearing auth state and redirecting to login')
                setUser(null)
                setUserRoles([])
                setCurrentOrg(null)
                setCurrentOrgContext(null)
                localStorage.removeItem('currentOrganization')
                // Force redirect to login
                window.location.href = '/login'
                return false
              }
              
              // Don't clear session on network errors during refresh
              if (refreshError.message.includes('Failed to fetch') || refreshError.message.includes('Network error')) {
                return true
              }
              return false
            }
          } catch (refreshError) {
            console.error('Network error during token refresh:', refreshError)
            return true // Maintain session despite refresh failure
          }
        }
        
        return true
      } catch (error) {
        console.error('Error checking session validity:', error)
        // Handle network errors gracefully
        if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Network error'))) {
          console.log('Network error during session check, maintaining session')
          return true
        }
        return false
      }
    }

    // Get initial session with retry logic
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          
          // Handle specific refresh token errors during initialization
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('refresh_token_not_found')) {
            console.log('Refresh token invalid during initialization, clearing auth state')
            setUser(null)
            setUserRoles([])
            setCurrentOrg(null)
            setCurrentOrgContext(null)
            localStorage.removeItem('currentOrganization')
            setLoading(false)
            return
          }
        }
        
        console.log('Initial session check:', session?.user?.email || 'No session')
        
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
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Global error handler for auth errors
    const handleAuthError = (error: any) => {
      if (error && typeof error.message === 'string') {
        if (error.message.includes('Invalid Refresh Token') || 
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('AuthApiError')) {
          console.log('Global auth error detected, clearing auth state and redirecting to login')
          setUser(null)
          setUserRoles([])
          setCurrentOrg(null)
          setCurrentOrgContext(null)
          localStorage.removeItem('currentOrganization')
          // Use setTimeout to avoid potential infinite loops
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
          return true
        }
      }
      return false
    }

    // Set up global error listener for unhandled auth errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      const errorMessage = args.join(' ')
      if (!handleAuthError({ message: errorMessage })) {
        originalConsoleError.apply(console, args)
      }
    }

    // Listen for auth changes (with circuit breaker)
    let authStateChangeCount = 0
    const MAX_AUTH_CHANGES = 10
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email || 'No session')
      
      // Circuit breaker for auth state changes
      authStateChangeCount++
      if (authStateChangeCount > MAX_AUTH_CHANGES) {
        console.warn('🚫 Too many auth state changes, ignoring to prevent infinite loop')
        return
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          loadOrgContext()
          
          // Force refresh roles on sign in, bypassing circuit breaker for initial login
          if (event === 'SIGNED_IN') {
            // Reset circuit breaker for fresh login
            roleRefreshCount = 0
            lastRoleRefreshTime = 0
            
            // Wait a brief moment for user state to propagate
            setTimeout(async () => {
              const roles = await fetchUserRoles(session.user.id)
              setUserRoles(roles)
            }, 100)
          } else if (roleRefreshCount < MAX_ROLE_REFRESH_PER_MINUTE) {
            await refreshUserRoles()
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Clearing auth state due to sign out or failed refresh')
        setUser(null)
        setUserRoles([])
        setCurrentOrg(null)
        setCurrentOrgContext(null)
        localStorage.removeItem('currentOrganization')
      } else if (event === 'TOKEN_REFRESH_FAILED') {
        console.log('Token refresh failed, clearing auth state and redirecting to login')
        setUser(null)
        setUserRoles([])
        setCurrentOrg(null)
        setCurrentOrgContext(null)
        localStorage.removeItem('currentOrganization') 
        // Force redirect to login on token refresh failure
        window.location.href = '/login'
      }
    })

    // Set up periodic session validation (every 10 minutes, reduced frequency)
    const sessionCheckInterval = setInterval(async () => {
      if (user) {
        const isValid = await checkSessionValidity()
        if (!isValid) {
          console.log('Session validation failed, signing out')
          await supabase.auth.signOut()
        }
      }
    }, 10 * 60 * 1000) // 10 minutes

    // Check session on window focus
    const handleWindowFocus = async () => {
      if (user) {
        console.log('Window focused, checking session validity')
        const isValid = await checkSessionValidity()
        if (!isValid) {
          console.log('Session invalid on focus, signing out')
          await supabase.auth.signOut()
        }
      }
    }

    // Check session on network reconnection
    const handleOnline = async () => {
      if (user) {
        console.log('Network reconnected, checking session validity')
        const isValid = await checkSessionValidity()
        if (!isValid) {
          console.log('Session invalid after reconnection, signing out')
          await supabase.auth.signOut()
        }
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('online', handleOnline)

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheckInterval)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('online', handleOnline)
      // Restore original console.error
      console.error = originalConsoleError
    }
  }, []) // Remove user dependency to prevent infinite loop

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      // Log the response for debugging
      console.log('signInWithPassword result:', { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session, 
        errorMessage: error?.message 
      })
      
      return { data, error }
    } catch (networkError) {
      console.error('Network error during sign in:', networkError)
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Network error. Please check your connection and try again.' } 
      }
    }
  }

  const signInWithOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
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
    try {
      await supabase.auth.signOut()
    } catch (error: any) {
      console.error('Error during sign out:', error)
      // Even if signOut fails, clear local state
      setUser(null)
      setUserRoles([])
      setCurrentOrg(null)
      setCurrentOrgContext(null)
      localStorage.removeItem('currentOrganization')
    }
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