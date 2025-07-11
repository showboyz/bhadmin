'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrganizationInfo {
  id: string
  name: string
  org_type: string
  is_active: boolean
}

export default function OrgSchedulesPage() {
  const params = useParams()
  const orgId = params['org-id'] as string
  
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organisations')
          .select('id, name, org_type, is_active')
          .eq('id', orgId)
          .single()

        if (orgError) {
          console.error('Error fetching organization:', orgError)
        } else {
          setOrganization(orgData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Schedules
          </h1>
          <p className="text-gray-600">
            Manage training schedules for {organization?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Training Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[#555]">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600 mb-4">Create your first training schedule to get started.</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}