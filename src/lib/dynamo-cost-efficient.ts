import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoDbClient = DynamoDBDocumentClient.from(client);

// 방법 1: 특정 사용자 데이터만 Query (가장 비용 효율적)
export const getUserDataByQuery = async (userId: string, tableName: string) => {
  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      // 최근 데이터만 (옵션)
      ScanIndexForward: false,  // 최신순
      Limit: 50  // 최대 50개만
    });
    
    const response = await dynamoDbClient.send(command);
    console.log(`💰 Query 비용: ~${response.Items?.length || 0} RCU`);
    return response.Items || [];
  } catch (error) {
    console.error(`Query error for ${userId}:`, error);
    return [];
  }
};

// 방법 2: 여러 사용자 데이터 BatchGet (중간 비용)
export const getMultipleUsersData = async (userIds: string[], tableName: string) => {
  try {
    const keys = userIds.map(id => ({ id }));
    
    const command = new BatchGetCommand({
      RequestItems: {
        [tableName]: {
          Keys: keys
        }
      }
    });
    
    const response = await dynamoDbClient.send(command);
    const items = response.Responses?.[tableName] || [];
    console.log(`💰 BatchGet 비용: ~${items.length} RCU`);
    return items;
  } catch (error) {
    console.error('BatchGet error:', error);
    return [];
  }
};

// 방법 3: 제한된 Scan (최후 수단, 비용 제한 적용)
export const getLimitedScanData = async (tableName: string, maxItems = 10) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: maxItems,  // 비용 제한
      Select: 'SPECIFIC_ATTRIBUTES',  // 필요한 필드만
      AttributesToGet: [
        'id', 'timestamp', 'name', 'status', 
        // 핵심 필드만 선택하여 전송량 감소
      ]
    });
    
    const response = await dynamoDbClient.send(command);
    console.log(`💰 Limited Scan 비용: ~${response.ScannedCount} RCU`);
    return response.Items || [];
  } catch (error) {
    console.error('Limited scan error:', error);
    return [];
  }
};

// 방법 4: 캐싱을 활용한 비용 절약
interface CacheEntry {
  data: any[];
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

export const getCachedData = async (
  cacheKey: string, 
  fetchFunction: () => Promise<any[]>,
  ttlMinutes = 5
) => {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  
  // 캐시 히트 - 비용 0
  if (cached && (now - cached.timestamp) < cached.ttl) {
    console.log(`💚 Cache HIT for ${cacheKey} - 비용: 0 RCU`);
    return cached.data;
  }
  
  // 캐시 미스 - DynamoDB 호출
  console.log(`💸 Cache MISS for ${cacheKey} - DynamoDB 호출`);
  const data = await fetchFunction();
  
  // 캐시 저장
  cache.set(cacheKey, {
    data,
    timestamp: now,
    ttl: ttlMinutes * 60 * 1000
  });
  
  return data;
};

// 방법 5: 페이지네이션으로 비용 제어
export const getPaginatedData = async (
  tableName: string, 
  lastKey: any = null,
  pageSize = 25
) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: pageSize,
      ExclusiveStartKey: lastKey,
      // 필요한 속성만 선택
      ProjectionExpression: 'id, #name, #timestamp, #status',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#timestamp': 'timestamp', 
        '#status': 'status'
      }
    });
    
    const response = await dynamoDbClient.send(command);
    
    return {
      items: response.Items || [],
      lastKey: response.LastEvaluatedKey,
      hasMore: !!response.LastEvaluatedKey,
      cost: `~${pageSize} RCU`
    };
  } catch (error) {
    console.error('Paginated scan error:', error);
    return { items: [], lastKey: null, hasMore: false, cost: '0 RCU' };
  }
};

// 방법 6: 사용자별 최신 N개 레코드만 (매우 효율적)
export const getUserLatestRecords = async (
  userId: string, 
  tableName: string, 
  limit = 10
) => {
  const cacheKey = `${tableName}-${userId}-latest-${limit}`;
  
  return getCachedData(cacheKey, async () => {
    return getUserDataByQuery(userId, tableName);
  }, 2); // 2분 캐시
};

// 방법 7: 통계 데이터 미리 계산해서 저장 (가장 효율적)
export const preCalculateStats = async () => {
  // 주기적으로 실행 (예: 매 시간)
  const stats = {
    totalUsers: 0,
    totalTests: 0,
    totalGames: 0,
    topPerformers: [],
    averageScores: {},
    timestamp: new Date().toISOString()
  };
  
  // 제한된 데이터로만 통계 계산
  const recentData = await getLimitedScanData('SynapsologyLogTable', 100);
  
  // 통계 계산 로직...
  stats.totalTests = recentData.length;
  
  // 계산된 통계를 캐시에 저장
  cache.set('pre-calculated-stats', {
    data: stats,
    timestamp: Date.now(),
    ttl: 60 * 60 * 1000 // 1시간 캐시
  });
  
  console.log('📊 통계 미리 계산 완료 - 실시간 조회 시 비용 0');
  return stats;
};

// 방법 8: 스마트 데이터 분석 (필요한 것만)
export const getSmartAnalysis = async (analysisType: string) => {
  const cacheKey = `analysis-${analysisType}`;
  
  return getCachedData(cacheKey, async () => {
    switch (analysisType) {
      case 'user-count':
        // 사용자 수만 필요 - 매우 제한적 scan
        const userData = await getLimitedScanData('UserTable', 1);
        return { userCount: userData.length };
        
      case 'recent-activity':
        // 최근 활동만 - 특정 사용자들만 query
        const knownUsers = ['pumasi', 'bitown', 'lifelog_north'];
        const activities = await Promise.all(
          knownUsers.map(userId => 
            getUserLatestRecords(userId, 'SynapsologyLogTable', 5)
          )
        );
        return { recentActivities: activities.flat() };
        
      default:
        return {};
    }
  }, 10); // 10분 캐시
};

// 비용 모니터링
export const estimateCost = (operation: string, itemCount: number) => {
  const costs = {
    query: itemCount * 0.5,      // Query는 매우 저렴
    batchGet: itemCount * 0.5,   // BatchGet도 저렴
    scan: itemCount * 1.0,       // Scan은 비쌈
    limitedScan: Math.min(itemCount, 25) * 1.0  // 제한된 scan
  };
  
  console.log(`💰 예상 비용 (${operation}): ~${costs[operation as keyof typeof costs] || 0} RCU`);
  return costs[operation as keyof typeof costs] || 0;
};