import { supabase } from './supabase'

/**
 * Password reset helper functions for Supabase MCP integration
 */

export interface PasswordResetOptions {
  email: string
  redirectTo?: string
}

export interface PasswordUpdateOptions {
  password: string
}

/**
 * Send password reset email to user
 * Uses Supabase Auth API via MCP server
 */
export async function sendPasswordResetEmail({ 
  email, 
  redirectTo 
}: PasswordResetOptions) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error('Password reset email error:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

/**
 * Update user password after reset session is established
 * Uses Supabase Auth API via MCP server
 */
export async function updateUserPassword({ password }: PasswordUpdateOptions) {
  try {
    // Validate current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('No valid session found. Please request a new password reset.')
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update password:', error)
    throw error
  }
}

/**
 * Validate password reset session from URL parameters
 * Used in password reset page to verify the reset token
 */
export async function validatePasswordResetSession() {
  try {
    // Get hash parameters from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (type !== 'recovery') {
      throw new Error('Invalid password reset link type')
    }

    if (!accessToken || !refreshToken) {
      throw new Error('Missing required tokens for password reset')
    }

    // Set session with reset tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (sessionError || !sessionData.session) {
      throw new Error('Failed to establish password reset session')
    }

    // Verify user exists
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User verification failed')
    }

    return { 
      success: true, 
      user,
      session: sessionData.session 
    }
  } catch (error) {
    console.error('Password reset session validation failed:', error)
    throw error
  }
}

/**
 * Sign out user after successful password change
 * Clears the reset session and redirects to login
 */
export async function signOutAfterPasswordReset() {
  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    console.error('Sign out after password reset failed:', error)
    throw error
  }
}

/**
 * Check if current environment supports password reset
 * Returns false for demo mode or invalid Supabase configuration
 */
export function isPasswordResetSupported(): boolean {
  // Check if we're in demo mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl?.includes('demo.supabase.co') || supabaseKey === 'demo-anon-key') {
    return false
  }
  
  return !!(supabaseUrl && supabaseKey)
}

/**
 * Validate password strength
 * Returns null if valid, error message if invalid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 6) {
    return '비밀번호는 최소 6자 이상이어야 합니다.'
  }
  
  if (!/(?=.*[a-zA-Z])/.test(password)) {
    return '비밀번호에는 최소 1개의 영문자가 포함되어야 합니다.'
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return '비밀번호에는 최소 1개의 숫자가 포함되어야 합니다.'
  }
  
  return null
}