import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        hasSession: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at
        } : null,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        isExpired: session?.expires_at ? Date.now() / 1000 > session.expires_at : false
      }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}