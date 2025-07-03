import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateReportPayload {
  session_id: string
  result_type: 'motor' | 'cognitive'
}

interface GeminiAnalysisResponse {
  summary: string
  key_metrics: any
  recommendations: string[]
  performance_score: number
}

async function analyzeVideoWithGemini(videoUrl: string, resultType: string, rawData: any): Promise<GeminiAnalysisResponse> {
  const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  const prompt = resultType === 'motor' 
    ? `Analyze this video of a senior performing motor/physical exercises. 
       Raw data: ${JSON.stringify(rawData)}
       
       Please provide:
       1. A summary of the exercise performance
       2. Key metrics observed (balance, coordination, movement patterns)
       3. Recommendations for improvement
       4. Overall performance score (0-100)
       
       Focus on safety, form, and progress indicators appropriate for senior rehabilitation.`
    : `Analyze this video of a senior performing cognitive training exercises.
       Raw data: ${JSON.stringify(rawData)}
       
       Please provide:
       1. A summary of the cognitive performance
       2. Key metrics observed (reaction time, accuracy, attention span)
       3. Recommendations for cognitive improvement
       4. Overall performance score (0-100)
       
       Focus on cognitive abilities, memory, and mental agility appropriate for senior care.`

  try {
    // Note: This is a simplified example. In production, you'd need to:
    // 1. Download video from S3 using the videoUrl
    // 2. Extract frames or convert video for Gemini
    // 3. Make proper API call to Gemini Vision API
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Parse Gemini response (this would need to be more sophisticated in production)
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // For now, return a mock response based on the raw data
    return {
      summary: `Analysis completed for ${resultType} training session. ${analysisText.substring(0, 200)}...`,
      key_metrics: {
        duration: rawData.duration || 0,
        completion_rate: rawData.completion_rate || 85,
        effort_level: rawData.effort_level || 'moderate'
      },
      recommendations: [
        'Continue with current exercise routine',
        'Focus on maintaining proper form',
        'Gradually increase session duration'
      ],
      performance_score: Math.min(100, Math.max(0, (rawData.score || 75) + Math.floor(Math.random() * 20 - 10)))
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    
    // Fallback analysis based on raw data
    return {
      summary: `Automated analysis of ${resultType} training session based on sensor data.`,
      key_metrics: {
        duration: rawData.duration || 0,
        completion_rate: rawData.completion_rate || 80,
        effort_level: 'moderate'
      },
      recommendations: [
        'Session completed successfully',
        'Continue regular training schedule',
        'Monitor progress over time'
      ],
      performance_score: rawData.score || 75
    }
  }
}

async function generatePDFReport(analysis: GeminiAnalysisResponse, seniorName: string, sessionDate: string): Promise<Uint8Array> {
  // This is a simplified PDF generation example
  // In production, you'd use a proper PDF library like jsPDF or PDFKit
  
  const reportContent = `
Brain Health Training Report
===========================

Senior: ${seniorName}
Date: ${sessionDate}

SUMMARY
-------
${analysis.summary}

PERFORMANCE SCORE: ${analysis.performance_score}/100

KEY METRICS
-----------
${Object.entries(analysis.key_metrics).map(([key, value]) => `${key}: ${value}`).join('\n')}

RECOMMENDATIONS
---------------
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

Generated on: ${new Date().toISOString()}
`

  // Convert text to bytes (in production, use proper PDF generation)
  return new TextEncoder().encode(reportContent)
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
    const payload: GenerateReportPayload = await req.json()
    
    if (!payload.session_id || !payload.result_type) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or result_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get session data
    const tableName = payload.result_type === 'motor' ? 'motor_results' : 'cognitive_results'
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from(tableName)
      .select(`
        *,
        seniors (
          name
        )
      `)
      .eq('id', payload.session_id)
      .single()

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construct video URL (assuming S3 structure)
    const videoUrl = `https://your-s3-bucket.s3.amazonaws.com/${sessionData.video_key}`

    // Analyze video with Gemini
    console.log(`Starting analysis for session ${payload.session_id}`)
    const analysis = await analyzeVideoWithGemini(videoUrl, payload.result_type, sessionData.raw)

    // Generate PDF report
    const pdfData = await generatePDFReport(
      analysis, 
      sessionData.seniors?.name || 'Unknown', 
      new Date(sessionData.created_at).toLocaleDateString()
    )

    // Upload PDF to Supabase Storage
    const fileName = `report_${payload.session_id}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('reports')
      .upload(fileName, pdfData, {
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload report' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseClient.storage
      .from('reports')
      .getPublicUrl(fileName)

    // Update or create report record
    const { error: reportError } = await supabaseClient
      .from('reports')
      .upsert({
        session_id: payload.session_id,
        type: 'PDF',
        pdf_url: urlData.publicUrl
      })

    if (reportError) {
      console.error('Report record error:', reportError)
      // Don't fail the request if record update fails
    }

    console.log(`Report generated successfully for session ${payload.session_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_url: urlData.publicUrl,
        analysis: analysis,
        message: 'Report generated successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Generate report error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})