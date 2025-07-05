'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Send, 
  Plus, 
  Search,
  Phone,
  Mail,
  User,
  Calendar,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react'

// 더미 사용자 데이터
const userData = {
  1: {
    id: 1,
    name: 'Marilou Kirn',
    phone: '+1-328-857-2537',
    email: 'marilou.kirn@email.com',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=60&h=60&fit=crop&crop=face',
    status: 'Active',
    lastSeen: '2025-07-05 10:30:00'
  }
}

// 더미 메시지 데이터
const messageHistory = [
  {
    id: 1,
    type: 'sent',
    subject: 'Weekly Progress Update',
    content: 'Hello Marilou! Your progress this week has been excellent. You completed 4 out of 4 scheduled sessions with an average score of 92%. Keep up the great work!',
    timestamp: '2025-07-04 14:30:00',
    status: 'read',
    method: 'email'
  },
  {
    id: 2,
    type: 'received',
    subject: 'Session Inquiry',
    content: 'Hi, I wanted to ask about rescheduling tomorrow\'s session. I have a doctor\'s appointment that came up. Is it possible to move it to later in the week?',
    timestamp: '2025-07-03 16:45:00',
    status: 'replied',
    method: 'email'
  },
  {
    id: 3,
    type: 'sent',
    subject: 'Session Reminder',
    content: 'This is a friendly reminder that you have a cognitive training session scheduled for tomorrow at 10:00 AM. Please let us know if you need to reschedule.',
    timestamp: '2025-07-02 18:00:00',
    status: 'read',
    method: 'sms'
  },
  {
    id: 4,
    type: 'sent',
    subject: 'Welcome to Brain Health Program',
    content: 'Welcome to our 6-month Brain Health Training Program! We\'re excited to work with you on this journey. Your first session is scheduled for next Monday.',
    timestamp: '2025-06-28 09:15:00',
    status: 'read',
    method: 'email'
  }
]

export default function UserMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    method: 'email',
    urgent: false
  })

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

  const filteredMessages = messageHistory.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />
      case 'received':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-[#555]" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'replied':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getMethodBadge = (method: string) => {
    const baseClass = "text-xs px-2 py-1 rounded-full"
    switch (method) {
      case 'email':
        return `${baseClass} bg-blue-100 text-blue-700`
      case 'sms':
        return `${baseClass} bg-green-100 text-green-700`
      case 'phone':
        return `${baseClass} bg-purple-100 text-purple-700`
      default:
        return `${baseClass} bg-gray-100 text-gray-700`
    }
  }

  const handleSendMessage = () => {
    // Here you would typically send the message to your backend
    console.log('Sending message:', newMessage)
    setIsComposeOpen(false)
    setNewMessage({
      subject: '',
      content: '',
      method: 'email',
      urgent: false
    })
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
              <h1 className="text-2xl font-semibold text-[#111]">Messages</h1>
              <p className="text-[#555]">Communication history with {user.name}</p>
            </div>
          </div>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#111] hover:bg-[#222] text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Compose Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Send Message to {user.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#555] mb-2">Method</label>
                    <Select value={newMessage.method} onValueChange={(value) => setNewMessage({...newMessage, method: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={newMessage.urgent}
                        onChange={(e) => setNewMessage({...newMessage, urgent: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-[#555]">Mark as Urgent</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-2">Subject</label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    placeholder="Enter message subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-2">Message</label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSendMessage} className="flex-1 bg-[#111] hover:bg-[#222] text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsComposeOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Search */}
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-[#111]">{user.name}</h3>
                    <p className="text-sm text-[#555]">Status: {user.status}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[#555]" />
                    <span className="text-[#111]">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-[#555]" />
                    <span className="text-[#111]">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-[#555]" />
                    <span className="text-[#111]">Last seen: {user.lastSeen}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search & Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Search Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#555] h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filter
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Message Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#111]">{messageHistory.filter(m => m.type === 'sent').length}</div>
                    <div className="text-[#555]">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#111]">{messageHistory.filter(m => m.type === 'received').length}</div>
                    <div className="text-[#555]">Received</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#111]">{messageHistory.filter(m => m.status === 'read').length}</div>
                    <div className="text-[#555]">Read</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#111]">{messageHistory.filter(m => m.method === 'email').length}</div>
                    <div className="text-[#555]">Emails</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Message List & Detail */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#111]">Message History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-[#F7F7F7] ${
                        selectedMessage?.id === message.id ? 'bg-[#F7F7F7] border-[#333]' : 'bg-white border-gray-200'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(message.type)}
                          <h4 className="font-medium text-[#111] text-sm">{message.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getMethodBadge(message.method)}>
                            {message.method.toUpperCase()}
                          </Badge>
                          {getStatusIcon(message.status)}
                        </div>
                      </div>
                      <p className="text-sm text-[#555] line-clamp-2 mb-2">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#555]">
                        <span>{message.timestamp}</span>
                        <span className="capitalize">{message.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Detail */}
            {selectedMessage && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-[#111]">Message Details</CardTitle>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Mark as Read
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#555]">Type: </span>
                      <span className="font-medium text-[#111] capitalize">{selectedMessage.type}</span>
                    </div>
                    <div>
                      <span className="text-[#555]">Method: </span>
                      <Badge className={getMethodBadge(selectedMessage.method)}>
                        {selectedMessage.method.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[#555]">Status: </span>
                      <span className="font-medium text-[#111] capitalize">{selectedMessage.status}</span>
                    </div>
                    <div>
                      <span className="text-[#555]">Timestamp: </span>
                      <span className="font-medium text-[#111]">{selectedMessage.timestamp}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111] mb-2">Subject</h4>
                    <p className="text-[#111] bg-[#F7F7F7] p-3 rounded-md">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111] mb-2">Content</h4>
                    <div className="text-[#111] bg-[#F7F7F7] p-4 rounded-md whitespace-pre-wrap">
                      {selectedMessage.content}
                    </div>
                  </div>
                  {selectedMessage.type === 'received' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button className="flex-1 bg-[#111] hover:bg-[#222] text-white">
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Forward
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}