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

export const dynamoDbClient = DynamoDBDocumentClient.from(client);

// 기관 테이블 조회 함수 (모든 클라이언트 데이터)
export const getOrganizations = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
    });
    
    const response = await dynamoDbClient.send(command);
    
    // 응답 데이터를 로그로 확인
    console.log('DynamoDB Raw Response:', JSON.stringify(response, null, 2));
    
    return response.Items || [];
  } catch (error) {
    console.error('Error fetching organizations from DynamoDB:', error);
    console.error('Error details:', error);
    throw error;
  }
};

// 기관별로 그룹화된 조회 함수 (한 기관에 여러 ID가 있는 경우)
export const getGroupedOrganizations = async () => {
  try {
    const allItems = await getOrganizations();
    
    // 기관별로 그룹화 (organizationName 또는 비슷한 필드 기준)
    const grouped = allItems.reduce((acc: any, item: any) => {
      // 실제 필드명은 데이터 구조에 따라 조정 필요
      const orgKey = item.organizationName || item.orgName || item.name || 'Unknown';
      
      if (!acc[orgKey]) {
        acc[orgKey] = [];
      }
      acc[orgKey].push(item);
      
      return acc;
    }, {});
    
    return grouped;
  } catch (error) {
    console.error('Error grouping organizations:', error);
    throw error;
  }
};

// 특정 기관 조회 함수
export const getOrganizationById = async (id: string) => {
  try {
    const command = new QueryCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'Organizations',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
    });
    
    const response = await dynamoDbClient.send(command);
    return response.Items?.[0] || null;
  } catch (error) {
    console.error('Error fetching organization by ID from DynamoDB:', error);
    throw error;
  }
};

// 기관 생성 함수 (DynamoDB)
// DynamoDB에서 기관명 중복 검사
export const checkOrganizationExists = async (organizationName: string) => {
  try {
    const allItems = await getOrganizations();
    
    // 기관명 중복 검사 (organizationName, orgName, name 모든 필드 확인)
    const existingOrg = allItems.find((item: any) => 
      item.organizationName === organizationName ||
      item.orgName === organizationName ||
      item.name === organizationName
    );
    
    return !!existingOrg;
  } catch (error) {
    console.error('Error checking organization existence in DynamoDB:', error);
    // 검사 실패시 false 반환 (안전한 쪽으로)
    return false;
  }
};

export const createOrganizationInDynamoDB = async (orgData: any) => {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    
    // DynamoDB에 저장할 데이터 구조 (백업용 - 5개 필드)
    const dynamoData = {
      id: orgData.admin_id, // 앱 로그인 ID를 DynamoDB의 id로 사용
      password: orgData.admin_password, // 앱 패스워드
      name: orgData.name, // 기관명
      accesspermission: "1", // 접근 권한 (기본값 "1")
      timestamp: new Date().toISOString() // 타임스탬프
    };
    
    const command = new PutCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
      Item: dynamoData,
    });
    
    await dynamoDbClient.send(command);
    console.log('Organization created in DynamoDB:', dynamoData);
    return dynamoData;
  } catch (error) {
    console.error('Error creating organization in DynamoDB:', error);
    throw error;
  }
};

// 기관 업데이트 함수 (DynamoDB)
export const updateOrganizationInDynamoDB = async (id: string, updateData: any) => {
  try {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const command = new UpdateCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'ClientTable',
      Key: { id },
      UpdateExpression: 'SET updatedAt = :updatedAt, #name = :name, contactEmail = :email, contactPhone = :phone',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':updatedAt': new Date().toISOString(),
        ':name': updateData.name,
        ':email': updateData.contact_email,
        ':phone': updateData.contact_phone
      },
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await dynamoDbClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('Error updating organization in DynamoDB:', error);
    throw error;
  }
};