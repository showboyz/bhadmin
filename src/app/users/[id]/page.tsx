'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

// 더미 데이터
const userData = {
  1: {
    id: 1,
    name: 'Marilou Kirn',
    phone: '+1-328-857-2537',
    age: 66,
    currentWeek: 12,
    totalTrainingTime: { hours: 10, minutes: 25 },
    physicalExerciseTime: { hours: 8, minutes: 35 },
    cognitiveTrainingTime: { hours: 5, minutes: 20 },
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face'
  },
  // 다른 사용자들도 추가할 수 있음
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
    new Date(2025, 1, 20), // February 20, 2025
    new Date(2025, 1, 12),
    new Date(2025, 1, 17),
    new Date(2025, 1, 18),
  ],
  inProgress: [
    new Date(2025, 1, 3),  // February 3, 2025
    new Date(2025, 1, 1),
  ]
}

// 활동 목록 데이터
const activities = [
  {
    id: 1,
    title: 'Rock, Paper, Scissors!',
    date: '2025.01.05 16:00:00',
    status: 'Completed'
  },
  {
    id: 2,
    title: 'Smokey Exercise 2',
    date: '2025.01.03 09:30:00',
    status: 'In Progress'
  },
  {
    id: 3,
    title: 'Smokey Exercise 1',
    date: '2025.01.01 15:35:00',
    status: 'In Progress'
  }
]

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  const userId = params.id as string
  const user = userData[userId as keyof typeof userData]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p>User not found</p>
        </div>
      </div>
    )
  }

  // 달력에서 특정 날짜의 상태를 확인하는 함수
  const getDateStatus = (date: Date) => {
    const isCompleted = activityDates.completed.some(
      d => d.toDateString() === date.toDateString()
    )
    const isInProgress = activityDates.inProgress.some(
      d => d.toDateString() === date.toDateString()
    )
    
    if (isCompleted) return 'completed'
    if (isInProgress) return 'in-progress'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">Overview of the results from training activities</p>
            </div>
          </div>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Training Time</div>
              <div className="text-2xl font-bold text-gray-900">
                {user.totalTrainingTime.hours} <span className="text-lg">h</span> {user.totalTrainingTime.minutes} <span className="text-sm font-normal text-gray-600">min</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Current Week</div>
              <div className="text-2xl font-bold text-gray-900">
                {user.currentWeek} <span className="text-sm font-normal text-gray-600">week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Physical Exercise Time</div>
              <div className="text-2xl font-bold text-gray-900">
                {user.physicalExerciseTime.hours} <span className="text-lg">h</span> {user.physicalExerciseTime.minutes} <span className="text-sm font-normal text-gray-600">min</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-300">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Cognitive Training Time</div>
              <div className="text-2xl font-bold text-gray-900">
                {user.cognitiveTrainingTime.hours} <span className="text-lg">h</span> {user.cognitiveTrainingTime.minutes} <span className="text-sm font-normal text-gray-600">min</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hours Spent Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Hours Spent</CardTitle>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span className="text-gray-600">Physical Exercise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-800 rounded"></div>
                    <span className="text-gray-600">Cognitive Training</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="physical" fill="#9ca3af" stackId="a" />
                      <Bar dataKey="cognitive" fill="#374151" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
                        <div className="space-y-1">
                          <div className="w-8 h-1 bg-white rounded"></div>
                          <div className="w-8 h-1 bg-white rounded"></div>
                          <div className="w-8 h-1 bg-white rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 h-16 mx-auto">
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        <circle cx="32" cy="20" r="8" fill="#ef4444" />
                        <rect x="24" y="28" width="16" height="24" rx="4" fill="#ef4444" />
                        <rect x="20" y="32" width="8" height="16" rx="2" fill="#ef4444" />
                        <rect x="36" y="32" width="8" height="16" rx="2" fill="#ef4444" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600">No information available at this time.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar and Activities */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 text-center">February 2025</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-0"
                  modifiers={{
                    completed: activityDates.completed,
                    inProgress: activityDates.inProgress,
                  }}
                  modifiersStyles={{
                    completed: {
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '50%',
                    },
                    inProgress: {
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Date Info */}
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  }).replace(/\//g, '.') : '2025.02.20'}
                </div>
                
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{activity.title}</div>
                        <div className="text-xs text-gray-500">{activity.date}</div>
                      </div>
                      <Badge 
                        className={`text-xs px-2 py-1 rounded-full ${
                          activity.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}