import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Creating user with data:', body);
    
    // 필수 필드 검증
    if (!body.name || !body.email || !body.org_id) {
      throw new Error('Name, email, and organization ID are required');
    }

    // 1. Supabase Auth에 사용자 생성
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // 이메일 확인 건너뛰기
      user_metadata: {
        name: body.name,
        phone: body.phone,
        role: body.role || 'staff',
        org_id: body.org_id
      }
    });

    if (authError) {
      console.error('Supabase auth user creation error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authUser.user.id;
    console.log('User created in Supabase Auth:', userId);

    // 2. user_roles 테이블에 역할 추가
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: userId,
        org_id: body.org_id,
        role: body.role || 'staff',
        created_by: 'super_admin' // 실제로는 현재 사용자 ID 사용
      }]);

    if (roleError) {
      console.error('User role creation error:', roleError);
      // 사용자는 생성되었으므로 경고만 출력하고 계속 진행
    }

    // 3. 감사 로그 기록
    try {
      await supabaseAdmin
        .from('system_audit_log')
        .insert([{
          user_id: 'super_admin', // 실제로는 현재 사용자 ID 사용
          action: 'create_user',
          resource_type: 'user',
          resource_id: userId,
          new_values: {
            name: body.name,
            email: body.email,
            role: body.role,
            org_id: body.org_id
          }
        }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email: body.email,
        name: body.name,
        role: body.role,
        message: 'User created successfully'
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
    });
  }
}