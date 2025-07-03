'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, Phone, Clock, Calendar, TrendingDown } from 'lucide-react'
import { useMonitoring } from '@/hooks/use-monitoring'
import { format } from 'date-fns'

export default function MonitoringPage() {
  const { missedSessions, stats, loading, error, refetch } = useMonitoring()

  const getPriorityLevel = (missedSessions: number, daysSinceLast: number) => {
    if (missedSessions >= 3 || daysSinceLast >= 7) return 'high'
    if (missedSessions >= 2 || daysSinceLast >= 5) return 'medium'
    return 'low'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatLastSession = (date: string | null) => {
    if (!date) return 'Never'
    return format(new Date(date), 'MMM dd, yyyy')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#111]">Session Monitoring</h1>
            <p className="text-[#555] mt-1">Track missed sessions and inactive seniors</p>
          </div>
          <Button 
            variant="outline" 
            onClick={refetch}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#F7F7F7]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#555]">
                Active Seniors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#111]">{stats.total_active_seniors}</div>
              <p className="text-xs text-[#555] mt-1">Total with active schedules</p>
            </CardContent>
          </Card>

          <Card className="bg-[#F7F7F7]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#555]">
                Seniors with Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.seniors_with_missed_sessions}</div>
              <p className="text-xs text-[#555] mt-1">Missed sessions or inactive</p>
            </CardContent>
          </Card>

          <Card className="bg-[#F7F7F7]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#555]">
                Total Missed Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.total_missed_sessions}</div>
              <p className="text-xs text-[#555] mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="bg-[#F7F7F7]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#555]">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avg_completion_rate}%</div>
              <p className="text-xs text-[#555] mt-1">Average this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Missed Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Seniors Requiring Attention ({missedSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missedSessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Senior Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Session</TableHead>
                    <TableHead>Days Since</TableHead>
                    <TableHead>This Week</TableHead>
                    <TableHead>Missed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missedSessions
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 }
                      const aPriority = getPriorityLevel(a.missed_sessions, a.days_since_last)
                      const bPriority = getPriorityLevel(b.missed_sessions, b.days_since_last)
                      return priorityOrder[bPriority as keyof typeof priorityOrder] - priorityOrder[aPriority as keyof typeof priorityOrder]
                    })
                    .map((session) => {
                      const priority = getPriorityLevel(session.missed_sessions, session.days_since_last)
                      return (
                        <TableRow key={session.senior_id}>
                          <TableCell>
                            <Badge className={getPriorityColor(priority)}>
                              {priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{session.senior_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {session.phone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3" />
                                  {session.phone}
                                </div>
                              )}
                              {session.guardian_phone && (
                                <div className="flex items-center gap-1 text-xs text-[#555]">
                                  <Phone className="h-3 w-3" />
                                  {session.guardian_phone} (Guardian)
                                </div>
                              )}
                              {!session.phone && !session.guardian_phone && (
                                <span className="text-xs text-[#AAA]">No contact info</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#555]" />
                              <span className="text-sm">
                                {formatLastSession(session.last_session_date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#555]" />
                              <span className={`text-sm ${session.days_since_last > 7 ? 'text-red-600 font-medium' : ''}`}>
                                {session.days_since_last === 999 ? 'Never' : `${session.days_since_last} days`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {session.completed_sessions_this_week}/{session.expected_sessions_this_week}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                {session.missed_sessions}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {session.phone && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`tel:${session.phone}`)}
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // TODO: Navigate to senior detail or send message
                                  console.log('Contact senior:', session.senior_name)
                                }}
                              >
                                Contact
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
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">All Seniors on Track! 🎉</h3>
                <p>No missed sessions or inactive seniors found.</p>
                <p className="text-sm mt-1">Everyone is maintaining their training schedule.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}