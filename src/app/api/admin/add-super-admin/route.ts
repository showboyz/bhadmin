import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    // 현재 로그인된 사용자 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Please login first'
      }, { status: 401 });
    }
    
    console.log('Current user:', user.id, user.email);
    
    // andrew@test.com인지 확인 (보안을 위해)
    if (user.email !== 'andrew@test.com') {
      return NextResponse.json({
        success: false,
        error: 'Only andrew@test.com can add super admin role'
      }, { status: 403 });
    }
    
    // 기존 역할 확인
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('Error checking existing roles:', rolesError);
      throw new Error(`Failed to check existing roles: ${rolesError.message}`);
    }
    
    console.log('Existing roles:', existingRoles);
    
    // super_admin 역할이 이미 있는지 확인
    const hasSuperAdmin = existingRoles?.some(role => role.role === 'super_admin');
    
    if (hasSuperAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Super admin role already exists',
        data: existingRoles
      });
    }
    
    // super_admin 역할 추가
    const { data: newRole, error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: user.id,
        org_id: null, // super_admin은 특정 조직에 속하지 않음
        role: 'super_admin',
        created_by: user.id
      }])
      .select();
    
    if (insertError) {
      console.error('Error inserting super_admin role:', insertError);
      throw new Error(`Failed to add super admin role: ${insertError.message}`);
    }
    
    console.log('Super admin role added successfully:', newRole);
    
    return NextResponse.json({
      success: true,
      message: 'Super admin role added successfully',
      data: newRole
    });
    
  } catch (error) {
    console.error('Add super admin error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add super admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}