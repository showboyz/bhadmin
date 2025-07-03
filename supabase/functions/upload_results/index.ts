import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadResultsPayload {
  senior_id: string
  result_type: 'motor' | 'cognitive'
  raw_data: any
  video_key: string
  bpm?: number
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

    // Parse request body
    const payload: UploadResultsPayload = await req.json()
    
    // Validate required fields
    if (!payload.senior_id || !payload.result_type || !payload.raw_data || !payload.video_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify senior exists
    const { data: senior, error: seniorError } = await supabaseClient
      .from('seniors')
      .select('id')
      .eq('id', payload.senior_id)
      .single()

    if (seniorError || !senior) {
      return new Response(
        JSON.stringify({ error: 'Senior not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let resultId: string

    // Insert result based on type
    if (payload.result_type === 'motor') {
      const { data: motorResult, error: motorError } = await supabaseClient
        .from('motor_results')
        .insert({
          senior_id: payload.senior_id,
          raw: payload.raw_data,
          video_key: payload.video_key,
          bpm: payload.bpm || null
        })
        .select('id')
        .single()

      if (motorError) {
        console.error('Motor result insert error:', motorError)
        return new Response(
          JSON.stringify({ error: 'Failed to save motor result' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      resultId = motorResult.id

    } else if (payload.result_type === 'cognitive') {
      const { data: cognitiveResult, error: cognitiveError } = await supabaseClient
        .from('cognitive_results')
        .insert({
          senior_id: payload.senior_id,
          raw: payload.raw_data,
          video_key: payload.video_key
        })
        .select('id')
        .single()

      if (cognitiveError) {
        console.error('Cognitive result insert error:', cognitiveError)
        return new Response(
          JSON.stringify({ error: 'Failed to save cognitive result' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      resultId = cognitiveResult.id

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid result type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // TODO: Trigger report generation (will be implemented later with Gemini integration)
    console.log(`Result saved with ID: ${resultId}, triggering report generation...`)

    // For now, create a placeholder report entry
    const { error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        session_id: resultId,
        type: 'PDF',
        pdf_url: `placeholder_reports/${resultId}.pdf`
      })

    if (reportError) {
      console.error('Report placeholder insert error:', reportError)
      // Don't fail the request if report creation fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result_id: resultId,
        message: 'Training result uploaded successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Upload results error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})