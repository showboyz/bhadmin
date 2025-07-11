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
    console.log('Creating missing admin user...');
    
    // Get organization admin info
    const { data: orgAdmin, error: adminError } = await supabaseAdmin
      .from('organization_admins')
      .select('*')
      .eq('admin_email', 'andrew@youngandx.com')
      .single();
    
    if (adminError || !orgAdmin) {
      throw new Error('Organization admin not found in database');
    }
    
    console.log('Found org admin:', orgAdmin);
    
    // Create Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: orgAdmin.admin_email,
      password: orgAdmin.admin_password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: orgAdmin.admin_name,
        phone: orgAdmin.admin_phone,
        role: 'org_admin',
        org_id: orgAdmin.org_id
      }
    });

    if (authError) {
      console.error('Supabase auth user creation error:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authUser.user.id;
    console.log('Auth user created:', userId);

    // Add user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: userId,
        org_id: orgAdmin.org_id,
        role: 'org_admin',
        created_by: '91f360ba-2c8b-4256-a82a-538066030d9f' // super admin user ID
      }]);

    if (roleError) {
      console.error('User role creation error:', roleError);
      // Continue even if role creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user_id: userId,
        email: orgAdmin.admin_email,
        name: orgAdmin.admin_name,
        org_id: orgAdmin.org_id
      }
    });
    
  } catch (error) {
    console.error('Create missing admin error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}