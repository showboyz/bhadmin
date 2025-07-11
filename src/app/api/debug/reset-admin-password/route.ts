import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return Response.json({ 
        success: false, 
        error: 'Email and newPassword are required' 
      }, { status: 400 })
    }

    console.log('Resetting password for:', email)

    // Update user password using service role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      await getUserIdByEmail(email),
      { password: newPassword }
    )

    if (error) {
      console.error('Password reset error:', error)
      return Response.json({ 
        success: false, 
        error: 'Failed to reset password',
        details: error.message 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `Password reset successfully for ${email}`,
      data 
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getUserIdByEmail(email: string): Promise<string> {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  const user = users.users.find(u => u.email === email)
  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  return user.id
}