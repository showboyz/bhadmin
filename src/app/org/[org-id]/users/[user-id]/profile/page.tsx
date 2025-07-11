'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Phone, MapPin, Calendar, Save, Edit, RotateCcw } from 'lucide-react'

// 기관별 사용자 상세 데이터
const orgUserProfiles = {
  1: {
    id: 1,
    name: '김영희',
    phone: '+82-10-1234-5678',
    email: 'kimyh@example.com',
    age: 66,
    birthDate: '1958-03-15',
    gender: 'Female',
    address: '서울시 강남구 테헤란로 123',
    emergencyContact: '김철수 (아들) - 010-9876-5432',
    healthStatus: 'Good',
    medicalNotes: '고혈압 약물 복용 중',
    joinDate: '2024-01-15',
    currentWeek: 12,
    completedPrograms: 2,
    currentProgram: 'Cognitive Enhancement Level 3',
    programStartDate: '2024-06-01',
    targetGoals: '기억력 향상, 균형감각 개선',
    preferences: {
      preferredTime: 'Morning (9-11 AM)',
      difficulty: 'Intermediate',
      sessionDuration: '45 minutes'
    },
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face'
  },
  2: {
    id: 2,
    name: '박철수',
    phone: '+82-10-2345-6789',
    email: 'parkcs@example.com',
    age: 72,
    birthDate: '1952-08-22',
    gender: 'Male',
    address: '서울시 종로구 종로 456',
    emergencyContact: '박미영 (딸) - 010-8765-4321',
    healthStatus: 'Fair',
    medicalNotes: '당뇨 관리 중, 무릎 관절염',
    joinDate: '2024-02-20',
    currentWeek: 8,
    completedPrograms: 1,
    currentProgram: 'Physical Therapy Level 2',
    programStartDate: '2024-05-15',
    targetGoals: '관절 가동성 개선, 체력 증진',
    preferences: {
      preferredTime: 'Afternoon (2-4 PM)',
      difficulty: 'Beginner',
      sessionDuration: '30 minutes'
    },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  3: {
    id: 3,
    name: '이순자',
    phone: '+82-10-3456-7890',
    email: 'leesj@example.com',
    age: 68,
    birthDate: '1956-12-03',
    gender: 'Female',
    address: '서울시 서초구 서초대로 789',
    emergencyContact: '이동훈 (아들) - 010-7654-3210',
    healthStatus: 'Excellent',
    medicalNotes: '특이사항 없음',
    joinDate: '2023-10-10',
    currentWeek: 24,
    completedPrograms: 3,
    currentProgram: 'Advanced Wellness Program',
    programStartDate: '2024-01-08',
    targetGoals: '전반적 건강 유지, 사회활동 증진',
    preferences: {
      preferredTime: 'Morning (10-12 PM)',
      difficulty: 'Advanced',
      sessionDuration: '60 minutes'
    },
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  }
}

export default function OrgUserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params['org-id'] as string
  const userId = parseInt(params['user-id'] as string)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(orgUserProfiles[userId as keyof typeof orgUserProfiles] || {})

  const user = orgUserProfiles[userId as keyof typeof orgUserProfiles]

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

  const handleSave = () => {
    console.log('Saving profile data:', formData)
    setIsEditing(false)
    // Here you would typically save to your backend
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800'
      case 'Good': return 'bg-blue-100 text-blue-800'
      case 'Fair': return 'bg-yellow-100 text-yellow-800'
      case 'Poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                <h1 className="text-2xl font-semibold text-[#111]">User Profile</h1>
                <p className="text-[#555]">{user.name} • Member since {user.joinDate}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-[#111] hover:bg-[#222] text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#111] flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? formData.name : user.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={user.age}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={user.gender}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    value={user.birthDate}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={isEditing ? formData.phone : user.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={isEditing ? formData.email : user.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={isEditing ? formData.address : user.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={isEditing ? formData.emergencyContact : user.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Health & Program Information */}
          <div className="space-y-6">
            {/* Health Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#111]">Health Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="healthStatus">Health Status</Label>
                  <div className="mt-2">
                    <Badge className={getHealthStatusColor(user.healthStatus)}>
                      {user.healthStatus}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicalNotes">Medical Notes</Label>
                  <Textarea
                    id="medicalNotes"
                    value={isEditing ? formData.medicalNotes : user.medicalNotes}
                    onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Program Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#111]">Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Week</Label>
                    <div className="mt-2">
                      <Badge variant="outline">{user.currentWeek}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Completed Programs</Label>
                    <div className="mt-2">
                      <Badge variant="outline">{user.completedPrograms}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Current Program</Label>
                  <Input
                    value={user.currentProgram}
                    readOnly
                    className="bg-gray-50 mt-2"
                  />
                </div>

                <div>
                  <Label>Program Start Date</Label>
                  <Input
                    value={user.programStartDate}
                    readOnly
                    className="bg-gray-50 mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="targetGoals">Target Goals</Label>
                  <Textarea
                    id="targetGoals"
                    value={isEditing ? formData.targetGoals : user.targetGoals}
                    onChange={(e) => handleInputChange('targetGoals', e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#111]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/org/${orgId}/users/${userId}/messages`)}
                  >
                    Send Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New Program
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}