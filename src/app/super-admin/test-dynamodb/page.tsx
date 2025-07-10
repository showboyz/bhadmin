'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface DynamoDBOrganization {
  id: string
  name: string
  [key: string]: any
}

export default function TestDynamoDBPage() {
  const [organizations, setOrganizations] = useState<DynamoDBOrganization[]>([])
  const [groupedOrganizations, setGroupedOrganizations] = useState<Record<string, DynamoDBOrganization[]>>({})
  const [viewMode, setViewMode] = useState<'raw' | 'grouped'>('raw')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizations = async (mode: 'raw' | 'grouped' = viewMode) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = mode === 'grouped' 
        ? '/api/dynamodb/organizations?grouped=true'
        : '/api/dynamodb/organizations'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        if (mode === 'grouped') {
          setGroupedOrganizations(result.data)
          toast.success(`DynamoDB에서 ${result.organizationCount}개 기관 (총 ${result.totalRecords}개 레코드)을 조회했습니다.`)
        } else {
          setOrganizations(result.data)
          toast.success(`DynamoDB에서 ${result.count}개의 레코드를 조회했습니다.`)
        }
      } else {
        setError(result.error || 'Failed to fetch organizations')
        toast.error('DynamoDB 조회 실패: ' + result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('네트워크 오류: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DynamoDB 테스트</h1>
          <p className="text-gray-600">AWS DynamoDB의 기관 테이블 조회 테스트</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'raw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setViewMode('raw')
                fetchOrganizations('raw')
              }}
              className="rounded-none"
            >
              전체 데이터
            </Button>
            <Button 
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setViewMode('grouped')
                fetchOrganizations('grouped')
              }}
              className="rounded-none"
            >
              기관별 그룹
            </Button>
          </div>
          <Button 
            onClick={() => fetchOrganizations()} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 연결 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            DynamoDB 연결 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {error ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">연결 실패</Badge>
                <span className="text-sm text-red-600">{error}</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  연결 성공
                </Badge>
                <span className="text-sm text-gray-600">
                  {viewMode === 'grouped' 
                    ? `${Object.keys(groupedOrganizations).length}개 기관, 총 ${Object.values(groupedOrganizations).flat().length}개 레코드`
                    : `${organizations.length}개의 레코드가 조회되었습니다.`
                  }
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 그룹화된 기관 목록 */}
      {viewMode === 'grouped' && Object.keys(groupedOrganizations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>기관별 그룹화된 데이터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedOrganizations).map(([orgName, items], index) => (
                <div key={orgName || index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {orgName} 
                    </h3>
                    <Badge variant="secondary">
                      {items.length}개 레코드
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {items.map((item, itemIndex) => (
                      <div key={item.id || itemIndex} className="bg-gray-50 rounded p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>ID:</strong> {item.id || 'N/A'}</div>
                          <div><strong>Name:</strong> {item.name || 'N/A'}</div>
                        </div>
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                            상세 정보 보기
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 데이터 목록 */}
      {viewMode === 'raw' && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DynamoDB 전체 데이터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.map((org, index) => (
                <div key={org.id || index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>ID:</strong> {org.id || 'N/A'}
                    </div>
                    <div>
                      <strong>이름:</strong> {org.name || org.organizationName || org.orgName || 'N/A'}
                    </div>
                  </div>
                  
                  {/* 모든 속성 표시 */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      모든 속성 보기
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(org, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">DynamoDB에서 데이터를 조회하는 중...</p>
          </CardContent>
        </Card>
      )}

      {/* 에러 상태 */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-2">DynamoDB 연결 오류</p>
            <p className="text-sm text-gray-600">{error}</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>확인사항:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>AWS 자격 증명이 올바른지 확인</li>
                <li>DynamoDB 테이블 이름이 정확한지 확인</li>
                <li>AWS 리전이 올바른지 확인</li>
                <li>IAM 권한이 충분한지 확인</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}