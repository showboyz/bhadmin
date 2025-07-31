import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Create a temporary supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'No user data returned'
      }, { status: 401 });
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user.id);

    // Sign out immediately
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          created_at: authData.user.created_at
        },
        roles: roles || [],
        hasRoles: (roles?.length || 0) > 0,
        isSuperAdmin: roles?.some(r => r.role === 'super_admin') || false,
        rolesError: rolesError?.message || null
      }
    });

  } catch (error) {
    console.error('Login debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}