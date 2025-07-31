const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSuperAdminRole() {
  try {
    const targetEmail = 'todays777@gmail.com'
    console.log(`🔍 Looking for user with email: ${targetEmail}`)

    // Get all users from auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    // Find the user by email
    const user = authData.users.find(u => u.email === targetEmail)
    
    if (!user) {
      console.error(`❌ User with email ${targetEmail} not found in auth system`)
      console.log('Available users:')
      authData.users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Check if user already has super_admin role
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('❌ Error checking existing roles:', rolesError)
      return
    }

    console.log(`🎭 Current roles for ${user.email}:`)
    if (existingRoles && existingRoles.length > 0) {
      existingRoles.forEach(role => {
        console.log(`  - ${role.role} (org: ${role.org_id || 'none'})`)
      })
    } else {
      console.log('  - No roles found')
    }

    // Check if already has super_admin
    const hasSuperAdmin = existingRoles?.some(role => role.role === 'super_admin')
    
    if (hasSuperAdmin) {
      console.log('✅ User already has super_admin role!')
      return
    }

    // Add super_admin role
    console.log('➕ Adding super_admin role...')
    const { data: newRole, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'super_admin',
        org_id: null,
        created_by: user.id // self-created
      })
      .select()

    if (insertError) {
      console.error('❌ Error adding super_admin role:', insertError)
      return
    }

    console.log('✅ Successfully added super_admin role!')
    console.log('🎉 User todays777@gmail.com can now login as super admin')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the script
addSuperAdminRole()