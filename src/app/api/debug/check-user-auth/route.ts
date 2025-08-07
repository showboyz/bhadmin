import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log(`🔍 Testing login for: ${email}`)
    
    // Supabase signInWithPassword 테스트
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    console.log('Login result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        email: email
      })
    }
    
    if (data?.user) {
      // 사용자 role 확인
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, org_id')
        .eq('user_id', data.user.id)
      
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at,
          user_metadata: data.user.user_metadata
        },
        roles: roles || [],
        roleError: roleError?.message
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No user returned',
      email: email
    })
    
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required'
      }, { status: 400 })
    }
    
    console.log(`🔍 Checking user existence for: ${email}`)
    
    // Supabase Auth에서 사용자 조회
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({
        success: false,
        error: `Failed to list users: ${listError.message}`
      }, { status: 500 })
    }
    
    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in auth system',
        email: email
      })
    }
    
    // 사용자 role 확인
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role, org_id, created_at')
      .eq('user_id', user.id)
    
    // organization_admins 테이블에서도 확인
    const { data: adminInfo, error: adminError } = await supabase
      .from('organization_admins')
      .select('*')
      .eq('admin_email', email)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        last_sign_in_at: user.last_sign_in_at
      },
      roles: roles || [],
      adminInfo: adminInfo || [],
      errors: {
        roleError: roleError?.message,
        adminError: adminError?.message
      }
    })
    
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}