'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PasswordResetFormProps {
  onBackToLogin?: () => void
}

export default function PasswordResetForm({ onBackToLogin }: PasswordResetFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage({
        type: 'error',
        text: '이메일 주소를 입력해주세요.'
      })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        
        // Handle specific error cases
        if (error.message.includes('Demo mode')) {
          setMessage({
            type: 'error',
            text: '데모 모드에서는 비밀번호 재설정을 사용할 수 없습니다. 실제 Supabase 프로젝트를 연결해주세요.'
          })
        } else if (error.message.includes('not found') || error.message.includes('User not found')) {
          setMessage({
            type: 'error',
            text: '해당 이메일로 등록된 계정을 찾을 수 없습니다.'
          })
        } else {
          setMessage({
            type: 'error',
            text: error.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.'
          })
        }
      } else {
        setEmailSent(true)
        setMessage({
          type: 'success',
          text: '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.'
        })
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-gray-400" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {emailSent ? '이메일 전송 완료' : '비밀번호 재설정'}
        </CardTitle>
        <CardDescription>
          {emailSent 
            ? '이메일을 확인하여 비밀번호를 재설정하세요.'
            : '가입 시 사용한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!emailSent ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">이메일 주소</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
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
                  전송 중...
                </>
              ) : (
                '재설정 링크 보내기'
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
              </p>
              <p className="text-xs text-gray-500">
                이메일이 도착하지 않았다면 스팸 폴더를 확인해보세요.
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setEmailSent(false)
                setEmail('')
                setMessage(null)
              }}
            >
              다른 이메일로 재시도
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={onBackToLogin}
          >
            ← 로그인으로 돌아가기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}