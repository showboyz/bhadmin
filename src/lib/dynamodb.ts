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

// 기관 테이블 조회 함수
export const getOrganizations = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'Organizations',
    });
    
    const response = await dynamoDbClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error fetching organizations from DynamoDB:', error);
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

// 기관 생성 함수
export const createOrganization = async (orgData: any) => {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new PutCommand({
      TableName: process.env.DYNAMODB_ORGANIZATIONS_TABLE || 'Organizations',
      Item: {
        ...orgData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    
    await dynamoDbClient.send(command);
    return orgData;
  } catch (error) {
    console.error('Error creating organization in DynamoDB:', error);
    throw error;
  }
};