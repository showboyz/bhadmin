import { NextResponse } from 'next/server';
import { getOrganizations, getGroupedOrganizations } from '@/lib/dynamodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';
    
    if (grouped) {
      const groupedOrganizations = await getGroupedOrganizations();
      
      return NextResponse.json({
        success: true,
        data: groupedOrganizations,
        type: 'grouped',
        organizationCount: Object.keys(groupedOrganizations).length,
        totalRecords: Object.values(groupedOrganizations).flat().length,
      });
    } else {
      const organizations = await getOrganizations();
      
      return NextResponse.json({
        success: true,
        data: organizations,
        type: 'raw',
        count: organizations.length,
      });
    }
  } catch (error) {
    console.error('DynamoDB API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch organizations from DynamoDB',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
    });
  }
}