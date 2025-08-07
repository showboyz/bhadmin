import { NextResponse } from 'next/server';
import { 
  pollRealtimeData, 
  getUserRecentActivity, 
  getOrganizationRealtimeStats,
  getRealtimePerformanceAnalysis 
} from '@/lib/dynamo-realtime';

// 실시간 DynamoDB 데이터 API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');
    
    let data;
    
    switch (type) {
      case 'user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter required for user type' },
            { status: 400 }
          );
        }
        data = await getUserRecentActivity(userId, 24);
        break;
        
      case 'organization':
        if (!orgId) {
          return NextResponse.json(
            { error: 'orgId parameter required for organization type' },
            { status: 400 }
          );
        }
        data = await getOrganizationRealtimeStats(orgId);
        break;
        
      case 'analysis':
        data = await getRealtimePerformanceAnalysis();
        break;
        
      case 'all':
      default:
        data = await pollRealtimeData();
        break;
    }
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      type
    });
    
  } catch (error) {
    console.error('Realtime DynamoDB API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch realtime data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 실시간 데이터 스트리밍 (SSE)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = parseInt(searchParams.get('interval') || '30000'); // 30초 기본값
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const sendData = async () => {
        try {
          const realtimeData = await pollRealtimeData();
          const data = `data: ${JSON.stringify(realtimeData)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('SSE error:', error);
          const errorData = `data: ${JSON.stringify({ error: 'Failed to fetch data' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };
      
      // 즉시 첫 데이터 전송
      sendData();
      
      // 정기적 업데이트
      const intervalId = setInterval(sendData, interval);
      
      // 클린업
      return () => clearInterval(intervalId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}