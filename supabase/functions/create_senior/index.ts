import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSeniorPayload {
  org_id: string
  name: string
  gender_enum: 'M' | 'F'
  birth: string
  eduyear?: 'none' | 'elementary' | 'middle' | 'high' | 'college' | null
  phone?: string
  guardian_phone?: string
  address?: any
  note?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const payload: CreateSeniorPayload = await req.json()
    
    // Validate required fields
    if (!payload.org_id || !payload.name || !payload.gender_enum || !payload.birth) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: org_id, name, gender_enum, birth' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabaseClient
      .from('organisations')
      .select('id, licence_seats')
      .eq('id', payload.org_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if organization has available license seats
    const { data: existingSeniors, error: seniorsCountError } = await supabaseClient
      .from('seniors')
      .select('id')
      .eq('org_id', payload.org_id)

    if (seniorsCountError) {
      console.error('Error counting existing seniors:', seniorsCountError)
      return new Response(
        JSON.stringify({ error: 'Failed to check license availability' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const currentSeniorCount = existingSeniors?.length || 0
    if (currentSeniorCount >= org.licence_seats) {
      return new Response(
        JSON.stringify({ 
          error: 'License limit reached',
          current_seniors: currentSeniorCount,
          license_limit: org.licence_seats
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate birth date
    const birthDate = new Date(payload.birth)
    const today = new Date()
    if (birthDate > today) {
      return new Response(
        JSON.stringify({ error: 'Birth date cannot be in the future' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate age to ensure it's reasonable for senior care
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 50) {
      return new Response(
        JSON.stringify({ error: 'Age must be 50 or older for senior care programs' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert new senior
    const { data: newSenior, error: insertError } = await supabaseClient
      .from('seniors')
      .insert({
        org_id: payload.org_id,
        name: payload.name.trim(),
        gender_enum: payload.gender_enum,
        birth: payload.birth,
        eduyear: payload.eduyear || null,
        phone: payload.phone?.trim() || null,
        guardian_phone: payload.guardian_phone?.trim() || null,
        address: payload.address || null,
        note: payload.note?.trim() || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Senior insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create senior' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the creation for audit purposes
    console.log(`Senior created: ${newSenior.id} by user: ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        senior: newSenior,
        message: 'Senior created successfully' 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Create senior error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})