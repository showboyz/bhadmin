// 임시 스크립트: andrew@test.com에 super_admin 역할 추가
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service key exists:', !!supabaseServiceKey)

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSuperAdminRole() {
  try {
    // 1. andrew@test.com 사용자 찾기
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    const andrewUser = users.users.find(user => user.email === 'andrew@test.com')
    
    if (!andrewUser) {
      console.log('andrew@test.com 사용자를 찾을 수 없습니다.')
      return
    }
    
    console.log('Andrew user found:', andrewUser.id, andrewUser.email)
    
    // 2. 기존 역할 확인
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', andrewUser.id)
    
    if (rolesError) {
      console.error('Error checking existing roles:', rolesError)
      return
    }
    
    console.log('Existing roles:', existingRoles)
    
    // 3. super_admin 역할이 없으면 추가
    const hasSuperAdmin = existingRoles?.some(role => role.role === 'super_admin')
    
    if (hasSuperAdmin) {
      console.log('andrew@test.com은 이미 super_admin 역할을 가지고 있습니다.')
      return
    }
    
    // 4. super_admin 역할 추가
    const { data: newRole, error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: andrewUser.id,
        org_id: null, // super_admin은 특정 조직에 속하지 않음
        role: 'super_admin',
        created_by: andrewUser.id // 자기 자신이 생성
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