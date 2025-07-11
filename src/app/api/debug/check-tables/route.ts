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
    console.log('Checking all tables...');
    
    // 1. Check user_roles table
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (rolesError) {
      console.error('Error checking user_roles:', rolesError);
    }
    
    // 2. Check organization_admins table
    const { data: orgAdmins, error: adminsError } = await supabaseAdmin
      .from('organization_admins')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (adminsError) {
      console.error('Error checking organization_admins:', adminsError);
    }
    
    // 3. Check organisations table
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organisations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orgsError) {
      console.error('Error checking organisations:', orgsError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user_roles: {
          count: userRoles?.length || 0,
          data: userRoles || []
        },
        organization_admins: {
          count: orgAdmins?.length || 0,
          data: orgAdmins || []
        },
        organisations: {
          count: orgs?.length || 0,
          data: orgs || []
        }
      },
      errors: {
        rolesError: rolesError?.message,
        adminsError: adminsError?.message,
        orgsError: orgsError?.message
      }
    });
    
  } catch (error) {
    console.error('Debug check tables error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}