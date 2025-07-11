'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, MessageSquare, Calendar, User } from 'lucide-react'

// 기관별 사용자 데이터
const orgUserData = {
  1: { id: 1, name: '김영희', phone: '+82-10-1234-5678', age: 66 },
  2: { id: 2, name: '박철수', phone: '+82-10-2345-6789', age: 72 },
  3: { id: 3, name: '이순자', phone: '+82-10-3456-7890', age: 68 },
  4: { id: 4, name: '최미영', phone: '+82-10-4567-8901', age: 58 },
  5: { id: 5, name: '정동현', phone: '+82-10-5678-9012', age: 76 }
}

// 메시지 데이터
const messageData = [
  {
    id: 1,
    sender: 'admin',
    message: '안녕하세요! 오늘 운동은 어떠셨나요?',
    timestamp: '2025-07-11 09:30',
    read: true
  },
  {
    id: 2,
    sender: 'user',
    message: '좋았습니다! 오늘 새로운 운동을 배웠어요.',
    timestamp: '2025-07-11 10:15',
    read: true
  },
  {
    id: 3,
    sender: 'admin',
    message: '잘하고 계시네요! 내일도 화이팅하세요 💪',
    timestamp: '2025-07-11 10:20',
    read: true
  },
  {
    id: 4,
    sender: 'user',
    message: '감사합니다. 내일도 열심히 하겠습니다!',
    timestamp: '2025-07-11 14:45',
    read: false
  }
]

export default function OrgUserMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params['org-id'] as string
  const userId = parseInt(params['user-id'] as string)
  const [newMessage, setNewMessage] = useState('')

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      console.log('Sending message:', newMessage)
      setNewMessage('')
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
              <MessageSquare className="h-8 w-8 text-[#111]" />
              <div>
                <h1 className="text-2xl font-semibold text-[#111]">Messages</h1>
                <p className="text-[#555]">{user.name} • {user.phone}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push(`/org/${orgId}/users/${userId}`)}
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        </div>

        {/* Messages Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111] flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation with {user.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Messages List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messageData.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'admin'
                        ? 'bg-[#111] text-white'
                        : 'bg-gray-100 text-[#111]'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        msg.sender === 'admin' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </span>
                      {msg.sender === 'admin' && (
                        <Badge 
                          variant={msg.read ? 'secondary' : 'default'}
                          className="text-xs ml-2"
                        >
                          {msg.read ? 'Read' : 'Sent'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-[#111] hover:bg-[#222] text-white self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-[#111] mx-auto mb-2" />
                <h3 className="font-medium text-[#111]">Schedule Session</h3>
                <p className="text-xs text-[#555] mt-1">Book a training session</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-center">
                <User className="h-8 w-8 text-[#111] mx-auto mb-2" />
                <h3 className="font-medium text-[#111]">View Progress</h3>
                <p className="text-xs text-[#555] mt-1">Check training progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-[#111] mx-auto mb-2" />
                <h3 className="font-medium text-[#111]">Quick Reply</h3>
                <p className="text-xs text-[#555] mt-1">Send common responses</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}