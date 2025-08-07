'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Alert component replaced with div for now
import { Database, Download, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface SyncResult {
  organizationId: string
  organizationName: string
  clientTableRecords: number
  userTableRecords: number
  createdSeniors: number
  syncedAdminIds: string[]
  seniors: any[]
}

export default function SuperAdminSyncPage() {
  const { canAccessSuperAdmin } = useAuth()
  const [orgName, setOrgName] = useState('영앤')
  const [adminIds, setAdminIds] = useState('admin10,admin9,admin8,admin6')
  const [loading, setLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)

  if (!canAccessSuperAdmin()) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-800">Access denied. Super admin privileges required.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSync = async (isDemoMode = false) => {
    try {
      setLoading(true)
      setError(null)
      setSyncResult(null)
      
      const endpoint = isDemoMode ? '/api/sync/demo' : '/api/sync/dynamodb'
      console.log(`🚀 Starting ${isDemoMode ? 'DEMO' : 'DynamoDB'} sync...`)
      
      const adminIdArray = adminIds.split(',').map(id => id.trim()).filter(id => id)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgName: orgName.trim(),
          adminIds: adminIdArray
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Sync failed')
      }
      
      setSyncResult(result.data)
      console.log(`✅ ${isDemoMode ? 'Demo' : 'Production'} sync completed successfully:`, result.data)
      
    } catch (err) {
      console.error('❌ Sync failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const checkSyncStatus = async () => {
    try {
      setCheckingStatus(true)
      
      const response = await fetch(`/api/sync/dynamodb?orgName=${encodeURIComponent(orgName.trim())}`)
      const result = await response.json()
      
      if (response.ok) {
        setSyncStatus(result.organization)
      } else {
        setSyncStatus(null)
      }
      
    } catch (err) {
      console.error('❌ Error checking sync status:', err)
      setSyncStatus(null)
    } finally {
      setCheckingStatus(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DynamoDB Data Synchronization</h1>
          <p className="text-gray-600">Sync organization and user data from DynamoDB to Supabase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sync Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sync Configuration
              </CardTitle>
              <CardDescription>
                Configure the organization and admin IDs to sync from DynamoDB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be matched against the 'name' field in ClientTable
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin IDs (comma-separated)
                </label>
                <Input
                  value={adminIds}
                  onChange={(e) => setAdminIds(e.target.value)}
                  placeholder="admin10,admin9,admin8,admin6"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  DynamoDB UserTable and ClientTable IDs to sync
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSync(false)}
                  disabled={loading || !orgName.trim() || !adminIds.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Production Sync
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => handleSync(true)}
                  disabled={loading || !orgName.trim() || !adminIds.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Demo...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Demo Sync
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={checkSyncStatus}
                  disabled={checkingStatus || !orgName.trim()}
                >
                  {checkingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>
                Check existing sync status for the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Organization Exists</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{syncStatus.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <p className="font-mono text-xs">{syncStatus.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Synced Users:</span>
                      <p className="font-medium">{syncStatus.syncedSeniorsCount}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="text-xs">{new Date(syncStatus.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sync data found</p>
                  <p className="text-xs">Click refresh to check status</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-800">
                <strong>Sync Failed:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Sync Completed Successfully
              </CardTitle>
              <CardDescription>
                Data has been synchronized from DynamoDB to Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{syncResult.clientTableRecords}</div>
                  <div className="text-sm text-blue-600">ClientTable Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{syncResult.userTableRecords}</div>
                  <div className="text-sm text-green-600">UserTable Records</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{syncResult.createdSeniors}</div>
                  <div className="text-sm text-purple-600">Created Seniors</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Organization Details</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><span className="font-medium">Name:</span> {syncResult.organizationName}</p>
                    <p><span className="font-medium">Supabase ID:</span> <code className="text-xs bg-white px-2 py-1 rounded">{syncResult.organizationId}</code></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Synced Admin IDs</h4>
                  <div className="flex flex-wrap gap-2">
                    {syncResult.syncedAdminIds.map((id) => (
                      <Badge key={id} variant="secondary">{id}</Badge>
                    ))}
                  </div>
                </div>

                {syncResult.seniors && syncResult.seniors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created Seniors</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {syncResult.seniors.map((senior) => (
                        <div key={senior.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="font-medium">{senior.name}</span>
                          <code className="text-xs bg-white px-2 py-1 rounded">{senior.id}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ The organization <strong>"{syncResult.organizationName}"</strong> and its users have been successfully synchronized. 
                  You can now view and manage them in the organization dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Fetch ClientTable Data</p>
                  <p className="text-gray-600">Queries DynamoDB ClientTable for records matching the organization name and admin IDs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Fetch UserTable Data</p>
                  <p className="text-gray-600">Retrieves corresponding user information from DynamoDB UserTable for each admin ID</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Create Organization</p>
                  <p className="text-gray-600">Creates or updates the organization record in Supabase following the existing schema</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <p className="font-medium">Create Senior Records</p>
                  <p className="text-gray-600">Maps UserTable data to Supabase seniors schema and creates user records with schedules</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}