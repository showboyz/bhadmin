'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PasswordUpdateForm from '@/components/auth/password-update-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateResetSession = async () => {
      try {
        // Check if we have the proper hash parameters for password reset
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (type !== 'recovery') {
          setError('잘못된 비밀번호 재설정 링크입니다.')
          setIsValidating(false)
          return
        }

        if (!accessToken || !refreshToken) {
          setError('비밀번호 재설정 세션이 유효하지 않습니다.')
          setIsValidating(false)
          return
        }

        // Set the session using the tokens from the URL
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('세션 설정 중 오류가 발생했습니다: ' + sessionError.message)
          setIsValidating(false)
          return
        }

        if (!sessionData.session) {
          setError('유효한 세션을 생성할 수 없습니다.')
          setIsValidating(false)
          return
        }

        // Verify the session is for password reset
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('User verification error:', userError)
          setError('사용자 확인 중 오류가 발생했습니다: ' + userError.message)
          setIsValidating(false)
          return
        }

        if (!user) {
          setError('사용자 정보를 찾을 수 없습니다.')
          setIsValidating(false)
          return
        }

        // All validations passed
        setIsValidSession(true)
        setIsValidating(false)

      } catch (error) {
        console.error('Reset session validation error:', error)
        setError('세션 검증 중 예상치 못한 오류가 발생했습니다.')
        setIsValidating(false)
      }
    }

    validateResetSession()
  }, [])

  const handlePasswordUpdateSuccess = () => {
    // Sign out after successful password change
    supabase.auth.signOut().then(() => {
      router.push('/login?message=password_updated')
    })
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">세션을 확인하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              오류 발생
            </CardTitle>
            <CardDescription>
              {error || '비밀번호 재설정 세션이 유효하지 않습니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              다시 비밀번호 재설정을 요청하거나 관리자에게 문의하세요.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              로그인 페이지로 돌아가기
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <PasswordUpdateForm onSuccess={handlePasswordUpdateSuccess} />
    </div>
  )
}