import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract form data and map to seniors table structure
    const {
      fullName,
      gender,
      birthDate,
      phone,
      grade,
      guardian,
      address,
      healthStatus,
      programType,
      startDate,
      sessionFrequency,
      preferredTime,
      specialRequirements,
      cognitiveLevel,
      physicalLevel,
      primaryGoals,
      medicalNotes,
      emergencyContact,
      orgId
    } = body

    // Map gender to database enum
    const genderEnum = gender === 'Male' ? 'M' : 'F'
    
    // Map grade to education level enum
    const eduYearMap: { [key: string]: string } = {
      'beginner': 'elementary',
      'intermediate': 'middle', 
      'advanced': 'high'
    }
    const eduyear = eduYearMap[grade] || 'middle'

    // Create senior record
    const { data: senior, error: seniorError } = await supabase
      .from('seniors')
      .insert({
        org_id: orgId,
        name: fullName,
        gender_enum: genderEnum,
        birth: birthDate,
        eduyear: eduyear,
        phone: phone,
        guardian_phone: emergencyContact,
        address: {
          address: address,
          city: address // Simplified - could be parsed better
        },
        note: `Health: ${healthStatus}. Goals: ${primaryGoals}. Medical: ${medicalNotes}. Special requirements: ${specialRequirements}`
      })
      .select()
      .single()

    if (seniorError) {
      console.error('Error creating senior:', seniorError)
      return NextResponse.json(
        { error: 'Failed to create senior', details: seniorError.message },
        { status: 500 }
      )
    }

    // Create schedule if program details provided
    if (senior && startDate && sessionFrequency) {
      const sessionsPerWeek = parseInt(sessionFrequency) || 3
      const scheduleEndDate = new Date(startDate)
      scheduleEndDate.setMonth(scheduleEndDate.getMonth() + 3) // 3 months program

      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert({
          senior_id: senior.id,
          start_date: startDate,
          end_date: scheduleEndDate.toISOString().split('T')[0],
          sessions_per_week: sessionsPerWeek,
          status: 'Active'
        })

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError)
        // Don't fail the whole request if schedule creation fails
      }
    }

    return NextResponse.json({
      success: true,
      senior: senior,
      message: 'Senior created successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    // UUID 형식 검증
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }

    let query = supabase
      .from('seniors')
      .select(`
        *,
        schedules (
          id,
          start_date,
          end_date,
          status,
          sessions_per_week
        )
      `)

    if (orgId) {
      // UUID 형식 검증
      if (!isValidUUID(orgId)) {
        console.error('Invalid org_id format:', orgId)
        return NextResponse.json(
          { error: 'Invalid organization ID format', details: 'org_id must be a valid UUID' },
          { status: 400 }
        )
      }
      query = query.eq('org_id', orgId)
    }

    const { data: seniors, error } = await query

    if (error) {
      console.error('Error fetching seniors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch seniors', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      seniors: seniors || [],
      count: seniors?.length || 0
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}