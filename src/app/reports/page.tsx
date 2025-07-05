'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, RefreshCw, Play, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateSessionReport, simulateTrainingResult } from '@/lib/edge-functions'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ReportData {
  id: string
  session_id: string
  type: 'PDF' | 'HTML'
  pdf_url: string
  created_at: string
  motor_results?: {
    id: string
    senior_id: string
    raw: any
    bpm: number | null
    created_at: string
    seniors: {
      name: string
    }
  }
  cognitive_results?: {
    id: string
    senior_id: string
    raw: any
    created_at: string
    seniors: {
      name: string
    }
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch reports with associated session data
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          motor_results (
            id,
            senior_id,
            raw,
            bpm,
            created_at,
            seniors (
              name
            )
          ),
          cognitive_results (
            id,
            senior_id,
            raw,
            created_at,
            seniors (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      setReports(reportsData || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (sessionId: string, resultType: 'motor' | 'cognitive') => {
    try {
      setGenerating(sessionId)
      
      const { data, error } = await generateSessionReport({
        session_id: sessionId,
        result_type: resultType
      })

      if (error) {
        toast.error(error)
      } else {
        toast.success('Report generated successfully')
        await fetchReports() // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(null)
    }
  }

  const handleViewReport = (reportUrl: string) => {
    window.open(reportUrl, '_blank')
  }

  const handleSimulateTraining = async () => {
    try {
      // Get a random senior for simulation
      const { data: seniors } = await supabase
        .from('seniors')
        .select('id')
        .limit(1)

      if (!seniors || seniors.length === 0) {
        toast.error('No seniors found. Please create a senior first.')
        return
      }

      const seniorId = seniors[0].id
      const resultType = Math.random() > 0.5 ? 'motor' : 'cognitive'

      toast.loading('Simulating training session...')
      
      const { error } = await simulateTrainingResult(seniorId, resultType)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success(`${resultType} training session simulated successfully`)
        await fetchReports()
      }
    } catch (error) {
      toast.error('Failed to simulate training')
    }
  }

  const getResultType = (report: ReportData): 'motor' | 'cognitive' => {
    return report.motor_results ? 'motor' : 'cognitive'
  }

  const getSeniorName = (report: ReportData): string => {
    return report.motor_results?.seniors?.name || 
           report.cognitive_results?.seniors?.name || 
           'Unknown'
  }

  const getSessionData = (report: ReportData) => {
    return report.motor_results || report.cognitive_results
  }

  useEffect(() => {
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Training Reports</h1>
            <p className="text-gray-600">Generated reports from training sessions and analytics</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleSimulateTraining}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Simulate Training
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchReports}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Senior</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Report Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const sessionData = getSessionData(report)
                    const resultType = getResultType(report)
                    
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {getSeniorName(report)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={resultType === 'motor' ? 'default' : 'secondary'}>
                            {resultType === 'motor' ? 'Motor' : 'Cognitive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sessionData ? format(new Date(sessionData.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Generated
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewReport(report.pdf_url)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(report.pdf_url, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateReport(report.session_id, resultType)}
                              disabled={generating === report.session_id}
                              className="flex items-center gap-1"
                            >
                              <RefreshCw className={`h-3 w-3 ${generating === report.session_id ? 'animate-spin' : ''}`} />
                              Regenerate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-[#555]">
                <FileText className="h-12 w-12 mx-auto mb-4 text-[#AAA]" />
                <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
                <p>Training reports will appear here after sessions are completed.</p>
                <p className="text-sm mt-1">Try simulating a training session to see how reports work.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}