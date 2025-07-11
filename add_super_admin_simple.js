// 간단한 방법: andrew@test.com의 사용자 ID를 직접 입력하여 super_admin 역할 추가
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSuperAdminRole() {
  try {
    // andrew@test.com의 사용자 ID를 직접 조회 (일반 supabase 클라이언트 사용)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 먼저 andrew@test.com로 로그인 시도 (세션이 있는지 확인)
    console.log('Checking current session...')
    
    const { data: session } = await supabase.auth.getSession()
    console.log('Current session:', session.session?.user?.email)
    
    if (!session.session?.user) {
      console.log('No active session. You need to login first.')
      console.log('Please login to the app with andrew@test.com first, then run this script.')
      return
    }
    
    const userId = session.session.user.id
    const userEmail = session.session.user.email
    
    console.log('User found:', userId, userEmail)
    
    // 기존 역할 확인
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
    
    if (rolesError) {
      console.error('Error checking existing roles:', rolesError)
      return
    }
    
    console.log('Existing roles:', existingRoles)
    
    // super_admin 역할이 없으면 추가
    const hasSuperAdmin = existingRoles?.some(role => role.role === 'super_admin')
    
    if (hasSuperAdmin) {
      console.log(`${userEmail} already has super_admin role.`)
      return
    }
    
    // super_admin 역할 추가
    const { data: newRole, error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: userId,
        org_id: null, // super_admin은 특정 조직에 속하지 않음
        role: 'super_admin',
        created_by: userId // 자기 자신이 생성
      }])
      .select()
    
    if (insertError) {
      console.error('Error inserting super_admin role:', insertError)
      return
    }
    
    console.log('Super admin role added successfully:', newRole)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addSuperAdminRole()