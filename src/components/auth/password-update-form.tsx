'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PasswordUpdateFormProps {
  onSuccess?: () => void
}

export default function PasswordUpdateForm({ onSuccess }: PasswordUpdateFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const validatePassword = (password: string) => {
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { password, confirmPassword } = formData

    // Validation
    if (!password || !confirmPassword) {
      setMessage({
        type: 'error',
        text: '모든 필드를 입력해주세요.'
      })
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage({
        type: 'error',
        text: passwordError
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '비밀번호가 일치하지 않습니다.'
      })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password update error:', error)
        
        if (error.message.includes('Demo mode')) {
          setMessage({
            type: 'error',
            text: '데모 모드에서는 비밀번호 변경을 사용할 수 없습니다. 실제 Supabase 프로젝트를 연결해주세요.'
          })
        } else if (error.message.includes('session_not_found')) {
          setMessage({
            type: 'error',
            text: '세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.'
          })
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          setMessage({
            type: 'error',
            text: error.message || '비밀번호 변경 중 오류가 발생했습니다.'
          })
        }
      } else {
        setMessage({
          type: 'success',
          text: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
        })
        
        // Success callback or redirect
        if (onSuccess) {
          onSuccess()
        } else {
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage({
        type: 'error',
        text: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear message when user starts typing
    if (message) {
      setMessage(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-gray-400" />
        </div>
        <CardTitle className="text-2xl font-bold">새 비밀번호 설정</CardTitle>
        <CardDescription>
          안전한 새 비밀번호를 설정해주세요.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="새 비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              최소 6자, 영문자와 숫자 포함
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                변경 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => router.push('/login')}
          >
            ← 로그인으로 돌아가기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}