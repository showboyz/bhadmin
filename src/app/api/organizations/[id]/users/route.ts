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
    
    // Validate basic UUID format (more lenient)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orgId)) {
      console.error('Invalid UUID format:', orgId);
      return NextResponse.json({
        success: false,
        error: 'Invalid organization ID format',
        details: `Expected UUID format, got: ${orgId}`
      }, { status: 400 });
    }
    
    // Check if Supabase admin client is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      }, { status: 500 });
    }

    // 1. Get all user roles for this organization
    console.log('Querying user_roles table...');
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('org_id', orgId);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      console.error('Roles error details:', JSON.stringify(rolesError, null, 2));
      return NextResponse.json({
        success: false,
        error: `Database error: ${rolesError.message}`,
        details: 'Failed to query user_roles table'
      }, { status: 500 });
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
    console.log('Fetching auth users for user IDs:', userIds);
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      console.error('Auth error details:', JSON.stringify(authError, null, 2));
      return NextResponse.json({
        success: false,
        error: `Authentication error: ${authError.message}`,
        details: 'Failed to fetch users from auth system'
      }, { status: 500 });
    }
    
    if (!authUsers || !authUsers.users) {
      console.error('No auth users data returned');
      return NextResponse.json({
        success: false,
        error: 'No user data available',
        details: 'Auth system returned empty response'
      }, { status: 500 });
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