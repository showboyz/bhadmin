import { supabase } from './supabase'

// Rate limiting for error handling to prevent infinite loops
let lastErrorHandleTime = 0
let errorCount = 0
const ERROR_HANDLE_COOLDOWN = 5000 // 5 seconds
const MAX_ERRORS_PER_COOLDOWN = 3

// API 요청 시 자동 인증 검증을 위한 유틸리티
export async function handleApiError(error: any) {
  const now = Date.now()
  
  // Rate limiting to prevent infinite loops
  if (now - lastErrorHandleTime < ERROR_HANDLE_COOLDOWN) {
    errorCount++
    if (errorCount > MAX_ERRORS_PER_COOLDOWN) {
      console.warn('Too many API errors in short time, skipping automatic handling')
      throw error
    }
  } else {
    errorCount = 1
    lastErrorHandleTime = now
  }

  // 401 Unauthorized 오류가 발생한 경우 세션을 확인하고 필요시 로그아웃
  if (error?.status === 401 || error?.message?.includes('JWT expired')) {
    console.log('API returned 401, checking session validity...')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.log('Session invalid, forcing logout')
        await supabase.auth.signOut()
        // 페이지 새로고침으로 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    } catch (sessionCheckError) {
      console.error('Error checking session:', sessionCheckError)
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }
  
  throw error
}

// Supabase 쿼리를 래핑하여 자동 오류 처리 추가
export async function supabaseQuery<T>(queryFunction: () => Promise<{ data: T; error: any }>) {
  try {
    const result = await queryFunction()
    
    if (result.error) {
      await handleApiError(result.error)
    }
    
    return result
  } catch (error) {
    await handleApiError(error)
    throw error
  }
}