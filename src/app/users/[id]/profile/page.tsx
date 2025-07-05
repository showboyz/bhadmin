'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Edit, 
  Pause, 
  Play, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Clock,
  User,
  Users,
  Heart,
  Activity,
  Settings,
  MessageSquare,
  Bell,
  BellOff,
  RotateCcw
} from 'lucide-react'

// 더미 사용자 데이터
const userData = {
  1: {
    id: 1,
    name: 'Marilou Kirn',
    email: 'marilou.kirn@email.com',
    phone: '+1-328-857-2537',
    address: '123 Oak Street, Springfield, IL 62701',
    age: 66,
    gender: 'Female',
    birthDate: '1958-03-15',
    registrationDate: '2024-09-15',
    lastLogin: '2025-07-04 14:30:00',
    status: 'Active',
    healthStatus: 'Good',
    specialNotes: 'Mild arthritis in knees, prefers morning sessions',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&h=120&fit=crop&crop=face',
    guardian: {
      name: 'Robert Kirn',
      relationship: 'Son',
      phone: '+1-328-857-2540',
      email: 'robert.kirn@email.com'
    },
    currentProgram: {
      type: '6-month',
      startDate: '2024-10-01',
      endDate: '2025-04-01',
      currentWeek: 12,
      totalWeeks: 24,
      completedSessions: 45,
      totalSessions: 72,
      status: 'Active'
    },
    programHistory: [
      {
        id: 1,
        type: '3-month',
        startDate: '2024-05-01',
        endDate: '2024-08-01',
        status: 'Completed',
        completionRate: 95,
        averageScore: 85
      }
    ],
    notifications: {
      sessionReminders: true,
      guardianNotifications: true,
      reportDelivery: 'weekly'
    }
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  
  const userId = params.id as string
  const user = userData[Number(userId) as keyof typeof userData]

  if (!user) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#555]">User not found</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700'
      case 'Suspended':
        return 'bg-red-100 text-red-700'
      case 'Inactive':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const calculateProgress = () => {
    return Math.round((user.currentProgram.currentWeek / user.currentProgram.totalWeeks) * 100)
  }

  const calculateSessionProgress = () => {
    return Math.round((user.currentProgram.completedSessions / user.currentProgram.totalSessions) * 100)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-[#555] hover:text-[#111]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-[#111]">User Profile</h1>
              <p className="text-[#555]">Comprehensive user information and account management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {user.status === 'Active' ? (
              <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                <Pause className="h-4 w-4" />
                Suspend
              </Button>
            ) : (
              <Button variant="outline" className="flex items-center gap-2 text-green-600 hover:text-green-700">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-[#111]">{user.name}</h2>
                      <Badge className={`${getStatusColor(user.status)}`}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-[#555]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.age} years old, {user.gender}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Born {user.birthDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Last login: {user.lastLogin}
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Registered: {user.registrationDate}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Full Name</label>
                    {isEditing ? (
                      <Input value={user.name} className="w-full" />
                    ) : (
                      <p className="text-[#111] font-medium">{user.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Email</label>
                    {isEditing ? (
                      <Input value={user.email} className="w-full" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#555]" />
                        <p className="text-[#111]">{user.email}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Phone</label>
                    {isEditing ? (
                      <Input value={user.phone} className="w-full" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#555]" />
                        <p className="text-[#111]">{user.phone}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Health Status</label>
                    {isEditing ? (
                      <Select value={user.healthStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-[#555]" />
                        <p className="text-[#111]">{user.healthStatus}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-1">Address</label>
                  {isEditing ? (
                    <Input value={user.address} className="w-full" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#555]" />
                      <p className="text-[#111]">{user.address}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-1">Special Notes</label>
                  {isEditing ? (
                    <Textarea value={user.specialNotes} className="w-full" rows={3} />
                  ) : (
                    <p className="text-[#111] bg-[#F7F7F7] p-3 rounded-md">{user.specialNotes}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guardian Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Name</label>
                    <p className="text-[#111] font-medium">{user.guardian.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Relationship</label>
                    <p className="text-[#111]">{user.guardian.relationship}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#555]" />
                      <p className="text-[#111]">{user.guardian.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#555]" />
                      <p className="text-[#111]">{user.guardian.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111] flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-2">Administrator Notes</label>
                    <Textarea 
                      placeholder="Add notes about this user's progress, behavior, or special considerations..."
                      className="w-full"
                      rows={4}
                    />
                  </div>
                  <Button className="bg-[#111] hover:bg-[#222] text-white">
                    Save Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Program & Settings */}
          <div className="space-y-6">
            {/* Current Program Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Current Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#F7F7F7"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#333"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${calculateProgress() * 3.14} 314`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#111]">{calculateProgress()}%</div>
                        <div className="text-xs text-[#555]">Progress</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Program Type:</span>
                    <span className="font-medium text-[#111]">{user.currentProgram.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Current Week:</span>
                    <span className="font-medium text-[#111]">{user.currentProgram.currentWeek} / {user.currentProgram.totalWeeks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Sessions:</span>
                    <span className="font-medium text-[#111]">{user.currentProgram.completedSessions} / {user.currentProgram.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Start Date:</span>
                    <span className="font-medium text-[#111]">{user.currentProgram.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">End Date:</span>
                    <span className="font-medium text-[#111]">{user.currentProgram.endDate}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Manage Program
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Program Management</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#555] mb-2">Change Program Type</label>
                          <Select defaultValue={user.currentProgram.type}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3-month">3-month Program</SelectItem>
                              <SelectItem value="6-month">6-month Program</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-[#111] hover:bg-[#222] text-white">
                            Save Changes
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => setIsProgramDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Program History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111] flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Program History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.programHistory.map((program) => (
                    <div key={program.id} className="bg-[#F7F7F7] p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-[#111]">{program.type} Program</h4>
                          <p className="text-sm text-[#555]">{program.startDate} - {program.endDate}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">{program.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#555]">Completion: </span>
                          <span className="font-medium text-[#111]">{program.completionRate}%</span>
                        </div>
                        <div>
                          <span className="text-[#555]">Avg Score: </span>
                          <span className="font-medium text-[#111]">{program.averageScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Account Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#111] mb-2">Notification Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#555]">Session Reminders</span>
                      {user.notifications.sessionReminders ? (
                        <Bell className="h-4 w-4 text-green-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#555]">Guardian Notifications</span>
                      {user.notifications.guardianNotifications ? (
                        <Bell className="h-4 w-4 text-green-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#555]">Report Delivery</span>
                      <span className="text-sm font-medium text-[#111] capitalize">{user.notifications.reportDelivery}</span>
                    </div>
                  </div>
                </div>
                
                <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Manage Notifications
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Notification Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-[#555]">Session Reminders</label>
                          <input type="checkbox" defaultChecked={user.notifications.sessionReminders} className="rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-[#555]">Guardian Notifications</label>
                          <input type="checkbox" defaultChecked={user.notifications.guardianNotifications} className="rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#555] mb-2">Report Delivery Frequency</label>
                          <Select defaultValue={user.notifications.reportDelivery}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-[#111] hover:bg-[#222] text-white">
                          Save Settings
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setIsNotificationDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}