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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 });
    }

    console.log('Fetching users for organization:', orgId);

    // 1. Get all user roles for this organization
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('org_id', orgId);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
    }

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    console.log('Found user roles:', userRoles.length);

    // 2. Get user details from auth.users for each user_id
    const userIds = userRoles.map(role => role.user_id);
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error(`Failed to fetch users: ${authError.message}`);
    }

    // 3. Filter users to only include those in this organization
    const orgUsers = authUsers.users.filter(user => userIds.includes(user.id));

    // 4. Combine user data with role information
    const usersWithRoles = orgUsers.map(user => {
      const userRole = userRoles.find(role => role.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata || {},
        created_at: user.created_at,
        user_roles: userRole ? [{
          role: userRole.role,
          org_id: orgId,
          created_at: userRole.created_at
        }] : []
      };
    });

    console.log('Returning users:', usersWithRoles.length);

    return NextResponse.json({
      success: true,
      data: usersWithRoles
    });

  } catch (error) {
    console.error('Error fetching organization users:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}