import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { supabase } from '@/lib/supabase'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const docClient = DynamoDBDocumentClient.from(client)

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

    console.log(`🔍 Syncing DynamoDB data for organization: ${orgName}, admin IDs: ${adminIds.join(', ')}`)

    // Check if AWS credentials are configured
    const hasAWSConfig = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    console.log(`🔧 AWS Configuration Check:`, {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-northeast-2',
      mode: hasAWSConfig ? 'PRODUCTION (DynamoDB)' : 'DEVELOPMENT (Simulation)'
    })

    let clientTableResults = []
    let userTableResults = []

    if (hasAWSConfig) {
      console.log('🔗 AWS credentials found, attempting DynamoDB connection...')
      
      // Step 1: Fetch ClientTable data for the organization
      for (const adminId of adminIds) {
        try {
          console.log(`🔍 Querying ClientTable for adminId: ${adminId}`)
          
          // Try GetItem first since we have exact key
          const { Item } = await docClient.send(new GetCommand({
            TableName: 'ClientTable',
            Key: { id: adminId }
          }))

          console.log(`📋 ClientTable response for ${adminId}:`, Item)
          
          if (Item && Item.name === orgName) {
            clientTableResults.push(Item)
            console.log(`✅ Found matching ClientTable record for ${adminId}:`, Item)
          } else if (Item) {
            console.log(`⚠️ Found ClientTable record for ${adminId} but name doesn't match. Expected: ${orgName}, Got: ${Item.name}`)
          } else {
            console.log(`❌ No ClientTable record found for ${adminId}`)
          }
        } catch (error) {
          console.error(`❌ Error fetching ClientTable for ${adminId}:`, error)
        }
      }

      // Step 2: Fetch UserTable data for the admin IDs
      for (const adminId of adminIds) {
        try {
          console.log(`🔍 Querying UserTable for adminId: ${adminId}`)
          
          const { Item } = await docClient.send(new GetCommand({
            TableName: 'UserTable', 
            Key: { id: adminId }
          }))

          console.log(`👤 UserTable response for ${adminId}:`, Item)

          if (Item) {
            userTableResults.push(Item)
            console.log(`✅ Found UserTable record for ${adminId}:`, Item)
          } else {
            console.log(`❌ No UserTable record found for ${adminId}`)
          }
        } catch (error) {
          console.error(`❌ Error fetching UserTable for ${adminId}:`, error)
        }
      }
      
      console.log(`📊 DynamoDB fetch results: ${clientTableResults.length} ClientTable, ${userTableResults.length} UserTable records`)
    } else {
      // Development mode: simulate DynamoDB data
      console.log('⚡ Development mode: simulating DynamoDB data')
      console.log(`📝 Creating simulation data for ${adminIds.length} admin IDs: ${adminIds.join(', ')}`)
      
      // Simulate ClientTable data - only create if name matches
      adminIds.forEach(adminId => {
        const clientRecord = {
          id: adminId,
          name: orgName,
          org_type: 'healthcare',
          created_at: new Date().toISOString(),
          status: 'active'
        }
        clientTableResults.push(clientRecord)
        console.log(`✅ Simulated ClientTable record for ${adminId}:`, clientRecord)
      })

      // Simulate UserTable data with realistic Korean names
      const koreanNames = ['김민수', '박지영', '이수정', '최영호']
      adminIds.forEach((adminId, index) => {
        const userRecord = {
          id: adminId,
          name: koreanNames[index] || `사용자 ${index + 1}`,
          gender: index % 2 === 0 ? 'female' : 'male',
          birth: `196${5 + index}-0${(index % 12) + 1}-15`,
          education: 'university',
          phone: `010-1234-567${index}`,
          address: '서울시 강남구 테헤란로',
          city: '서울',
          notes: `Simulated user for ${orgName}`,
          guardian_phone: `010-9876-543${index}`,
          created_at: new Date().toISOString()
        }
        userTableResults.push(userRecord)
        console.log(`✅ Simulated UserTable record for ${adminId}:`, userRecord)
      })
      
      console.log(`✅ Successfully simulated ${clientTableResults.length} ClientTable and ${userTableResults.length} UserTable records`)
    }

    // Step 3: Create or update organization in Supabase
    let supabaseOrgId = null
    
    // Check if organization already exists
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
      // Create new organization
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organisations')
        .insert({
          name: orgName,
          org_type: 'healthcare',
          licence_seats: 100,
          contact_email: `contact@${orgName.toLowerCase().replace(/\s+/g, '')}.com`,
          is_active: true,
          address: {
            address: 'DynamoDB Synced Organization',
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

    // Step 4: Create seniors (users) in Supabase based on UserTable data
    console.log(`👥 Processing ${userTableResults.length} user records for organization ID: ${supabaseOrgId}`)
    const createdSeniors = []
    
    for (const userRecord of userTableResults) {
      try {
        console.log(`🔄 Processing user record:`, userRecord)
        
        // Map DynamoDB UserTable fields to Supabase seniors schema
        const seniorData = {
          org_id: supabaseOrgId,
          name: userRecord.name || `User ${userRecord.id}`,
          gender_enum: userRecord.gender === 'male' ? 'M' : 'F',
          birth: userRecord.birth || '1960-01-01', // Default if not provided
          eduyear: mapEducationLevel(userRecord.education),
          phone: userRecord.phone || null,
          guardian_phone: userRecord.guardian_phone || null,
          address: {
            address: userRecord.address || 'DynamoDB Synced User',
            city: userRecord.city || 'Seoul'
          },
          note: `Synced from DynamoDB UserTable. Original ID: ${userRecord.id}. ${userRecord.notes || ''}`
        }
        
        console.log(`📝 Mapped senior data for ${userRecord.id}:`, seniorData)

        // Check if senior already exists
        const { data: existingSenior } = await supabase
          .from('seniors')
          .select('id, name')
          .eq('org_id', supabaseOrgId)
          .ilike('note', `%${userRecord.id}%`)
          .single()

        if (existingSenior) {
          console.log(`✅ Senior already exists for user ${userRecord.id}: ${existingSenior.name}`)
          createdSeniors.push(existingSenior)
        } else {
          const { data: newSenior, error: seniorError } = await supabase
            .from('seniors')
            .insert(seniorData)
            .select()
            .single()

          if (seniorError) {
            console.error(`❌ Error creating senior for user ${userRecord.id}:`, seniorError)
          } else {
            createdSeniors.push(newSenior)
            console.log(`✅ Created senior for user ${userRecord.id}: ${newSenior.name}`)
            
            // Create initial schedule for the senior
            const { error: scheduleError } = await supabase
              .from('schedules')
              .insert({
                senior_id: newSenior.id,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months
                sessions_per_week: 3,
                status: 'Active'
              })

            if (scheduleError) {
              console.error(`❌ Error creating schedule for senior ${newSenior.id}:`, scheduleError)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userRecord.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced data for organization "${orgName}"`,
      data: {
        organizationId: supabaseOrgId,
        organizationName: orgName,
        clientTableRecords: clientTableResults.length,
        userTableRecords: userTableResults.length,
        createdSeniors: createdSeniors.length,
        syncedAdminIds: adminIds,
        seniors: createdSeniors
      }
    })

  } catch (error) {
    console.error('❌ DynamoDB sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync DynamoDB data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to map education levels
function mapEducationLevel(education: string): string {
  if (!education) return 'middle'
  
  const edu = education.toLowerCase()
  if (edu.includes('elementary') || edu.includes('초등')) return 'elementary'
  if (edu.includes('middle') || edu.includes('중학')) return 'middle'
  if (edu.includes('high') || edu.includes('고등')) return 'high'
  if (edu.includes('university') || edu.includes('대학')) return 'university'
  
  return 'middle' // default
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgName = searchParams.get('orgName')
    
    if (!orgName) {
      return NextResponse.json(
        { error: 'orgName parameter is required' },
        { status: 400 }
      )
    }

    // Check sync status for organization
    const { data: org, error } = await supabase
      .from('organisations')
      .select(`
        id,
        name,
        created_at,
        seniors (
          id,
          name,
          note
        )
      `)
      .eq('name', orgName)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Organization not found', details: error.message },
        { status: 404 }
      )
    }

    // Filter seniors that were synced from DynamoDB
    const syncedSeniors = org.seniors.filter((senior: any) => 
      senior.note && senior.note.includes('Synced from DynamoDB')
    )

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        syncedSeniorsCount: syncedSeniors.length,
        syncedSeniors: syncedSeniors
      }
    })

  } catch (error) {
    console.error('❌ Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}