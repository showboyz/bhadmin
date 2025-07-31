'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import PasswordResetForm from '@/components/auth/password-reset-form'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  
  const { signIn, refreshUserRoles } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectBasedOnRole = async () => {
    try {
      await refreshUserRoles();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔍 User details after login:', {
        userId: user.id,
        email: user.email,
        userMetadata: user.user_metadata
      });

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, org_id')
        .eq('user_id', user.id);

      console.log('🎭 User roles query result:', {
        roles,
        error: rolesError,
        userId: user.id
      });

      if (rolesError) {
        console.error('❌ Role fetch error:', rolesError);
        toast.error('Error fetching user roles.');
        return;
      }

      if (!roles || roles.length === 0) {
        console.warn('⚠️ No roles found for user:', user.id);
        
        // Special case: if this is todays777@gmail.com, automatically assign super_admin role
        if (user.email === 'todays777@gmail.com') {
          console.log('🔧 Auto-assigning super_admin role to todays777@gmail.com');
          try {
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: 'super_admin',
                org_id: null,
                created_by: user.id
              });

            if (insertError) {
              console.error('❌ Failed to auto-assign super_admin role:', insertError);
              toast.error('Failed to assign admin permissions. Please contact your administrator.');
              return;
            }

            console.log('✅ Successfully auto-assigned super_admin role');
            toast.success('Admin permissions assigned. Redirecting...');
            
            // Wait for a moment then redirect
            setTimeout(() => {
              window.location.href = '/super-admin';
            }, 1000);
            return;
            
          } catch (error) {
            console.error('❌ Error auto-assigning super_admin role:', error);
            toast.error('Failed to assign admin permissions. Please contact your administrator.');
            return;
          }
        }
        
        toast.error('No access permissions found. Please contact your administrator.');
        return;
      }

      const superAdminRole = roles.find((role: any) => role.role === 'super_admin');
      console.log('🎯 Super admin check:', {
        superAdminRole,
        allRoles: roles.map(r => r.role),
        redirecting: !!superAdminRole
      });
      
      if (superAdminRole) {
        console.log('✅ Redirecting to super-admin dashboard');
        router.push('/super-admin');
        return;
      }

      const firstOrgRole = roles.find((role: any) => role.org_id);
      if (firstOrgRole && firstOrgRole.org_id) {
        const { data: org, error: orgError } = await supabase
          .from('organisations')
          .select('id, name, is_active')
          .eq('id', firstOrgRole.org_id)
          .single();

        if (orgError || !org) {
          toast.error('Could not retrieve organization details.');
          return;
        }

        if (org.is_active) {
          localStorage.setItem('currentOrganization', JSON.stringify({
            id: org.id,
            name: org.name,
            role: firstOrgRole.role,
          }));
          router.push(`/org/${org.id}/dashboard`);
          return;
        }
      }

      toast.error('No active organization access. Please contact your administrator.');
    } catch (error) {
      console.error('Error in role-based redirect:', error);
      toast.error('An error occurred during login. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('Login attempt:', { email, passwordLength: password.length })
      
      // Basic validation
      if (!email || !password) {
        toast.error('Please enter both email and password')
        return
      }
      
      if (!email.includes('@')) {
        toast.error('Please enter a valid email address')
        return
      }
      
      // Password login only
      const { data, error } = await signIn(email, password)
      
      console.log('Login result:', { data, error })
      
      if (error) {
        console.error('Login error:', error)
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.')
        } else if (error.message.includes('Demo mode')) {
          toast.error('Demo mode is active. Please configure a valid Supabase project.')
        } else if (error.message.includes('Network')) {
          toast.error('Network error. Please check your internet connection.')
        } else if (error.message.includes('Too many requests')) {
          toast.error('Too many login attempts. Please wait and try again.')
        } else {
          toast.error('Login failed: ' + error.message)
        }
      } else if (data.user) {
        console.log('Login successful for:', data.user.email)
        toast.success('Login successful')
        
        // Wait a bit for the auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
        await redirectBasedOnRole()
      } else {
        toast.error('Login failed: No user data received')
      }
    } catch (error) {
      console.error('Unexpected login error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for success/error messages from URL params
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password_updated') {
      toast.success('Password updated successfully. Please sign in with your new password.')
    }
  }, [searchParams])

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PasswordResetForm onBackToLogin={() => setShowResetForm(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-4">
            <img 
              src="https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true" 
              alt="Brain Health Playground" 
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#111] text-center">
            Brain Health Admin
          </CardTitle>
          <p className="text-center text-sm text-gray-600 mt-2">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#111] hover:bg-[#222] text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              className="text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setShowResetForm(true)}
            >
              Forgot your password?
            </Button>
          </div>
          
        </CardContent>
      </Card>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}