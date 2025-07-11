'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Plus, Video, MessageSquare, Trash2, X, Calendar, MapPin, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface OrganizationInfo {
  id: string
  name: string
  org_type: string
  is_active: boolean
}

// 기관별 앱 사용자 데이터 (실제로는 API에서 가져와야 함)
const dummyOrgUsers = [
  {
    id: 1,
    name: '김영희',
    phone: '+82-10-1234-5678',
    age: 66,
    currentWeek: 12,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 2,
    name: '박철수',
    phone: '+82-10-2345-6789',
    age: 72,
    currentWeek: 8,
    progress: 45,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 3,
    name: '이순자',
    phone: '+82-10-3456-7890',
    age: 68,
    currentWeek: 24,
    progress: 100,
    status: 'Completed',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 4,
    name: '최미영',
    phone: '+82-10-4567-8901',
    age: 58,
    currentWeek: 2,
    progress: 15,
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 5,
    name: '정동현',
    phone: '+82-10-5678-9012',
    age: 76,
    currentWeek: null,
    progress: 0,
    status: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
  }
]

export default function OrgUsersPage() {
  const params = useParams()
  const orgId = params['org-id'] as string
  const { user } = useAuth()
  
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    grade: '',
    guardian: '',
    address: '',
    healthStatus: '',
    
    // Step 2: Program Setup
    programType: '',
    startDate: '',
    sessionFrequency: '',
    preferredTime: '',
    specialRequirements: '',
    
    // Step 3: Initial Assessment
    cognitiveLevel: '',
    physicalLevel: '',
    primaryGoals: '',
    medicalNotes: '',
    emergencyContact: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'Inactive':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'Suspended':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'Pending':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'Completed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const filteredUsers = dummyOrgUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log('Creating user with program setup:', formData)
    // Here you would typically send the data to your backend
    setIsCreateUserOpen(false)
    setCurrentStep(1)
    // Reset form
    setFormData({
      fullName: '',
      gender: '',
      birthDate: '',
      phone: '',
      grade: '',
      guardian: '',
      address: '',
      healthStatus: '',
      programType: '',
      startDate: '',
      sessionFrequency: '',
      preferredTime: '',
      specialRequirements: '',
      cognitiveLevel: '',
      physicalLevel: '',
      primaryGoals: '',
      medicalNotes: '',
      emergencyContact: ''
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information'
      case 2: return 'Program Setup'
      case 3: return 'Initial Assessment'
      default: return 'Create User'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Enter user personal and contact information'
      case 2: return 'Configure training program and schedule'
      case 3: return 'Set initial assessments and goals'
      default: return 'Please enter following information'
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch organization info
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
          <p className="mt-2 text-[#555]">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#111]">User Management</h1>
            <p className="text-[#555]">Manage and monitor {organization?.name} app users and training progress</p>
          </div>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#111] hover:bg-[#222] text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-800 text-white p-6 relative">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">{getStepTitle()}</DialogTitle>
                  <p className="text-gray-300 text-sm mt-1">{getStepDescription()}</p>
                </DialogHeader>
                <button 
                  onClick={() => {
                    setIsCreateUserOpen(false)
                    setCurrentStep(1)
                  }}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                    <span>Step {currentStep} of 3</span>
                    <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={formData.gender === 'Male' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('gender', 'Male')}
                        className="w-full"
                      >
                        Male
                      </Button>
                      <Button
                        type="button"
                        variant={formData.gender === 'Female' ? 'default' : 'outline'}
                        onClick={() => handleInputChange('gender', 'Female')}
                        className="w-full"
                      >
                        Female
                      </Button>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
                    <div className="relative">
                      <Input
                        id="birthDate"
                        type="text"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full pr-10"
                        placeholder="YYYY-MM-DD"
                        onFocus={(e) => {
                          e.target.type = 'date';
                        }}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.type = 'text';
                          }
                        }}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer z-10" 
                        onClick={() => {
                          const input = document.getElementById('birthDate') as HTMLInputElement;
                          if (input) {
                            input.type = 'date';
                            input.focus();
                            if (input.showPicker) {
                              input.showPicker();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <Input
                      placeholder="Enter your cell phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Guardian */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Contact</label>
                    <Input
                      placeholder="Enter guardian name"
                      value={formData.guardian}
                      onChange={(e) => handleInputChange('guardian', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <Input
                        placeholder="Enter your address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full pr-10"
                      />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Health Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Health Status</label>
                    <Select value={formData.healthStatus} onValueChange={(value) => handleInputChange('healthStatus', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={handleSubmit}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-12 py-2 w-full max-w-xs"
                  >
                    CONFIRM
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#555] h-4 w-4" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>
          <Button variant="outline" className="bg-white border-gray-300">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F7F7] border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">NAME</th>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">AGE</th>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">CURRENT</th>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">IN PROGRESS</th>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">STATUS</th>
                  <th className="text-left py-4 px-6 font-medium text-[#555] uppercase tracking-wider text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/org/${orgId}/users/${user.id}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-[#111]">
                            {user.name}
                          </div>
                          <div className="text-sm text-[#555]">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#111]">{user.age}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-[#111]">
                        {user.currentWeek ? (
                          <>
                            <span className="font-medium">{user.currentWeek}</span>
                            <span className="text-[#555] ml-1">week</span>
                          </>
                        ) : (
                          <span className="text-[#777]">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32 bg-[#F7F7F7] rounded-full h-6 relative">
                        <div
                          className="bg-[#333] h-6 rounded-full transition-all duration-300"
                          style={{ width: `${user.progress}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {user.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        {user.status === 'Completed' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/org/${orgId}/users/${user.id}/profile`;
                            }}
                            title="Start New Program"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#555] hover:text-[#111]"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Video action logic here
                            }}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#555] hover:text-[#111]"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/org/${orgId}/users/${user.id}/messages`;
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#555] hover:text-[#111]"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete action logic here
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500">
                &lt;
              </Button>
              <Button variant="ghost" size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                1
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                2
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                3
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                4
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                5
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                6
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                7
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500">
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}