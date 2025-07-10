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
export const createOrganizationInDynamoDB = async (orgData: any) => {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    
    // DynamoDB에 저장할 데이터 구조
    const dynamoData = {
      id: orgData.id || crypto.randomUUID(),
      organizationName: orgData.name,
      orgName: orgData.name,
      name: orgData.name,
      contactEmail: orgData.contact_email,
      contactPhone: orgData.contact_phone,
      address: orgData.address,
      licenseLimit: orgData.license_limit,
      subscriptionPlan: orgData.subscription_plan,
      orgType: orgData.org_type,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Admin 정보
      adminName: orgData.admin_name,
      adminEmail: orgData.admin_email,
      adminPhone: orgData.admin_phone,
      
      // 추가 메타데이터
      source: 'admin_panel',
      version: '1.0'
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