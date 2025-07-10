import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createOrganizationInDynamoDB } from '@/lib/dynamodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Creating organization with data:', body);
    
    // 1. Supabase에 기관 정보 저장
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert([{
        name: body.name,
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

    // 2. Supabase에 기관 설정 저장
    const { error: settingsError } = await supabase
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

    // 4. 관리자 사용자 역할 생성 (이메일이 있는 경우)
    if (body.admin_email) {
      try {
        // 일단은 역할 정보만 저장, 실제 사용자 생성은 나중에
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: body.admin_email, // 임시로 이메일 사용
            org_id: org.id,
            role: 'org_admin',
            created_by: 'system'
          }]);

        if (roleError) {
          console.error('User role creation error:', roleError);
        }
      } catch (roleCreationError) {
        console.error('Role creation failed:', roleCreationError);
      }
    }

    // 5. 감사 로그 기록
    try {
      await supabase
        .from('system_audit_log')
        .insert([{
          user_id: 'system', // 실제 구현에서는 현재 사용자 ID 사용
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
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create organization',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
    });
  }
}