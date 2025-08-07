import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 설정
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoDbClient = DynamoDBDocumentClient.from(client);

// 실시간 데이터 인터페이스
export interface RealtimeData {
  synapsologyTests: any[]
  snoobyGames: any[]
  totalTests: number
  totalGames: number
  lastUpdated: string
}

// 최근 데이터 조회 (타임스탬프 기반)
export const scanRecentData = async (tableName: string, sinceTimestamp: string, limit = 50) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#timestamp > :since',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':since': sinceTimestamp
      },
      Limit: limit,
      ScanIndexForward: false // 최신 순으로
    });
    
    const response = await dynamoDbClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error(`Error scanning ${tableName}:`, error);
    return [];
  }
};

// 실시간 데이터 폴링 (1분 간격)
export const pollRealtimeData = async (): Promise<RealtimeData> => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const timestamp = oneMinuteAgo.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  
  try {
    const [synapsologyTests, snoobyGames] = await Promise.all([
      scanRecentData('SynapsologyLogTable', timestamp),
      scanRecentData('SnoobyLogTable', timestamp)
    ]);
    
    return {
      synapsologyTests,
      snoobyGames, 
      totalTests: synapsologyTests.length,
      totalGames: snoobyGames.length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error polling realtime data:', error);
    return {
      synapsologyTests: [],
      snoobyGames: [],
      totalTests: 0,
      totalGames: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

// 사용자별 최근 활동 조회
export const getUserRecentActivity = async (userId: string, hours = 24) => {
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  const timestamp = hoursAgo.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  
  try {
    const [synapsologyTests, snoobyGames] = await Promise.all([
      scanRecentData('SynapsologyLogTable', timestamp),
      scanRecentData('SnoobyLogTable', timestamp)
    ]);
    
    // 특정 사용자 데이터 필터링
    const userSynapsology = synapsologyTests.filter(test => test.id === userId);
    const userSnooby = snoobyGames.filter(game => game.id === userId);
    
    return {
      userId,
      synapsologyTests: userSynapsology,
      snoobyGames: userSnooby,
      totalActivity: userSynapsology.length + userSnooby.length,
      period: `${hours}h`
    };
  } catch (error) {
    console.error('Error getting user recent activity:', error);
    return null;
  }
};

// 기관별 실시간 통계
export const getOrganizationRealtimeStats = async (orgId: string) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const timestamp = oneHourAgo.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  
  try {
    const [synapsologyTests, snoobyGames] = await Promise.all([
      scanRecentData('SynapsologyLogTable', timestamp, 100),
      scanRecentData('SnoobyLogTable', timestamp, 100)
    ]);
    
    // 기관별 필터링 (origin_from 필드 사용)
    const orgSynapsology = synapsologyTests.filter(test => 
      test.origin_from?.includes(orgId) || test.id === orgId
    );
    const orgSnooby = snoobyGames.filter(game => 
      game.origin_from?.includes(orgId) || game.id === orgId  
    );
    
    // 통계 계산
    const activeUsers = new Set([
      ...orgSynapsology.map(t => t.id),
      ...orgSnooby.map(g => g.id)
    ]).size;
    
    return {
      orgId,
      activeUsers,
      testsCompleted: orgSynapsology.length,
      gamesCompleted: orgSnooby.length,
      totalActivity: orgSynapsology.length + orgSnooby.length,
      lastHour: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting organization stats:', error);
    return null;
  }
};

// 실시간 성과 분석
export const getRealtimePerformanceAnalysis = async () => {
  const realtimeData = await pollRealtimeData();
  
  const analysis = {
    // 시냅솔로지 분석
    synapsologyStats: {
      averageCorrectRate: 0,
      averageReactionTime: 0,
      difficultyDistribution: {} as Record<string, number>
    },
    
    // 스누비 분석  
    snoobyStats: {
      averageAccuracy: 0,
      completionRate: 0,
      stageDistribution: {} as Record<string, number>
    },
    
    timestamp: realtimeData.lastUpdated
  };
  
  // 시냅솔로지 성과 계산
  if (realtimeData.synapsologyTests.length > 0) {
    const tests = realtimeData.synapsologyTests;
    
    // 정답률 계산
    let totalCorrect = 0, totalQuestions = 0;
    tests.forEach(test => {
      try {
        const correct = JSON.parse(test.correct || '[]');
        totalCorrect += correct.filter((c: number) => c > 0).length;
        totalQuestions += correct.length;
      } catch (e) { /* 파싱 오류 무시 */ }
    });
    
    analysis.synapsologyStats.averageCorrectRate = 
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    // 난이도 분포
    tests.forEach(test => {
      const difficulty = test.difficulty || 'unknown';
      analysis.synapsologyStats.difficultyDistribution[difficulty] = 
        (analysis.synapsologyStats.difficultyDistribution[difficulty] || 0) + 1;
    });
  }
  
  // 스누비 성과 계산
  if (realtimeData.snoobyGames.length > 0) {
    const games = realtimeData.snoobyGames;
    
    // 스테이지 분포
    games.forEach(game => {
      const stage = game.stage || 'unknown';
      analysis.snoobyStats.stageDistribution[stage] = 
        (analysis.snoobyStats.stageDistribution[stage] || 0) + 1;
    });
    
    analysis.snoobyStats.completionRate = 
      (games.length / (games.length || 1)) * 100; // 임시 계산
  }
  
  return analysis;
};