import { supabase } from './supabase'

interface UploadResultsPayload {
  senior_id: string
  result_type: 'motor' | 'cognitive'
  raw_data: any
  video_key: string
  bpm?: number
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

interface GenerateReportPayload {
  session_id: string
  result_type: 'motor' | 'cognitive'
}

export async function uploadTrainingResults(payload: UploadResultsPayload) {
  try {
    const { data, error } = await supabase.functions.invoke('upload_results', {
      body: payload
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to upload results' 
    }
  }
}

export async function createSeniorViaEdgeFunction(payload: CreateSeniorPayload) {
  try {
    const { data, error } = await supabase.functions.invoke('create_senior', {
      body: payload
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create senior' 
    }
  }
}

export async function generateSessionReport(payload: GenerateReportPayload) {
  try {
    const { data, error } = await supabase.functions.invoke('generate_report', {
      body: payload
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to generate report' 
    }
  }
}

// Utility function to simulate training result upload (for testing)
export async function simulateTrainingResult(seniorId: string, resultType: 'motor' | 'cognitive') {
  const mockData = resultType === 'motor' 
    ? {
        exercise_type: 'walking',
        duration: 1800, // 30 minutes
        steps: 2400,
        distance: 1.8,
        avg_pace: '4.5 km/h',
        heart_rate_zones: {
          resting: 120,
          active: 140,
          peak: 155
        },
        completion_rate: 95,
        effort_level: 'moderate'
      }
    : {
        test_type: 'memory',
        duration: 900, // 15 minutes
        total_questions: 20,
        correct_answers: 17,
        reaction_time_avg: 1.2,
        attention_span: 85,
        completion_rate: 90,
        difficulty_level: 'intermediate'
      }

  const mockVideoKey = `training_videos/${seniorId}/${Date.now()}.mp4`

  return await uploadTrainingResults({
    senior_id: seniorId,
    result_type: resultType,
    raw_data: mockData,
    video_key: mockVideoKey,
    bpm: resultType === 'motor' ? 140 : undefined
  })
}

// Utility function to get presigned S3 URL for video upload
export async function getVideoUploadUrl(seniorId: string, sessionType: string) {
  // This would typically call an Edge Function that generates a presigned S3 URL
  // For now, return a mock URL structure
  const timestamp = Date.now()
  const fileName = `${seniorId}_${sessionType}_${timestamp}.mp4`
  
  return {
    uploadUrl: `https://your-s3-bucket.s3.amazonaws.com/training_videos/${fileName}?presigned=true`,
    videoKey: `training_videos/${fileName}`,
    expiresIn: 3600 // 1 hour
  }
}