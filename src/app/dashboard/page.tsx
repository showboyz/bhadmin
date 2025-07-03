'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useDashboard } from '@/hooks/use-dashboard'

export default function DashboardPage() {
  const { kpi, userProgress, inactiveUsers, loading, error, refetch } = useDashboard()

  const kpiData = [
    { 
      title: 'Total Users', 
      value: kpi.totalUsers.toString(), 
      change: '+2.1%',
      trend: 'up' as const
    },
    { 
      title: 'Active Today', 
      value: kpi.activeToday.toString(), 
      change: '+5.4%',
      trend: 'up' as const
    },
    { 
      title: 'Weekly Active', 
      value: kpi.weeklyActive.toString(), 
      change: '+1.2%',
      trend: 'up' as const
    },
    { 
      title: 'New Users (This Month)', 
      value: kpi.newUsersThisMonth.toString(), 
      change: '+12.5%',
      trend: 'up' as const
    },
    { 
      title: 'Inactive Users (This Week)', 
      value: kpi.inactiveUsersThisWeek.toString(), 
      change: '-2.1%',
      trend: 'down' as const
    },
    { 
      title: 'License Seats Remaining', 
      value: kpi.licenseSeatRemaining.toString(), 
      change: '0%',
      trend: 'neutral' as const
    }
  ]

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111]">Dashboard</h1>
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
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpiData.map((kpiItem, index) => (
            <Card key={index} className="bg-[#F7F7F7]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#555]">
                  {kpiItem.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#111]">{kpiItem.value}</div>
                <div className="flex items-center mt-1">
                  {getTrendIcon(kpiItem.trend)}
                  <p className={`text-xs ml-1 ${getTrendColor(kpiItem.trend)}`}>
                    {kpiItem.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#111]">User Progress ({userProgress.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {userProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Week</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProgress.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.currentWeek}</TableCell>
                      <TableCell>{user.progress}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Active' 
                            ? 'bg-[#333] text-white' 
                            : 'bg-[#777] text-white'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-[#555]">
                No active users found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111]">Inactive Users ({inactiveUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {inactiveUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-[#555]">{user.daysAgo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-[#555]">
                No inactive users - Great job! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}