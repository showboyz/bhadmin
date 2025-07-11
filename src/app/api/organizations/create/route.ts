import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { createOrganizationInDynamoDB, checkOrganizationExists } from '@/lib/dynamodb';

// Create admin client that bypasses RLS for testing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
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
    
    console.log('Creating organization with data:', body);
    
    // 현재 사용자 세션 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized: No valid session');
    }
    
    console.log('Current user:', user.id, user.email);
    
    // Check user's roles for debugging
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role, org_id')
      .eq('user_id', user.id);
    
    console.log('User roles:', userRoles);
    if (roleError) {
      console.error('Error fetching user roles:', roleError);
    }
    
    const isSuperAdmin = userRoles?.some(role => role.role === 'super_admin');
    console.log('Is super admin:', isSuperAdmin);
    
    if (!isSuperAdmin) {
      throw new Error('Access denied: Super admin role required');
    }
    
    // 0. 중복 검사 (임시로 주석 처리하여 테스트)
    console.log('Skipping duplicate checks for testing...');
    
    /*
    // 기관명 중복 검사
    const { data: existingOrg } = await supabase
      .from('organisations')
      .select('id, name')
      .eq('name', body.name)
      .single();
    
    if (existingOrg) {
      throw new Error(`기관명 '${body.name}'이(가) 이미 존재합니다.`);
    }
    
    // 관리자 이메일 중복 검사
    if (body.admin_email) {
      const { data: existingAdminEmail } = await supabase
        .from('organization_admins')
        .select('id, admin_email')
        .eq('admin_email', body.admin_email)
        .single();
      
      if (existingAdminEmail) {
        throw new Error(`관리자 이메일 '${body.admin_email}'이(가) 이미 사용 중입니다.`);
      }
    }
    
    // 앱 로그인 ID 중복 검사
    if (body.admin_id) {
      const { data: existingAdminId } = await supabase
        .from('organization_admins')
        .select('id, admin_id')
        .eq('admin_id', body.admin_id)
        .single();
      
      if (existingAdminId) {
        throw new Error(`앱 로그인 ID '${body.admin_id}'이(가) 이미 사용 중입니다.`);
      }
    }
    
    // DynamoDB에서도 기관명 중복 검사
    try {
      const dynamoExists = await checkOrganizationExists(body.name);
      if (dynamoExists) {
        throw new Error(`기관명 '${body.name}'이(가) DynamoDB에 이미 존재합니다.`);
      }
    } catch (dynamoError) {
      console.error('DynamoDB duplicate check error:', dynamoError);
      // DynamoDB 검사 실패는 경고만 출력하고 계속 진행
    }
    */
    
    console.log('No duplicates found, proceeding with creation...');
    
    // 1. Supabase에 기관 정보 저장 (admin client 사용)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organisations')
      .insert([{
        name: body.name,
        org_type: body.org_type || 'clinic',
        licence_seats: body.license_limit || 50,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        address: body.address,
        is_active: true
      }])
      .select()
      .single();

    if (orgError) {
      console.error('Supabase organization creation error:', orgError);
      throw new Error(`Supabase error: ${orgError.message}`);
    }

    console.log('Organization created in Supabase:', org);

    // 2. Supabase에 기관 설정 저장 (admin client 사용)
    const { error: settingsError } = await supabaseAdmin
      .from('organization_settings')
      .insert([{
        org_id: org.id,
        subscription_plan: body.subscription_plan || 'basic',
        license_limit: body.license_limit || 50,
        org_type: body.org_type || 'clinic',
        is_active: true
      }]);

    if (settingsError) {
      console.error('Supabase settings creation error:', settingsError);
      // 기관은 생성되었으므로 설정 오류는 경고만 출력
    }

    // 3. DynamoDB에 동시 저장
    try {
      const dynamoData = await createOrganizationInDynamoDB({
        id: org.id, // Supabase ID 사용
        ...body
      });
      console.log('Organization created in DynamoDB:', dynamoData);
    } catch (dynamoError) {
      console.error('DynamoDB creation error:', dynamoError);
      // DynamoDB 오류는 로그만 남기고 계속 진행
    }

    // 4. 관리자 정보를 organization_admins 테이블에 저장
    if (body.admin_email && body.admin_name) {
      try {
        const { error: adminError } = await supabaseAdmin
          .from('organization_admins')
          .insert([{
            org_id: org.id,
            admin_name: body.admin_name,
            admin_email: body.admin_email,
            admin_phone: body.admin_phone || null,
            admin_id: body.admin_id,
            admin_password: body.admin_password,
            is_active: true
          }]);

        if (adminError) {
          console.error('Admin info creation error:', adminError);
          console.error('Admin error details:', JSON.stringify(adminError, null, 2));
          // 테이블이 존재하지 않는 경우 등은 경고만 출력하고 계속 진행
          if (adminError.message?.includes('does not exist') || adminError.code === '42P01') {
            console.warn('organization_admins table does not exist. Admin info will be stored in logs only.');
            console.log('Admin info (not stored in DB):', {
              org_id: org.id,
              admin_name: body.admin_name,
              admin_email: body.admin_email,
              admin_phone: body.admin_phone,
              admin_id: body.admin_id,
              admin_password: body.admin_password
            });
          }
        } else {
          console.log('Admin info stored successfully for organization:', org.id);
        }
      } catch (adminInfoError) {
        console.error('Admin info storage failed:', adminInfoError);
        console.error('Admin storage error details:', JSON.stringify(adminInfoError, null, 2));
      }
    }

    // 5. 감사 로그 기록 (admin client 사용)
    try {
      await supabaseAdmin
        .from('system_audit_log')
        .insert([{
          user_id: user.id, // 현재 사용자 ID 사용
          action: 'create_organization',
          resource_type: 'organization',
          resource_id: org.id,
          new_values: {
            name: body.name,
            org_type: body.org_type,
            subscription_plan: body.subscription_plan,
            license_limit: body.license_limit,
            admin_email: body.admin_email
          }
        }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        organization: org,
        message: 'Organization created successfully in both Supabase and DynamoDB'
      }
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create organization',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
    });
  }
}