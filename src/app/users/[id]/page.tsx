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
    new Date(2025, 6, 5),  // July 5, 2025
    new Date(2025, 6, 16), // July 16, 2025
    new Date(2025, 6, 18), // July 18, 2025
    new Date(2025, 6, 20), // July 20, 2025
    new Date(2025, 6, 12), // July 12, 2025
  ],
  inProgress: [
    new Date(2025, 6, 3),  // July 3, 2025
    new Date(2025, 6, 1),  // July 1, 2025
    new Date(2025, 6, 17), // July 17, 2025
  ]
}

// 활동 목록 데이터 (날짜별로 구성)
const activitiesByDate = {
  '2025-07-05': [
    {
      id: 1,
      title: 'Rock, Paper, Scissors!',
      date: '2025.07.05 16:00:00',
      status: 'Completed'
    },
    {
      id: 2,
      title: 'Memory Training Game',
      date: '2025.07.05 14:30:00',
      status: 'Completed'
    }
  ],
  '2025-07-03': [
    {
      id: 3,
      title: 'Smokey Exercise 2',
      date: '2025.07.03 09:30:00',
      status: 'In Progress'
    },
    {
      id: 4,
      title: 'Balance Training',
      date: '2025.07.03 11:00:00',
      status: 'In Progress'
    }
  ],
  '2025-07-01': [
    {
      id: 5,
      title: 'Smokey Exercise 1',
      date: '2025.07.01 15:35:00',
      status: 'In Progress'
    }
  ],
  '2025-07-16': [
    {
      id: 6,
      title: 'Cognitive Assessment',
      date: '2025.07.16 10:00:00',
      status: 'Completed'
    },
    {
      id: 7,
      title: 'Physical Therapy Session',
      date: '2025.07.16 14:00:00',
      status: 'Completed'
    },
    {
      id: 8,
      title: 'Brain Training Quiz',
      date: '2025.07.16 16:30:00',
      status: 'In Progress'
    }
  ],
  '2025-07-18': [
    {
      id: 9,
      title: 'Walking Exercise',
      date: '2025.07.18 09:00:00',
      status: 'Completed'
    }
  ],
  '2025-07-20': [
    {
      id: 10,
      title: 'Puzzle Solving',
      date: '2025.07.20 13:00:00',
      status: 'Completed'
    },
    {
      id: 11,
      title: 'Stretching Session',
      date: '2025.07.20 15:30:00',
      status: 'Completed'
    }
  ],
  '2025-07-12': [
    {
      id: 12,
      title: 'Music Therapy',
      date: '2025.07.12 11:00:00',
      status: 'Completed'
    }
  ],
  '2025-07-17': [
    {
      id: 13,
      title: 'Coordination Exercise',
      date: '2025.07.17 10:30:00',
      status: 'In Progress'
    }
  ]
}

// 차트 설정
const chartConfig = {
  physical: {
    label: 'Physical Exercise',
    color: '#3D3D3D',
  },
  cognitive: {
    label: 'Cognitive Training',
    color: '#D8D8D8',
  },
} satisfies ChartConfig

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  const userId = params.id as string
  const user = userData[Number(userId) as keyof typeof userData]

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

  // 선택된 날짜의 활동 목록을 가져오는 함수
  const getActivitiesForDate = (date: Date | undefined) => {
    if (!date) return []
    
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD 형식
    return activitiesByDate[dateKey as keyof typeof activitiesByDate] || []
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
          <Button 
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => router.push(`/users/${userId}/profile`)}
          >
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
          <div className="lg:col-span-2 space-y-8 flex flex-col">
            {/* Hours Spent Chart */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Hours Spent</CardTitle>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3D3D3D' }}></div>
                    <span className="text-gray-600">Physical Exercise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#D8D8D8' }}></div>
                    <span className="text-gray-600">Cognitive Training</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={monthlyData} 
                      margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                      barCategoryGap="20%"
                    >
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280" 
                        fontSize={12}
                        interval={0}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="physical" fill="#3D3D3D" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="cognitive" fill="#D8D8D8" stackId="a" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Diagnosis Section */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Diagnosis</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
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

          {/* Right Column - Calendar and Activities Combined */}
          <div className="flex">
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-0">
                {/* Calendar Section */}
                <div className="p-6 pb-4">
                  {/* Custom Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => {
                        const newDate = new Date(selectedDate || new Date())
                        newDate.setMonth(newDate.getMonth() - 1)
                        setSelectedDate(newDate)
                      }}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                    >
                      &lt;
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'July 2025'}
                    </h2>
                    <button 
                      onClick={() => {
                        const newDate = new Date(selectedDate || new Date())
                        newDate.setMonth(newDate.getMonth() + 1)
                        setSelectedDate(newDate)
                      }}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                    >
                      &gt;
                    </button>
                  </div>

                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border-0 w-full flex justify-center"
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
                    classNames={{
                      months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                      month: "space-y-4 w-full flex flex-col items-center",
                      caption: "hidden",
                      caption_label: "hidden",
                      nav: "hidden",
                      nav_button: "hidden",
                      nav_button_previous: "hidden",
                      nav_button_next: "hidden",
                      table: "w-full border-collapse",
                      head_row: "flex w-full mb-2",
                      head_cell: "text-gray-400 rounded-md w-full font-medium text-xs text-center uppercase tracking-wider py-2",
                      row: "flex w-full",
                      cell: "text-center text-sm p-1 relative w-full",
                      day: "inline-flex items-center justify-center rounded-full text-sm font-medium h-10 w-10 p-0 hover:bg-gray-100 hover:text-gray-900 transition-colors",
                      day_selected: "bg-gray-900 text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white",
                      day_today: "bg-gray-100 text-gray-900 font-semibold",
                      day_outside: "text-gray-300",
                      day_disabled: "text-gray-300 opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100"></div>

                {/* Selected Date Activities */}
                <div className="p-6 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/\//g, '.') : '2025.07.16'}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors">
                      <span className="text-lg font-light">+</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {getActivitiesForDate(selectedDate).length > 0 ? (
                      getActivitiesForDate(selectedDate).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-1 h-14 bg-gray-300 rounded-full mt-1 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-gray-900 text-sm truncate">{activity.title}</div>
                              <Badge 
                                className={`text-xs px-2 py-1 flex-shrink-0 ml-2 ${
                                  activity.status === 'Completed' 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {activity.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">{activity.date}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-sm">이 날짜에 활동이 없습니다.</div>
                      </div>
                    )}
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