'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  
  const { signIn, signInWithOtp, verifyOtp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // First try password login
      const { data, error } = await signIn(email, password)
      
      if (error && error.message.includes('Invalid login credentials')) {
        // If password fails, try OTP
        const { error: otpError } = await signInWithOtp(email)
        if (otpError) {
          toast.error('Failed to send OTP: ' + otpError.message)
        } else {
          setShowOtpDialog(true)
          toast.success('OTP sent to your email')
        }
      } else if (error) {
        toast.error('Login failed: ' + error.message)
      } else if (data.user) {
        toast.success('Login successful')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifyingOtp(true)
    
    try {
      const { data, error } = await verifyOtp(email, otpCode, 'email')
      
      if (error) {
        toast.error('OTP verification failed: ' + error.message)
      } else if (data.user) {
        toast.success('Login successful')
        setShowOtpDialog(false)
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsVerifyingOtp(false)
    }
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
          
          <div className="mt-4 text-center">
            <p className="text-sm text-[#555]">
              If password fails, we'll send you an OTP via email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enter OTP Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
              <p className="text-sm text-[#555]">
                Check your email for the 6-digit verification code
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#111] hover:bg-[#222] text-white"
              disabled={isVerifyingOtp}
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}