'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useDashboard } from '@/hooks/use-dashboard'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const { kpi, userProgress, inactiveUsers, loading, error, refetch } = useDashboard()

  // Gender Distribution Data
  const genderData = [
    { name: 'Male', value: 45, count: 156, fill: '#3D3D3D' },
    { name: 'Female', value: 55, count: 191, fill: '#D8D8D8' }
  ]

  const genderConfig = {
    male: {
      label: 'Male',
      color: '#3D3D3D',
    },
    female: {
      label: 'Female',
      color: '#D8D8D8',
    },
  } satisfies ChartConfig

  // Daily Activity Data
  const dailyActivityData = [
    { day: 'Mon', sessions: 12 },
    { day: 'Tue', sessions: 19 },
    { day: 'Wed', sessions: 15 },
    { day: 'Thu', sessions: 22 },
    { day: 'Fri', sessions: 18 },
    { day: 'Sat', sessions: 25 },
    { day: 'Sun', sessions: 16 }
  ]

  const activityConfig = {
    sessions: {
      label: 'Sessions',
      color: '#374151',
    },
  } satisfies ChartConfig

  // Health Status Distribution Data
  const healthStatusData = [
    { name: 'Excellent', value: 25, fill: '#111827' },
    { name: 'Good', value: 40, fill: '#374151' },
    { name: 'Fair', value: 25, fill: '#6b7280' },
    { name: 'Poor', value: 10, fill: '#9ca3af' }
  ]

  const healthConfig = {
    excellent: {
      label: 'Excellent',
      color: '#111827',
    },
    good: {
      label: 'Good', 
      color: '#374151',
    },
    fair: {
      label: 'Fair',
      color: '#6b7280',
    },
    poor: {
      label: 'Poor',
      color: '#9ca3af',
    },
  } satisfies ChartConfig

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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of system metrics and user activity analytics</p>
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
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpiData.map((kpiItem, index) => (
            <Card key={index} className="bg-[#F7F7F7]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium text-[#555]">
                  {kpiItem.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-xl font-bold text-[#111]">{kpiItem.value}</div>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Gender Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#111]">Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={genderConfig} className="w-full h-[250px]">
                <PieChart width={300} height={250}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value, count }) => `${name}: ${count} (${value}%)`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Activity Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#111]">Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={activityConfig} className="w-full h-[250px]">
                <LineChart width={350} height={250} data={dailyActivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#374151" 
                    strokeWidth={2}
                    dot={{ fill: '#374151', r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Health Status Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#111]">Health Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={healthConfig} className="w-full h-[250px]">
                <PieChart width={300} height={250}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={healthStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {healthStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
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