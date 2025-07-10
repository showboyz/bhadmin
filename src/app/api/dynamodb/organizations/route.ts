import { NextResponse } from 'next/server';
import { getOrganizations } from '@/lib/dynamodb';

export async function GET() {
  try {
    const organizations = await getOrganizations();
    
    return NextResponse.json({
      success: true,
      data: organizations,
      count: organizations.length,
    });
  } catch (error) {
    console.error('DynamoDB API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch organizations from DynamoDB',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
    });
  }
}