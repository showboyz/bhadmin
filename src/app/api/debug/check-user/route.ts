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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'andrew@test.com';
    
    console.log('Checking user:', email);
    
    // 1. SQL로 직접 auth.users 테이블 조회 시도
    let authUserData = null;
    try {
      const { data: authUserResult, error: authQueryError } = await supabaseAdmin
        .rpc('get_user_by_email', { user_email: email });
      
      if (authQueryError) {
        console.log('RPC failed, trying direct query...');
        
        // 직접 SQL 실행으로 확인
        const { data: sqlResult, error: sqlError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .limit(1);
          
        console.log('SQL test result:', { sqlResult, sqlError });
      } else {
        authUserData = authQueryError;
      }
    } catch (rpcError) {
      console.log('RPC not available, checking user_roles table instead...');
    }
    
    // 2. user_roles 테이블에서 모든 사용자 확인
    const { data: allRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      throw new Error(`Failed to get roles: ${rolesError.message}`);
    }
    
    console.log('All roles found:', allRoles?.length);
    
    // 3. 최근 생성된 사용자들의 역할 확인
    const recentRoles = allRoles?.slice(-5) || [];
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Auth API가 작동하지 않으므로 user_roles 테이블로 확인',
        totalRoles: allRoles?.length || 0,
        recentRoles: recentRoles,
        searchEmail: email,
        note: 'Supabase 콘솔에서 Authentication > Users를 직접 확인하세요'
      }
    });
    
  } catch (error) {
    console.error('Debug check user error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}