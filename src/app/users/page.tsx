'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Plus, Video, MessageSquare, Trash2, X, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

// 더미 데이터
const dummyUsers = [
  {
    id: 1,
    name: 'Marilou Kirn',
    phone: '+1-328-857-2537',
    age: 66,
    currentWeek: 12,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Kathlyn Karl',
    phone: '+1-523-317-7761',
    age: 55,
    currentWeek: 1,
    progress: 0,
    status: 'Suspended',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Rosemary Mckune',
    phone: '+1-369-441-8619',
    age: 67,
    currentWeek: 34,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Yelena Heywood',
    phone: '+1-636-613-5429',
    age: 58,
    currentWeek: 23,
    progress: 65,
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 5,
    name: 'Dorotha Northum',
    phone: '+1-547-538-9848',
    age: 76,
    currentWeek: 5,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 6,
    name: 'Buford Banuelos',
    phone: '+1-557-680-6290',
    age: 77,
    currentWeek: 2,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 7,
    name: 'Yelena Fannell',
    phone: '+1-547-538-9848',
    age: 73,
    currentWeek: 10,
    progress: 65,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 8,
    name: 'Alfred Mallin',
    phone: '+1-404-724-1937',
    age: 70,
    currentWeek: null,
    progress: 65,
    status: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  }
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    grade: '',
    guardian: '',
    address: '',
    healthStatus: ''
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
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const filteredUsers = dummyUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = () => {
    console.log('Creating user:', formData)
    // Here you would typically send the data to your backend
    setIsCreateUserOpen(false)
    // Reset form
    setFormData({
      fullName: '',
      gender: '',
      birthDate: '',
      phone: '',
      grade: '',
      guardian: '',
      address: '',
      healthStatus: ''
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#111]">User Management</h1>
            <p className="text-[#555]">Manage and monitor user accounts and training progress</p>
          </div>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#111] hover:bg-[#222] text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-800 text-white p-6 relative">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Create User</DialogTitle>
                  <p className="text-gray-300 text-sm mt-1">Please enter following information</p>
                </DialogHeader>
                <button 
                  onClick={() => setIsCreateUserOpen(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
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
                        className="w-full pr-10 [&::-webkit-calendar-picker-indicator]:lang(en-US)"
                        placeholder="YYYY-MM-DD"
                        lang="en-US"
                        data-locale="en-US"
                        style={{ 
                          '--webkit-locale': '"en-US"',
                          locale: 'en-US'
                        } as React.CSSProperties}
                        onFocus={(e) => {
                          e.target.type = 'date';
                          e.target.setAttribute('lang', 'en-US');
                          e.target.setAttribute('data-locale', 'en-US');
                          // Force English locale for WebKit browsers
                          if (e.target.style) {
                            e.target.style.setProperty('--webkit-locale', '"en-US"');
                          }
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
                            input.setAttribute('lang', 'en-US');
                            input.setAttribute('data-locale', 'en-US');
                            // Force English locale for WebKit browsers
                            if (input.style) {
                              input.style.setProperty('--webkit-locale', '"en-US"');
                            }
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
                      placeholder="Enter your full name"
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
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/users/${user.id}`}>
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#555] hover:text-[#111]"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Message action logic here
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