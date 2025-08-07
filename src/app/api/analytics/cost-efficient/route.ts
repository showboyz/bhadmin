import { NextResponse } from 'next/server';
import { 
  getUserLatestRecords,
  getSmartAnalysis,
  preCalculateStats,
  getPaginatedData,
  estimateCost
} from '@/lib/dynamo-cost-efficient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'smart';
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let data;
    let estimatedCost = 0;
    
    switch (type) {
      case 'user-latest':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for user-latest type' },
            { status: 400 }
          );
        }
        
        // 사용자별 최신 데이터 (매우 저렴)
        const [synapsologyData, snoobyData] = await Promise.all([
          getUserLatestRecords(userId, 'SynapsologyLogTable', limit),
          getUserLatestRecords(userId, 'SnoobyLogTable', limit)
        ]);
        
        data = {
          userId,
          synapsologyTests: synapsologyData,
          snoobyGames: snoobyData,
          totalRecords: synapsologyData.length + snoobyData.length
        };
        estimatedCost = estimateCost('query', data.totalRecords);
        break;
        
      case 'stats':
        // 미리 계산된 통계 (거의 무료)
        data = await preCalculateStats();
        estimatedCost = 0.1; // 캐시된 데이터
        break;
        
      case 'smart-analysis':
        const analysisType = searchParams.get('analysis') || 'recent-activity';
        data = await getSmartAnalysis(analysisType);
        estimatedCost = estimateCost('query', 10); // 제한된 데이터만
        break;
        
      case 'paginated':
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const lastKey = searchParams.get('lastKey') ? 
          JSON.parse(searchParams.get('lastKey')!) : null;
        
        data = await getPaginatedData('SynapsologyLogTable', lastKey, pageSize);
        estimatedCost = estimateCost('limitedScan', pageSize);
        break;
        
      case 'smart':
      default:
        // 기본: 캐시된 통계 + 최신 활동 조금
        const [stats, recentActivity] = await Promise.all([
          getSmartAnalysis('user-count'),
          getSmartAnalysis('recent-activity')
        ]);
        
        data = {
          overview: stats,
          recentActivity,
          note: 'Cached data - very low cost'
        };
        estimatedCost = 0.2; // 거의 무료
        break;
    }
    
    return NextResponse.json({
      success: true,
      data,
      costInfo: {
        estimatedRCU: estimatedCost,
        costLevel: estimatedCost < 1 ? 'LOW' : estimatedCost < 10 ? 'MEDIUM' : 'HIGH',
        optimization: 'Using cost-efficient queries and caching'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cost-efficient analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cost-efficient analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: 통계 미리 계산 트리거
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'pre-calculate') {
      const stats = await preCalculateStats();
      
      return NextResponse.json({
        success: true,
        message: 'Statistics pre-calculated and cached',
        data: stats,
        costInfo: {
          note: 'One-time calculation cost, saves money for future queries'
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use action: "pre-calculate"' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Pre-calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to pre-calculate statistics' },
      { status: 500 }
    );
  }
}