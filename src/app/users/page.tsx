'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, Video, MessageSquare, Trash2 } from 'lucide-react'
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
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b739fcae?w=60&h=60&fit=crop&crop=face'
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">NAME</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">AGE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">CURRENT</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">IN PROGRESS</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">STATUS</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700 uppercase tracking-wider text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div>
                          <Link href={`/users/${user.id}`}>
                            <div className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer">
                              {user.name}
                            </div>
                          </Link>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">{user.age}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {user.currentWeek ? (
                          <>
                            <span className="font-medium">{user.currentWeek}</span>
                            <span className="text-gray-500 ml-1">week</span>
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gray-700 h-6 rounded-full transition-all duration-300"
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
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
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