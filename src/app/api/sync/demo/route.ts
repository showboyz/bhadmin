import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgName, adminIds } = body

    if (!orgName || !adminIds || !Array.isArray(adminIds)) {
      return NextResponse.json(
        { error: 'orgName and adminIds array are required' },
        { status: 400 }
      )
    }

    console.log(`🚀 DEMO MODE: Syncing data for organization: ${orgName}, admin IDs: ${adminIds.join(', ')}`)
    
    // Always use simulation data for demo
    const clientTableResults = []
    const userTableResults = []
    
    // Simulate ClientTable data
    const koreanNames = ['김민수', '박지영', '이수정', '최영호']
    
    adminIds.forEach((adminId, index) => {
      const clientRecord = {
        id: adminId,
        name: orgName,
        org_type: 'healthcare',
        created_at: new Date().toISOString(),
        status: 'active'
      }
      clientTableResults.push(clientRecord)
      console.log(`✅ Demo ClientTable record for ${adminId}:`, clientRecord)
      
      const userRecord = {
        id: adminId,
        name: koreanNames[index] || `사용자 ${index + 1}`,
        gender: index % 2 === 0 ? 'female' : 'male',
        birth: `196${5 + index}-${String((index % 12) + 1).padStart(2, '0')}-15`,
        education: 'university',
        phone: `010-1234-567${index}`,
        address: '서울시 강남구 테헤란로',
        city: '서울',
        notes: `Demo user for ${orgName}`,
        guardian_phone: `010-9876-543${index}`,
        created_at: new Date().toISOString()
      }
      userTableResults.push(userRecord)
      console.log(`✅ Demo UserTable record for ${adminId}:`, userRecord)
    })

    // Create or update organization in Supabase
    let supabaseOrgId = null
    
    const { data: existingOrg, error: checkError } = await supabase
      .from('organisations')
      .select('id, name')
      .eq('name', orgName)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing organization:', checkError)
    }

    if (existingOrg) {
      supabaseOrgId = existingOrg.id
      console.log(`✅ Organization "${orgName}" already exists with ID: ${supabaseOrgId}`)
    } else {
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organisations')
        .insert({
          name: orgName,
          org_type: 'healthcare',
          licence_seats: 100,
          contact_email: `contact@${orgName.toLowerCase().replace(/\s+/g, '')}.com`,
          is_active: true,
          address: {
            address: 'DynamoDB Demo Organization',
            city: 'Seoul',
            country: 'KR'
          }
        })
        .select()
        .single()

      if (createOrgError) {
        console.error('Error creating organization:', createOrgError)
        return NextResponse.json(
          { error: 'Failed to create organization', details: createOrgError.message },
          { status: 500 }
        )
      }

      supabaseOrgId = newOrg.id
      console.log(`✅ Created new organization "${orgName}" with ID: ${supabaseOrgId}`)
    }

    // Create seniors
    console.log(`👥 Processing ${userTableResults.length} user records for organization ID: ${supabaseOrgId}`)
    const createdSeniors = []
    
    for (const userRecord of userTableResults) {
      try {
        console.log(`🔄 Processing user record:`, userRecord.name)
        
        const seniorData = {
          org_id: supabaseOrgId,
          name: userRecord.name,
          gender_enum: userRecord.gender === 'male' ? 'M' : 'F',
          birth: userRecord.birth,
          eduyear: 'university',
          phone: userRecord.phone,
          guardian_phone: userRecord.guardian_phone,
          address: {
            address: userRecord.address,
            city: userRecord.city
          },
          note: `Demo sync from DynamoDB. Original ID: ${userRecord.id}. ${userRecord.notes}`
        }

        // Check if senior already exists
        const { data: existingSenior } = await supabase
          .from('seniors')
          .select('id, name')
          .eq('org_id', supabaseOrgId)
          .ilike('note', `%${userRecord.id}%`)
          .single()

        if (existingSenior) {
          console.log(`✅ Senior already exists: ${existingSenior.name}`)
          createdSeniors.push(existingSenior)
        } else {
          const { data: newSenior, error: seniorError } = await supabase
            .from('seniors')
            .insert(seniorData)
            .select()
            .single()

          if (seniorError) {
            console.error(`❌ Error creating senior:`, seniorError)
          } else {
            createdSeniors.push(newSenior)
            console.log(`✅ Created senior: ${newSenior.name}`)
            
            // Create schedule
            const { error: scheduleError } = await supabase
              .from('schedules')
              .insert({
                senior_id: newSenior.id,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                sessions_per_week: 3,
                status: 'Active'
              })

            if (scheduleError) {
              console.error(`❌ Error creating schedule:`, scheduleError)
            } else {
              console.log(`✅ Created schedule for: ${newSenior.name}`)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userRecord.id}:`, error)
      }
    }

    const result = {
      organizationId: supabaseOrgId,
      organizationName: orgName,
      clientTableRecords: clientTableResults.length,
      userTableRecords: userTableResults.length,
      createdSeniors: createdSeniors.length,
      syncedAdminIds: adminIds,
      seniors: createdSeniors
    }

    console.log(`🎉 Demo sync completed successfully:`, result)

    return NextResponse.json({
      success: true,
      message: `Successfully synced demo data for organization "${orgName}"`,
      data: result
    })

  } catch (error) {
    console.error('❌ Demo sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync demo data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}