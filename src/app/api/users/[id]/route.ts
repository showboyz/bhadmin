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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('Deleting user:', userId);

    // 1. Delete user roles first (foreign key constraint)
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
      throw new Error(`Failed to delete user roles: ${rolesError.message}`);
    }

    console.log('User roles deleted for user:', userId);

    // 2. Delete from audit log if exists
    try {
      await supabaseAdmin
        .from('system_audit_log')
        .delete()
        .eq('user_id', userId);
    } catch (auditError) {
      console.error('Error deleting audit logs (non-critical):', auditError);
      // Continue with user deletion even if audit log deletion fails
    }

    // 3. Delete the Supabase Auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw new Error(`Failed to delete user: ${authError.message}`);
    }

    console.log('User successfully deleted:', userId);

    // 4. Record audit log for user deletion
    try {
      await supabaseAdmin
        .from('system_audit_log')
        .insert([{
          user_id: 'super_admin', // In practice, use the current user ID
          action: 'delete_user',
          resource_type: 'user',
          resource_id: userId,
          old_values: {
            user_id: userId,
            deleted_at: new Date().toISOString()
          }
        }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Continue as audit log is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('User deletion error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}