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

interface Senior {
  id: string
  name: string
  phone: string | null
  birth: string
  gender_enum: 'M' | 'F'
  created_at: string
}

interface OrgUser {
  id: string
  name: string
  phone: string
  age: number
  currentWeek: string | null
  progress: number
  status: string
  avatar: string
}

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
  const [users, setUsers] = useState<OrgUser[]>([])
  const [fetchingUsers, setFetchingUsers] = useState(false)
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

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true)
      const response = await fetch(`/api/seniors?org_id=${orgId}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Transform seniors data to OrgUser format
        const transformedUsers: OrgUser[] = result.seniors.map((senior: Senior) => {
          const birthDate = new Date(senior.birth)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          
          // Calculate session number based on registration order and activity
          const createdDate = new Date(senior.created_at)
          const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (24 * 60 * 60 * 1000))
          
          // Calculate session number (simulate training sessions)
          const sessionNumber = Math.max(1, Math.floor(daysSinceCreated / 3) + 1) // New session every 3 days
          
          // Determine status based on recent activity
          let status = 'Active'
          if (daysSinceCreated <= 1) status = 'Active'
          else if (daysSinceCreated <= 7) status = 'Recent'
          else status = 'Pending'
          
          // Generate consistent avatar based on gender
          const avatar = senior.gender_enum === 'M' 
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
            : 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
          
          return {
            id: senior.id,
            name: senior.name,
            phone: senior.phone || 'N/A',
            age: age,
            currentWeek: `Session ${sessionNumber}`,
            progress: Math.min(sessionNumber * 8, 100), // Progress based on sessions
            status: status,
            avatar: avatar
          }
        })
        
        setUsers(transformedUsers)
      } else {
        console.error('Failed to fetch users:', result)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setFetchingUsers(false)
    }
  }

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
      case 'Recent':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  // Pagination logic
  const USERS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE
  const endIndex = startIndex + USERS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

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

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // Prepare the data for API call
      const requestData = {
        ...formData,
        orgId: orgId
      }
      
      const response = await fetch('/api/seniors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }
      
      console.log('✅ User created successfully:', result)
      
      // Refresh user list to show new user
      await fetchUsers()
      
      // Close dialog and reset form
      setIsCreateUserOpen(false)
      setCurrentStep(1)
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
      
    } catch (error) {
      console.error('❌ Error creating user:', error)
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
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
        
        // Fetch users for this organization
        await fetchUsers()
        
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
              onChange={(e) => handleSearchChange(e.target.value)}
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
                {paginatedUsers.map((user) => (
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
                          <span className="font-medium">{user.currentWeek}</span>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    size="sm"
                    className={`${
                      currentPage === pageNum
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
                
                {/* Next Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </Button>
              </div>
              
              {/* Page Info */}
              <div className="ml-4 text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}