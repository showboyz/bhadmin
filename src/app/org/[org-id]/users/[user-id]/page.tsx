'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User } from 'lucide-react'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

// 기관별 사용자 데이터
const orgUserData = {
  1: {
    id: 1,
    name: '김영희',
    phone: '+82-10-1234-5678',
    age: 66,
    currentWeek: 12,
    totalTrainingTime: { hours: 10, minutes: 25 },
    physicalExerciseTime: { hours: 8, minutes: 35 },
    cognitiveTrainingTime: { hours: 5, minutes: 20 },
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face'
  },
  2: {
    id: 2,
    name: '박철수',
    phone: '+82-10-2345-6789',
    age: 72,
    currentWeek: 8,
    totalTrainingTime: { hours: 7, minutes: 15 },
    physicalExerciseTime: { hours: 6, minutes: 30 },
    cognitiveTrainingTime: { hours: 4, minutes: 45 },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  3: {
    id: 3,
    name: '이순자',
    phone: '+82-10-3456-7890',
    age: 68,
    currentWeek: 24,
    totalTrainingTime: { hours: 15, minutes: 50 },
    physicalExerciseTime: { hours: 12, minutes: 20 },
    cognitiveTrainingTime: { hours: 8, minutes: 30 },
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  },
  4: {
    id: 4,
    name: '최미영',
    phone: '+82-10-4567-8901',
    age: 58,
    currentWeek: 2,
    totalTrainingTime: { hours: 2, minutes: 30 },
    physicalExerciseTime: { hours: 1, minutes: 45 },
    cognitiveTrainingTime: { hours: 1, minutes: 15 },
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=60&h=60&fit=crop&crop=face'
  },
  5: {
    id: 5,
    name: '정동현',
    phone: '+82-10-5678-9012',
    age: 76,
    currentWeek: 0,
    totalTrainingTime: { hours: 0, minutes: 0 },
    physicalExerciseTime: { hours: 0, minutes: 0 },
    cognitiveTrainingTime: { hours: 0, minutes: 0 },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
  }
}

// 월별 활동 데이터
const monthlyData = [
  { month: 'Jan', physical: 80, cognitive: 45 },
  { month: 'Feb', physical: 65, cognitive: 35 },
  { month: 'Mar', physical: 95, cognitive: 55 },
  { month: 'Apr', physical: 75, cognitive: 40 },
  { month: 'May', physical: 70, cognitive: 35 },
  { month: 'Jun', physical: 85, cognitive: 50 },
  { month: 'Jul', physical: 90, cognitive: 45 },
  { month: 'Aug', physical: 60, cognitive: 30 },
  { month: 'Sep', physical: 70, cognitive: 40 },
  { month: 'Oct', physical: 100, cognitive: 60 },
  { month: 'Nov', physical: 80, cognitive: 45 },
  { month: 'Dec', physical: 75, cognitive: 40 }
]

// 달력 활동 데이터 (완료/진행중 날짜)
const activityDates = {
  completed: [
    new Date(2025, 6, 5),  // July 5, 2025
    new Date(2025, 6, 16), // July 16, 2025
    new Date(2025, 6, 18), // July 18, 2025
    new Date(2025, 6, 22), // July 22, 2025
    new Date(2025, 6, 25), // July 25, 2025
    new Date(2025, 6, 28), // July 28, 2025
    new Date(2025, 6, 30), // July 30, 2025
  ],
  inProgress: [
    new Date(2025, 6, 8),  // July 8, 2025 (오늘이라고 가정)
    new Date(2025, 6, 12), // July 12, 2025
    new Date(2025, 6, 14), // July 14, 2025
  ]
}

const chartConfig = {
  physical: {
    label: "Physical",
    color: "#333333",
  },
  cognitive: {
    label: "Cognitive", 
    color: "#888888",
  },
} satisfies ChartConfig

export default function OrgUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params['org-id'] as string
  const userId = parseInt(params['user-id'] as string)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const user = orgUserData[userId as keyof typeof orgUserData]

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/org/${orgId}/users`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  const isDateCompleted = (date: Date) => {
    return activityDates.completed.some(d => 
      d.getDate() === date.getDate() && 
      d.getMonth() === date.getMonth() && 
      d.getFullYear() === date.getFullYear()
    )
  }

  const isDateInProgress = (date: Date) => {
    return activityDates.inProgress.some(d => 
      d.getDate() === date.getDate() && 
      d.getMonth() === date.getMonth() && 
      d.getFullYear() === date.getFullYear()
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/org/${orgId}/users`)}
              className="text-[#555] hover:text-[#111]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-semibold text-[#111]">{user.name}</h1>
                <p className="text-[#555]">{user.phone} • Age {user.age}</p>
              </div>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            Week {user.currentWeek}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Time Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#F7F7F7]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#555]">
                    Total Training Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#111]">
                    {user.totalTrainingTime.hours}h {user.totalTrainingTime.minutes}m
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#F7F7F7]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#555]">
                    Physical Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#111]">
                    {user.physicalExerciseTime.hours}h {user.physicalExerciseTime.minutes}m
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#F7F7F7]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#555]">
                    Cognitive Training
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#111]">
                    {user.cognitiveTrainingTime.hours}h {user.cognitiveTrainingTime.minutes}m
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#111]">Monthly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="month" 
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="physical" 
                        fill="#333333" 
                        radius={[2, 2, 0, 0]}
                        name="Physical"
                      />
                      <Bar 
                        dataKey="cognitive" 
                        fill="#888888" 
                        radius={[2, 2, 0, 0]}
                        name="Cognitive"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-[#111] flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Activity Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  modifiers={{
                    completed: activityDates.completed,
                    inProgress: activityDates.inProgress,
                  }}
                  modifiersStyles={{
                    completed: {
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 'bold'
                    },
                    inProgress: {
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
                
                {/* Legend */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-[#555]">Completed Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-[#555]">In Progress</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}