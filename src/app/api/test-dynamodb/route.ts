import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

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
    const { action, data } = await request.json()
    
    console.log(`🧪 Testing DynamoDB action: ${action}`)
    console.log('AWS Config:', {
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      tableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable'
    })

    if (action === 'scan') {
      // 테이블 전체 조회 테스트
      const scanCommand = new ScanCommand({
        TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
        Limit: 5 // 최대 5개만 가져오기
      })
      
      const result = await docClient.send(scanCommand)
      
      return NextResponse.json({
        success: true,
        action: 'scan',
        count: result.Count || 0,
        items: result.Items || [],
        message: `Found ${result.Count || 0} items in table`
      })

    } else if (action === 'put') {
      // 실제 데이터 삽입
      const testItem = data || {
        id: `test_${Date.now()}`,
        name: '테스트기관',
        password: 'test123',
        accesspermission: '1',
        timestamp: new Date().toISOString()
      }
      
      const putCommand = new PutCommand({
        TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
        Item: testItem
      })
      
      await docClient.send(putCommand)
      
      return NextResponse.json({
        success: true,
        action: 'put',
        item: testItem,
        message: 'Test item created successfully'
      })

    } else if (action === 'get') {
      // 특정 ID로 조회 테스트
      const testId = data?.id || 'yy3v07' // 동적 ID 또는 기본값
      
      const getCommand = new GetCommand({
        TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
        Key: { id: testId }
      })
      
      const result = await docClient.send(getCommand)
      
      return NextResponse.json({
        success: true,
        action: 'get',
        searchId: testId,
        found: !!result.Item,
        item: result.Item || null,
        message: result.Item ? 'Item found' : 'Item not found'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: scan, put, or get'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ DynamoDB test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'DynamoDB operation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      awsConfig: {
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        tableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'DynamoDB test endpoint',
    availableActions: ['scan', 'put', 'get'],
    usage: 'POST with { "action": "scan|put|get" }'
  })
}